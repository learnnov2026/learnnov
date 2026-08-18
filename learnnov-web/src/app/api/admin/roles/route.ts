import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/rbac';

// Add a new Role
export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'manage', resource: 'admin' }
    });

    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const { name, code, description } = body;

    const roleName = (code || name || '').trim().toLowerCase();

    if (!roleName) {
      return NextResponse.json({ error: 'يرجى إدخال اسم ورمز الدور المطلوب' }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name: roleName,
        description: description || name
      }
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
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'manage', resource: 'admin' }
    });

    if (!auth.authorized) {
      return auth.response!;
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
