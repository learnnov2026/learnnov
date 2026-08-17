import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { title, content, category } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Missing title or content' }, { status: 400 });
    }

    const authorRole = payload.role === 'admin' 
      ? 'مدير النظام' 
      : payload.role === 'instructor' 
      ? 'محاضر خبير' 
      : 'طالب في المنصة';

    const post = await prisma.discussionPost.create({
      data: {
        author: payload.name || 'مستخدم ليرنوف',
        authorRole,
        avatar: payload.role === 'instructor' ? '👨‍🏫' : payload.role === 'admin' ? '👑' : '🎓',
        title,
        content,
        category: category || 'عام ومناقشات',
        likes: 0,
        replies: 0,
        timestamp: 'الآن'
      }
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error('Error creating discussion post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
