import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Strict Password Validation Helper
function validateStrictPassword(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 10) {
    return { isValid: false, error: 'كلمة المرور يجب ألا تقل عن 10 خانات' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z)' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل (a-z)' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل (0-9)' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    return { isValid: false, error: 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%...)' };
  }
  return { isValid: true };
}

// Strict Username Validation Helper
function validateStrictUsername(username: string): { isValid: boolean; error?: string } {
  const trimmed = username.trim();
  if (!trimmed || trimmed.length < 3) {
    return { isValid: false, error: 'اسم المستخدم يجب ألا يقل عن 3 أحرف' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, error: 'اسم المستخدم يجب ألا يتجاوز 50 حرفاً' };
  }
  if (/[<>{}\\\/]/.test(trimmed)) {
    return { isValid: false, error: 'اسم المستخدم يحتوي على رموز غير مسموح بها' };
  }
  return { isValid: true };
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح: يرجى تسجيل الدخول أولاً' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'جلسة الدخول منتهية أو غير صالحة' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود بالنظام' }, { status: 404 });
    }

    const body = await request.json();
    const { username, currentPassword, newPassword, confirmPassword } = body;

    const updateData: any = {};
    let auditAction = 'تحديث بيانات الحساب والأمان';

    // 1. Process Username / Display Name Change
    if (username && username.trim() !== user.name) {
      const usernameValidation = validateStrictUsername(username);
      if (!usernameValidation.isValid) {
        return NextResponse.json({ error: usernameValidation.error }, { status: 400 });
      }

      // Check duplicate name if different user
      const existingWithName = await prisma.user.findFirst({
        where: {
          name: { equals: username.trim(), mode: 'insensitive' },
          id: { not: user.id }
        }
      });

      if (existingWithName) {
        return NextResponse.json({ error: 'اسم المستخدم هذا مستخدم مسبقاً من قِبل حساب آخر' }, { status: 409 });
      }

      updateData.name = username.trim();
      auditAction += ` | تغيير اسم المستخدم إلى (${username.trim()})`;
    }

    // 2. Process Strict Password Change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'يرجى إدخال كلمة المرور الحالية للتحقق من هويتك' }, { status: 400 });
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' }, { status: 400 });
      }

      // Verify current password
      let isCurrentValid = false;
      if (user.password) {
        if (user.password.startsWith('$2')) {
          isCurrentValid = await bcrypt.compare(currentPassword, user.password);
        } else {
          isCurrentValid = user.password === currentPassword;
        }
      }

      if (!isCurrentValid) {
        return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
      }

      // Check if new password is same as old password
      if (currentPassword === newPassword) {
        return NextResponse.json({ error: 'كلمة المرور الجديدة لا يمكن أن تكون مطابقة لكلمة المرور الحالية' }, { status: 400 });
      }

      // Strict requirements verification
      const passwordValidation = validateStrictPassword(newPassword);
      if (!passwordValidation.isValid) {
        return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
      }

      // Hash with bcrypt 12 rounds
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedNewPassword;
      auditAction += ' | تغيير كلمة المرور وتطبيق الشروط الصارمة';
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'لم يتم إجراء أي تعديل' }, { status: 200 });
    }

    // Perform DB update
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    // Security Audit Trail
    await prisma.auditLog.create({
      data: {
        user: `${updatedUser.name} (${updatedUser.role})`,
        action: auditAction,
        resource: updatedUser.email,
        ip: '127.0.0.1',
        severity: 'warning'
      }
    });

    // Re-issue JWT token with updated info
    const avatar = updatedUser.role === 'instructor' ? 'د' : updatedUser.role === 'admin' ? 'م' : 'أ';
    const newToken = await signToken({
      userId: updatedUser.id,
      role: updatedUser.role,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar
    });

    const response = NextResponse.json({
      success: true,
      message: 'تم تحديث واعتماد بيانات الأمان وكلمة المرور بنجاح تام',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    }, { status: 200 });

    // Set updated cookie
    response.cookies.set({
      name: 'learnnov_session',
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });

    return response;
  } catch (error) {
    console.error('Security Update Error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم أثناء تحديث بيانات الأمان' }, { status: 500 });
  }
}
