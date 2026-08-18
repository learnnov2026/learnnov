import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const { id, threadId } = await params;
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    let authorName = 'طالب ليرنوف';
    let isInstructor = false;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        authorName = payload.name;
        isInstructor = payload.role === 'instructor' || payload.role === 'admin';
      }
    }

    const body = await request.json();
    const { body: replyBody, content } = body;
    const finalContent = replyBody || content || '';

    // Update the discussion post reply count
    const post = await prisma.discussionPost.findFirst({
      where: {
        OR: [
          { id: threadId },
          { id: String(threadId) }
        ]
      }
    });

    if (post) {
      await prisma.discussionPost.update({
        where: { id: post.id },
        data: { replies: { increment: 1 } }
      });
    }

    const replyResponse = {
      id: Date.now(),
      author: {
        username: authorName,
        first_name: authorName,
        last_name: ''
      },
      is_instructor_reply: isInstructor,
      body: finalContent,
      created_at: new Date().toISOString()
    };

    return NextResponse.json(replyResponse, { status: 201 });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
