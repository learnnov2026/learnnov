import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const identifier = email.trim();

    // Authenticate natively via Cloud Database (Prisma) by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { name: { equals: identifier, mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      // SECURITY: Generic error message — don't reveal if email exists or not
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    // Check if account is suspended
    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'هذا الحساب موقوف. يرجى التواصل مع الدعم الفني.' }, { status: 403 });
    }

    // SECURITY FIX: Use bcrypt to compare hashed passwords
    let passwordValid = false;
    if (user.password) {
      if (user.password.startsWith('$2')) {
        // Password is properly hashed with bcrypt
        passwordValid = await bcrypt.compare(password, user.password);
      } else {
        // Legacy plaintext password — compare and upgrade to hash
        passwordValid = user.password === password;
        if (passwordValid) {
          // Upgrade to bcrypt on successful login
          const newHash = await bcrypt.hash(password, 12);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: newHash }
          });
        }
      }
    }

    if (!passwordValid) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    const avatar = user.role === 'instructor' ? 'د' : user.role === 'admin' ? 'م' : 'أ';
    const token = await signToken({ 
        userId: user.id, 
        role: user.role, 
        email: user.email, 
        name: user.name, 
        avatar
    });

    const response = NextResponse.json({ 
      success: true, 
      user: { name: user.name, email: user.email, role: user.role, avatar } 
    }, { status: 200 });

    response.cookies.set({
      name: 'learnnov_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;
  } catch (error: any) {
    console.error('Login Error:', error);
    // SECURITY: Never expose internal error details to clients
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
}
