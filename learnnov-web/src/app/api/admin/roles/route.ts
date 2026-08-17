import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Add a new Role
export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: { name, description } // Note: code does not exist on Prisma schema for Role? Let's check. Wait, in schema.prisma, Role only has id, name, description. So `name` is the unique identifier like 'admin'. The UI uses `code`. We'll just map name.
    });

    return NextResponse.json({ success: true, role }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Assign/Revoke a Permission to a Role
export async function PUT(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { roleId, permissionId, action } = body; // action is 'assign' or 'revoke'

    if (!roleId || !permissionId || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (action === 'assign') {
      const rp = await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId }
      });
      return NextResponse.json({ success: true, rolePermission: rp }, { status: 200 });
    } else if (action === 'revoke') {
      await prisma.rolePermission.delete({
        where: { roleId_permissionId: { roleId, permissionId } }
      }).catch(() => {}); // Ignore if it doesn't exist
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error modifying role permission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
