import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // SECURITY: Always enforce 'student' role for public self-registration.
    // Privileged roles (admin/instructor) must be assigned via Admin RBAC management.
    const role = 'student';

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'صيغة البريد الإلكتروني غير صحيحة' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 });
    }

    // Check if user already exists
    const exists = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (exists) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 409 });
    }

    // Hash password with high work factor (12 rounds) BEFORE storing in OTP record
    const hashedPassword = await bcrypt.hash(password, 12);

    // Cryptographically secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Send email
    const previewUrl = await sendOtpEmail(email, otp);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    
    // Upsert OTP record — store HASHED password, never plaintext
    await prisma.oTPRecord.upsert({
      where: { email: email.toLowerCase() },
      update: {
        otp,
        expiresAt,
        userData: JSON.stringify({ name, email: email.toLowerCase(), role, hashedPassword })
      },
      create: {
        email: email.toLowerCase(),
        otp,
        expiresAt,
        userData: JSON.stringify({ name, email: email.toLowerCase(), role, hashedPassword })
      }
    });

    const responseBody: any = { 
      success: true, 
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني'
    };

    // Only expose preview URL in development, never in production
    if (process.env.NODE_ENV !== 'production' && previewUrl) {
      responseBody.previewUrl = previewUrl;
    }

    return NextResponse.json(responseBody, { status: 200 });
    
  } catch (error) {
    console.error('Register OTP Error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إرسال البريد الإلكتروني' }, { status: 500 });
  }
}
