import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const defaultHistory = [
      {
        role: 'assistant',
        content: `أهلاً بك يا ${payload.name || 'طالب ليرنوف'}! 🌟\nأنا مساعدك الأكاديمي الذكي. كيف يمكنني مساعدتك في مسارك التعليمي اليوم؟`,
        timestamp: new Date().toISOString()
      }
    ];

    return NextResponse.json(defaultHistory, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
