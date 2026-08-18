import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'manage', resource: 'admin' }
    });

    if (!auth.authorized) {
      return auth.response!;
    }

    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (key) {
      const setting = await prisma.systemSettings.findUnique({ where: { key } });
      return NextResponse.json(setting ? JSON.parse(setting.value) : null);
    }

    const settings = await prisma.systemSettings.findMany();
    const result = settings.reduce((acc, s) => ({ ...acc, [s.key]: JSON.parse(s.value) }), {});
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'manage', resource: 'admin' }
    });

    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    const setting = await prisma.systemSettings.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) }
    });

    return NextResponse.json({ success: true, setting: JSON.parse(setting.value) });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
