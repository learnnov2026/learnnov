# LearnNov Web — Modern Learning Frontend

تطبيق الويب الحديث لمنصة **LearnNov Academic Platform** المبني باستخدام **Next.js (App Router)** و **TypeScript** و **Prisma**.

---

## 🏗️ نظرة عامة على البنية المعمارية (Architecture)

يعمل تطبيق `learnnov-web` كواجهة أمامية تفاعلية حديثة ترتبط مع كل من:
1. **LearnNov Cloud (Django API Server - Port 8000):**
   - إدارة المسارات الأكاديمية والتخصصات (`/specializations`).
   - بوابات الدفع واشتراكات الطلاب عبر Stripe (`/payments`).
   - نماذج وتصحيح الامتحانات الأكاديمية (`/exams`).
   - التحليلات ولوحة تحكم المعلم / الإدارة (`/analytics`, `/instructor`, `/admin`).

2. **LearnNov LMS (Open edX Core - Port 8001/Tutor):**
   - تجربة استعراض مساقات الفيديو والمحتوى التفاعلي (XBlocks).
   - استوديو تصميم الدورات (Studio / CMS).

3. **Prisma ORM & Local Cache / State:**
   - إدارة حالة الجلسة والتفضيلات السريعة للواجهة.

---

## 🚀 البدء والتشغيل (Getting Started)

### 1. تثبيت الاعتماديات
```bash
npm install
```

### 2. توليد نماذج Prisma
```bash
npx prisma generate
```

### 3. تشغيل خادم التطوير
```bash
npm run dev
```
سيكون التطبيق متاحاً على: [http://localhost:3000](http://localhost:3000)

---

## 🧪 الاختبارات (Testing)

- **تشغيل اختبارات الوحدة (Unit Tests via Vitest):**
  ```bash
  npm run test:run
  ```
- **تشغيل تقرير التغطية (Coverage):**
  ```bash
  npm run test:coverage
  ```

---

## 📁 هيكل المجلدات الرئيسي (Folder Structure)

- `src/app/`: مسارات وتطبيقات Next.js App Router (الدورات، الاختبارات، المدفوعات، إلخ).
- `src/components/`: المكونات التفاعلية القابلة لإعادة الاستخدام (UI Components).
- `src/services/`: دوال استدعاء وتكامل الـ REST APIs مع سيرفر Django.
- `src/context/`: مزودات الحالة العامة (State Management & Auth Context).
- `src/lib/`: الدوال المساعدة وإعدادات Prisma Client.
- `src/middleware.ts`: معالجة توجيه الحماية والجلسات للمسارات المحمية.
