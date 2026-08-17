import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'instructor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, category, instructor, price, capacity, image, description } = body;

    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
    }

    const numPrice = price !== undefined ? Math.max(0, Number(price)) : existingCourse.price;
    const numCapacity = capacity !== undefined ? Math.max(1, Number(capacity)) : existingCourse.capacity;

    const course = await prisma.course.update({
      where: { id },
      data: {
        title: title || existingCourse.title,
        category: category || existingCourse.category,
        instructor: instructor || existingCourse.instructor,
        price: numPrice,
        capacity: numCapacity,
        image: image || existingCourse.image,
        description: description || existingCourse.description
      }
    });

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Admin',
        action: 'تعديل دورة تدريبية',
        resource: course.title,
        ip: '127.0.0.1',
        severity: 'info'
      }
    });

    return NextResponse.json({ success: true, course }, { status: 200 });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cascade delete relations safely
    await prisma.enrollment.deleteMany({ where: { courseId: id } });
    await prisma.question.deleteMany({
      where: { exam: { courseId: id } }
    });
    await prisma.exam.deleteMany({ where: { courseId: id } });

    await prisma.course.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Admin',
        action: 'حذف دورة تدريبية',
        resource: id,
        ip: '127.0.0.1',
        severity: 'warning'
      }
    });

    return NextResponse.json({ success: true, message: 'تم حذف الدورة بنجاح' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
