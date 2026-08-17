import { NextResponse } from 'next/server';
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
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'الرسالة فارغة' }, { status: 400 });
    }

    const cleanMsg = message.trim().toLowerCase();
    let reply = '';

    if (cleanMsg.includes('شهادة') || cleanMsg.includes('certificate')) {
      reply = `🎓 **إصدار الشهادات في منصة ليرنوف:**
يمكنك الحصول على شهادتك الرقمية المعتمدة فور اجتيازك للاختبار التقييمي للدورة بنسبة لا تقل عن **70%**. 
تحتوي كل شهادة على كود تحقق فريد ورمز QR يمكن للشركات وجهات التوظيف التحقق من صحته مباشرة عبر بوابة التحقق الرسمية.`;
    } else if (cleanMsg.includes('next') || cleanMsg.includes('react') || cleanMsg.includes('برمجة') || cleanMsg.includes('ويب')) {
      reply = `💻 **تطوير تطبيقات الويب بـ Next.js 16:**
في معمارية Next.js App Router الحديثة، يتم تشغيل **React Server Components (RSC)** على الخادم بشكل افتراضي لجلب البيانات بسرعة وتقليل حجم حزمة الجافاسكريبت للعميل. 
عندما تحتاج إلى تفاعلية أو استخدام الـ Hooks مثل \`useState\` أو \`useEffect\`، أضف \`'use client';\` في أعلى الملف.`;
    } else if (cleanMsg.includes('ذكاء') || cleanMsg.includes('ai') || cleanMsg.includes('prompt') || cleanMsg.includes('أوامر')) {
      reply = `🧠 **هندسة الأوامر والذكاء الاصطناعي (Prompt Engineering):**
لكتابة أوامر فعالة للنماذج التوليدية (LLMs):
1. حدد الدور والسياق بدقة (System Prompt).
2. قدم أمثلة واضحة (Few-shot prompting).
3. اطلب من النموذج التفكير خطوة بخطوة (Chain of Thought).`;
    } else if (cleanMsg.includes('أمان') || cleanMsg.includes('security') || cleanMsg.includes('rbac') || cleanMsg.includes('تشفير')) {
      reply = `🛡️ **الأمن السيبراني والصلاحيات في ليرنوف:**
تطبق المنصة معايير أمان عالية:
- تشفير كلمات المرور باستخدام خوارزمية **bcrypt** بـ 12 جولة تشفير.
- تخزين الجلسات في **HttpOnly Cookies** لمنع هجمات XSS.
- نظام تحكم بالصلاحيات دقيق مبني على الأدوار **RBAC (Role-Based Access Control)**.`;
    } else if (cleanMsg.includes('دفع') || cleanMsg.includes('سداد') || cleanMsg.includes('رسوم') || cleanMsg.includes('خصم')) {
      reply = `💳 **الرسوم والمدفوعات:**
يمكنك استعراض كافة فواتير الدورات المسجلة من صفحة **المدفوعات** والسداد عبر البطاقات البنكية، كما يمكنك استخدام كود الخصم \`LEARNNOV20\` للحصول على خصم 20% فوراً.`;
    } else {
      reply = `مرحباً بك يا **${payload.name || 'طالبنا العزيز'}**! 🌟
أنا المساعد الأكاديمي الذكي لمنصة ليرنوف. يسعدني الإجابة على استفساراتك حول:
- مقررات الذكاء الاصطناعي وهندسة الأوامر
- تطوير تطبيقات الويب بـ Next.js و React
- الأمن السيبراني والصلاحيات
- الاختبارات والشهادات المعتمدة وطريقة التحقق منها`;
    }

    return NextResponse.json({ success: true, reply }, { status: 200 });

  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
