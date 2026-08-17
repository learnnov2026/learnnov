import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Database...')

  // Hash default password once
  const defaultPassword = await bcrypt.hash('Password123!', 12)

  // Seed Users
  const admin = await prisma.user.upsert({
    where: { email: 'sara.admin@learnnov.com' },
    update: { password: defaultPassword },
    create: {
      name: 'سارة الأحمد (المدير العام)',
      email: 'sara.admin@learnnov.com',
      password: defaultPassword,
      role: 'admin',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    },
  })

  const instructor = await prisma.user.upsert({
    where: { email: 'khaled.instructor@learnnov.com' },
    update: { password: defaultPassword },
    create: {
      name: 'د. خالد بن محمد (محاضر)',
      email: 'khaled.instructor@learnnov.com',
      password: defaultPassword,
      role: 'instructor',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    },
  })

  const instructor2 = await prisma.user.upsert({
    where: { email: 'dr.ali@learnnov.com' },
    update: { password: defaultPassword },
    create: {
      name: 'د. علي (محاضر)',
      email: 'dr.ali@learnnov.com',
      password: defaultPassword,
      role: 'instructor',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student.demo@learnnov.com' },
    update: { password: defaultPassword },
    create: {
      name: 'طالب ليرنوف المتميز',
      email: 'student.demo@learnnov.com',
      password: defaultPassword,
      role: 'student',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    },
  })

  // Seed Courses
  const course1 = await prisma.course.create({
    data: {
      title: 'احتراف هندسة الأوامر والذكاء الاصطناعي التوليدي',
      category: 'الذكاء الاصطناعي',
      instructor: 'د. خالد بن محمد',
      price: 450,
      capacity: 25,
      enrolled_count: 18,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      description: 'دورة عملية مكثفة لتعلم بناء تطبيقات واعدك تقنيات الذكاء الاصطناعي مع نماذج LLMs المتقدمة',
      startDate: new Date('2026-08-01')
    }
  })

  const course2 = await prisma.course.create({
    data: {
      title: 'بناء تطبيقات الويب الفائقة السرعة بـ Next.js و React',
      category: 'هندسة البرمجيات',
      instructor: 'د. خالد بن محمد',
      price: 590,
      capacity: 30,
      enrolled_count: 24,
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
      description: 'تعلم تصميم وتطوير واجهات المستخدم التفاعلية وإرسال واستقبال البيانات مع التشفير وسرعة فائقة',
      startDate: new Date('2026-08-10')
    }
  })

  const course3 = await prisma.course.create({
    data: {
      title: 'أساسيات الأمن السيبراني واختبار الاختراق الأخلاقي',
      category: 'الأمن السيبراني',
      instructor: 'د. خالد بن محمد',
      price: 620,
      capacity: 20,
      enrolled_count: 20,
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
      description: 'دورة تدريبية شاملة تغطي أساسيات حماية الشبكات والثغرات الأمنية والأمن الرقمي',
      startDate: new Date('2026-08-15')
    }
  })

  // Seed Enrollments
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course1.id,
      status: 'approved',
      payment_status: 'paid',
      date: new Date('2026-07-20')
    }
  })

  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course2.id,
      status: 'pending',
      payment_status: 'unpaid',
      date: new Date('2026-07-23')
    }
  })

  // Seed Discussions
  await prisma.discussionPost.create({
    data: {
      author: 'د. خالد بن محمد',
      authorRole: 'محاضر خبير',
      avatar: '👨‍🏫',
      title: 'كيف تختار النموذج المناسب للمشروع (GPT-4o vs Claude 3.5 Sonnet)؟',
      content: 'في هذا التساؤل نناقش المعايير الأساسية لاختيار النماذج التوليدية بناءً على زمن الاستجابة، السعر، ودقة الكود.',
      category: 'الذكاء الاصطناعي',
      likes: 18,
      replies: 6,
      timestamp: 'منذ ساعتين'
    }
  })

  await prisma.discussionPost.create({
    data: {
      author: 'منى العتيبي',
      authorRole: 'طالبة متميزة',
      avatar: '👩‍🎓',
      title: 'أفضل الممارسات لربط Supabase مع Next.js 15 App Router',
      content: 'ما هي الطريقة المثلى لمعالجة الجلسات والـ RLS في مكونات Server Components؟ شاركوني تجاربكم!',
      category: 'هندسة البرمجيات',
      likes: 12,
      replies: 4,
      timestamp: 'منذ 5 ساعات'
    }
  })

  console.log('Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
