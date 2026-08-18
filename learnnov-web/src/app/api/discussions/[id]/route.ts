import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if id is a specific post ID
    const singlePost = await prisma.discussionPost.findUnique({
      where: { id }
    });

    if (singlePost) {
      return NextResponse.json(singlePost, { status: 200 });
    }

    // Otherwise treat id as category/slug and return posts matching it or all posts
    const posts = await prisma.discussionPost.findMany({
      where: id && id !== 'all' ? {
        OR: [
          { category: { contains: id } },
          { id }
        ]
      } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    const threads = posts.map(p => ({
      id: p.id,
      title: p.title,
      author: {
        username: p.author,
        first_name: p.author,
        last_name: ''
      },
      body: p.content,
      reply_count: p.replies,
      created_at: p.createdAt.toISOString(),
      posts: []
    }));

    return NextResponse.json(threads, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    let authorName = 'طالب ليرنوف';
    let authorRole = 'طالب';
    let avatar = '🎓';

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        authorName = payload.name;
        authorRole = payload.role === 'admin' ? 'مدير النظام' : payload.role === 'instructor' ? 'محاضر خبير' : 'طالب';
        avatar = payload.role === 'instructor' ? '👨‍🏫' : payload.role === 'admin' ? '👑' : '🎓';
      }
    }

    const body = await request.json();
    const { title, body: contentText, content } = body;

    const finalContent = contentText || content || '';
    const finalTitle = title || 'مناقشة جديدة';

    const post = await prisma.discussionPost.create({
      data: {
        author: authorName,
        authorRole,
        avatar,
        title: finalTitle,
        content: finalContent,
        category: id || 'عام',
        likes: 0,
        replies: 0,
        timestamp: 'الآن'
      }
    });

    const thread = {
      id: post.id,
      title: post.title,
      author: {
        username: post.author,
        first_name: post.author,
        last_name: ''
      },
      body: post.content,
      reply_count: 0,
      created_at: post.createdAt.toISOString(),
      posts: []
    };

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error('Error creating thread in category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { title, content, category } = body;

    const post = await prisma.discussionPost.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });
    }

    // Only the author or an admin can edit the post
    if (payload.role !== 'admin' && post.author !== payload.name) {
      return NextResponse.json({ error: 'غير مصرح لك بتعديل هذا المنشور' }, { status: 403 });
    }

    const updated = await prisma.discussionPost.update({
      where: { id },
      data: {
        title: title || undefined,
        content: content || undefined,
        category: category || undefined
      }
    });

    return NextResponse.json({ success: true, post: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating discussion post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { id } = await params;

    const post = await prisma.discussionPost.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });
    }

    // Only the author or an admin can delete the post
    if (payload.role !== 'admin' && post.author !== payload.name) {
      return NextResponse.json({ error: 'غير مصرح لك بحذف هذا المنشور' }, { status: 403 });
    }

    await prisma.discussionPost.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'تم حذف المنشور بنجاح' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting discussion post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
