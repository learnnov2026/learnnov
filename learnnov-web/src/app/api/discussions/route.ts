import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let posts = await prisma.discussionPost.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (posts.length === 0) {
      // Auto-seed initial discussion posts
      await prisma.discussionPost.createMany({
        data: [
          {
            author: 'د. خالد بن محمد',
            authorRole: 'محاضر خبير',
            avatar: '👨‍🏫',
            title: 'كيف تختار النموذج المناسب للمشروع (GPT-4o vs Claude 3.5 Sonnet)؟',
            content: 'في هذا التساؤل نناقش المعايير الأساسية لاختيار النماذج التوليدية بناءً على زمن الاستجابة، السعر، ودقة الكود.',
            category: 'الذكاء الاصطناعي',
            likes: 18,
            replies: 6,
            timestamp: 'منذ ساعتين'
          },
          {
            author: 'منى العتيبي',
            authorRole: 'طالبة متميزة',
            avatar: '👩‍🎓',
            title: 'أفضل الممارسات لربط قواعد البيانات السحابية مع Next.js App Router',
            content: 'ما هي الطريقة المثلى لمعالجة الجلسات والـ Connection Pooling في مكونات Server Components؟ شاركوني تجاربكم!',
            category: 'هندسة البرمجيات',
            likes: 12,
            replies: 4,
            timestamp: 'منذ 5 ساعات'
          },
          {
            author: 'م. عبد الله العتيبي',
            authorRole: 'مهندس أمن سيبراني',
            avatar: '👨‍💻',
            title: 'تأمين واجهات الـ REST APIs ضد هجمات الـ Token Injection',
            content: 'نصائح عملية حول استخدام HttpOnly Cookies بدلاً من LocalStorage لحماية جلسات المستخدمين من هجمات XSS.',
            category: 'الأمن السيبراني',
            likes: 24,
            replies: 9,
            timestamp: 'منذ يوم'
          }
        ]
      });

      posts = await prisma.discussionPost.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
