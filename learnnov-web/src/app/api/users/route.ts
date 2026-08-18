import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/rbac';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'manage', resource: 'users' }
    });

    if (!auth.authorized) {
      return auth.response!;
    }

    const payload = auth.user!;

    const body = await request.json();
    const { name, email, password, role = 'student', status = 'active' } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'يرجى إدخال كافة الحقول الإلزامية (الاسم، البريد، وكلمة المرور)' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'كلمة المرور للمستخدم الجديد يجب ألا تقل عن 8 خانات' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً في النظام' }, { status: 409 });
    }

    // Lookup corresponding RBAC Role
    const rbacRole = await prisma.role.findUnique({
      where: { name: role }
    });

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        roleId: rbacRole?.id,
        status,
        avatar: role === 'instructor' ? 'د' : role === 'admin' ? 'م' : 'أ'
      }
    });

    // Record in Audit Trail
    await prisma.auditLog.create({
      data: {
        user: payload.name || 'مدير النظام',
        action: `تسجيل مستخدم جديد برتبة (${role})`,
        resource: user.email,
        ip: '127.0.0.1',
        severity: role === 'admin' || role === 'instructor' ? 'warning' : 'info'
      }
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
