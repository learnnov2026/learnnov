import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    let userId = '';
    
    if (!user) {
      // SECURITY: Public SSO auto-registration is strictly restricted to 'student' role.
      // Admin and Instructor/Supervisor accounts can only be provisioned inside the Admin Dashboard.
      const rbacRole = await prisma.role.findUnique({
        where: { name: 'student' }
      });

      user = await prisma.user.create({
        data: {
          name: name || 'طالب جديد (SSO)',
          email: email.toLowerCase(),
          role: 'student',
          roleId: rbacRole?.id,
          status: 'active'
        }
      });
      userId = user.id;
    } else {
      userId = user.id;
    }

    const avatar = user.role === 'instructor' ? 'د' : user.role === 'admin' ? 'م' : 'أ';
    const token = await signToken({ userId, role: user.role, email: user.email, name: user.name, avatar });

    const response = NextResponse.json({ success: true, user: { id: userId, name: user.name, email: user.email, role: user.role, avatar } }, { status: 200 });
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
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
