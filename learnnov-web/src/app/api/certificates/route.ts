import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/rbac';

export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'create', resource: 'certificates' }
    });

    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const { userId, courseTitle, grade } = body;

    if (!userId || !courseTitle || !grade) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const verifyCode = `CERT-${Math.floor(1000 + Math.random() * 9000)}`;

    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseTitle,
        grade,
        verifyCode,
        is_specialization: false
      }
    });

    return NextResponse.json({ success: true, certificate }, { status: 201 });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
