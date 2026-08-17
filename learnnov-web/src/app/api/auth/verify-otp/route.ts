import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Missing email or OTP' }, { status: 400 });
    }

    // Find valid OTP
    const record = await prisma.oTPRecord.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!record || record.otp !== otp) {
      return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 400 });
    }

    if (Date.now() > record.expiresAt.getTime()) {
      await prisma.oTPRecord.delete({ where: { id: record.id } });
      return NextResponse.json({ error: 'انتهت صلاحية رمز التحقق' }, { status: 400 });
    }

    if (!record.userData) {
      return NextResponse.json({ error: 'بيانات المستخدم غير موجودة' }, { status: 400 });
    }

    const userData = JSON.parse(record.userData);

    // OTP is valid. Find the corresponding Role in RBAC
    const rbacRole = await prisma.role.findUnique({
      where: { name: userData.role }
    });

    // SECURITY FIX: Use the pre-hashed password stored in OTPRecord
    const passwordToStore = userData.hashedPassword || userData.password;
    // If somehow we got a plaintext password (legacy), hash it now
    let finalPassword = passwordToStore;
    if (passwordToStore && !passwordToStore.startsWith('$2')) {
      const bcrypt = await import('bcryptjs');
      finalPassword = await bcrypt.hash(passwordToStore, 12);
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        roleId: rbacRole?.id, // Assign RBAC role ID
        password: finalPassword,
        status: 'active'
      }
    });

    // Remove the used OTP
    await prisma.oTPRecord.delete({ where: { id: record.id } });

    // Generate JWT
    const avatar = newUser.role === 'instructor' ? 'د' : newUser.role === 'admin' ? 'م' : 'أ';
    const token = await signToken({ userId: newUser.id, role: newUser.role, email: newUser.email, name: newUser.name, avatar });

    // Set HttpOnly Cookie
    const response = NextResponse.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, avatar } }, { status: 201 });
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
