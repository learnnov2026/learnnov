import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingPost = await prisma.discussionPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });
    }

    const post = await prisma.discussionPost.update({
      where: { id },
      data: {
        likes: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ success: true, likes: post.likes }, { status: 200 });
  } catch (error) {
    console.error('Error liking discussion post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
