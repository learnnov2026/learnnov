import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/rbac';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'create', resource: 'courses' }
    });

    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const { title, category, instructor, price, capacity, image, description, startDate } = body;

    if (!title || !category || !instructor || price === undefined || capacity === undefined || !description || !startDate) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title,
        category,
        instructor,
        price,
        capacity,
        image: image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        description,
        startDate: new Date(startDate)
      }
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
