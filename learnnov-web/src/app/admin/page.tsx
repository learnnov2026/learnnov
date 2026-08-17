'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const defaultDbState: any = {
  users: [
    { id: '1', name: 'سارة (مدير النظام)', email: 'admin@learnnov.com', role: 'admin', role_id: 1, status: 'active', mfa_enabled: true },
    { id: '2', name: 'د. خالد بن محمد', email: 'instructor@learnnov.com', role: 'instructor', role_id: 2, status: 'active', mfa_enabled: true },
    { id: '3', name: 'م. أحمد العتيبي', email: 'student@learnnov.com', role: 'student', role_id: 3, status: 'active', mfa_enabled: false },
    { id: '4', name: 'فاطمة الزهراء', email: 'fatima@learnnov.com', role: 'student', role_id: 3, status: 'active', mfa_enabled: true }
  ],
  roles: [
    { id: 1, name: 'مدير نظام', code: 'admin', description: 'صلاحيات كاملة للتحكم في المنصة', is_system: true },
    { id: 2, name: 'محاضر / مدرب', code: 'instructor', description: 'إدارة المسارات والدروس والاختبارات', is_system: true },
    { id: 3, name: 'طالب / متدرب', code: 'student', description: 'حضور المحاضرات وحل الواجبات', is_system: true },
    { id: 4, name: 'دعم فني', code: 'support', description: 'مساعدة الطلاب والرد على التذاكر', is_system: false }
  ],
  permissions: [
    { id: 1, name: 'إدارة الدورات والمحتوى', code: 'manage:courses', group: 'المحتوى' },
    { id: 2, name: 'إدارة وقبول طلبات التسجيل', code: 'manage:enrollments', group: 'الطلاب' },
    { id: 3, name: 'إصدار وتوثيق الشهادات', code: 'manage:certificates', group: 'الشهادات' },
    { id: 4, name: 'إدارة المستخدمين والحسابات', code: 'manage:users', group: 'المستخدمين' },
    { id: 5, name: 'التحكم بإعدادات النظام و RBAC', code: 'manage:admin', group: 'النظام' }
  ],
  rolePermissions: {
    1: [1, 2, 3, 4, 5],
    2: [1, 2, 3],
    3: [],
    4: [2]
  },
  courses: [
    {
      id: '1',
      title: 'احتراف هندسة الأوامر والذكاء الاصطناعي التوليدي',
      category: 'الذكاء الاصطناعي',
      instructor: 'د. خالد بن محمد',
      price: 450,
      capacity: 30,
      enrolled_count: 18,
      image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80',
      description: 'دورة شاملة في بناء تطبيقات الذكاء الاصطناعي التوليدي وهندسة النماذج اللغوية الكبيرة.'
    },
    {
      id: '2',
      title: 'الأمن السيبراني وحماية البنية التحتية السحابية',
      category: 'الأمن السيبراني',
      instructor: 'م. فهد الدوسري',
      price: 600,
      capacity: 25,
      enrolled_count: 22,
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
      description: 'إتقان حماية الأنظمة واكتشاف الثغرات وتأمين بيئات السحابة وقواعد البيانات.'
    },
    {
      id: '3',
      title: 'بناء تطبيقات الويب الفائقة بـ Next.js 16 و Supabase',
      category: 'تطوير الويب',
      instructor: 'م. سارة المهندس',
      price: 350,
      capacity: 40,
      enrolled_count: 31,
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80',
      description: 'تطوير واجهات برمجة حديثة بتكامل قواعد البيانات السحابية الحية.'
    }
  ],
  enrollments: [
    { id: '1', userId: '3', userName: 'م. أحمد العتيبي', courseId: '1', courseTitle: 'احتراف هندسة الأوامر والذكاء الاصطناعي التوليدي', date: '2026-08-14', status: 'pending' },
    { id: '2', userId: '4', userName: 'فاطمة الزهراء', courseId: '2', courseTitle: 'الأمن السيبراني وحماية البنية التحتية السحابية', date: '2026-08-12', status: 'approved' }
  ],
  financialAid: [
    { id: 'AID-1', applicantName: 'م. أحمد العتيبي', email: 'student@learnnov.com', courseTitle: 'احتراف هندسة الأوامر والذكاء الاصطناعي التوليدي', coursePrice: 450, annualIncome: 'أقل من 20,000 ر.س', employmentStatus: 'طالب جامعي / باحث عن عمل', reason: 'أرغب في صقل مهاراتي في هندسة الأوامر وبناء مشاريع ذكاء اصطناعي للمنافسة في سوق العمل.', status: 'pending', appliedAt: '2026-08-14' },
    { id: 'AID-2', applicantName: 'منى القحطاني', email: 'mona@learnnov.com', courseTitle: 'الأمن السيبراني وحماية البنية التحتية السحابية', coursePrice: 600, annualIncome: 'أقل من 15,000 ر.س', employmentStatus: 'خريجة حديثة', reason: 'أحتاج للدورة لاجتياز الشهادات الاحترافية والحصول على فرصة عمل متخصصة.', status: 'approved', discountGranted: '100%', appliedAt: '2026-08-10' }
  ],
  instructorApps: [
    { id: 'INS-101', applicantName: 'د. طارق الحازمي', email: 'tareq@learnnov.com', specialization: 'علوم البيانات وتعلم الآلة', experienceYears: 8, bio: 'دكتوراه في الذكاء الاصطناعي مع خبرة تدريس جامعي وإشراف على مشاريع تحول رقمي.', status: 'pending', appliedAt: '2026-08-15' },
    { id: 'INS-102', applicantName: 'أ. ريم الشمري', email: 'reem@learnnov.com', specialization: 'تصميم وتجربة المستخدم UX/UI', experienceYears: 5, bio: 'مصممة أولى بخبرة في منتجات FinTech والتصميم التفاعلي.', status: 'approved', appliedAt: '2026-08-11' }
  ],
  coupons: [
    { id: '1', code: 'LEARN2026', discountPercent: 25, maxUses: 100, usedCount: 42, active: true, expiresAt: '2026-12-31' },
    { id: '2', code: 'EID50', discountPercent: 50, maxUses: 50, usedCount: 19, active: true, expiresAt: '2026-09-01' },
    { id: '3', code: 'WELCOME10', discountPercent: 10, maxUses: 500, usedCount: 184, active: true, expiresAt: '2026-12-31' }
  ],
  tickets: [
    { id: 'TCK-89201', user: 'م. أحمد العتيبي', email: 'student@learnnov.com', type: 'academic', subject: 'استفسار بخصوص تقييم مشروع التخرج العملي', message: 'أود الاستفسار عن المعايير التفصيلية المعتمدة لتقييم كود المشروع النهائي للذكاء الاصطناعي.', status: 'open', priority: 'high', createdAt: '2026-08-16 09:30' },
    { id: 'TCK-89202', user: 'فاطمة الزهراء', email: 'fatima@learnnov.com', type: 'billing', subject: 'طلب فاتورة ضريبية إلكترونية لدورة الأمن السيبراني', message: 'يرجى تزويدي بنسخة رسمية من الفاتورة الضريبية متضمنة الرقم الضريبي للشركة.', status: 'resolved', priority: 'normal', createdAt: '2026-08-15 14:15' },
    { id: 'TCK-89203', user: 'سعد القحطاني', email: 'saad@learnnov.com', type: 'technical', subject: 'مشكلة في تحميل شهادة التخرج بصيغة PDF', message: 'عند الضغط على زر التحميل يظهر خطأ في التشفير الرقمي.', status: 'in_progress', priority: 'high', createdAt: '2026-08-16 10:45' }
  ],
  certificates: [
    { id: 'LNOV-CERT-9821', studentName: 'م. أحمد العتيبي', courseTitle: 'احتراف هندسة الأوامر والذكاء الاصطناعي التوليدي', issueDate: '2026-08-10', verifyCode: 'LNOV-CERT-9821', grade: 'امتياز مرتفع (98%)' }
  ],
  auditLogs: [
    { id: 1, user: 'سارة (مدير النظام)', action: 'تسجيل دخول مشرف', resource: 'لوحة التحكم', ip: '192.168.1.10', severity: 'info', timestamp: '2026-08-16 11:40' },
    { id: 2, user: 'سارة (مدير النظام)', action: 'تعديل الصلاحيات', resource: 'RBAC', ip: '192.168.1.10', severity: 'warning', timestamp: '2026-08-16 11:42' }
  ],
  googleConfig: {
    clientId: '981273918237-learnnov.apps.googleusercontent.com',
    secretKey: 'GOCSPX-learnnov-secret-key-12345'
  },
  youtubeConfig: {
    channelId: 'UC-learnnov-cloud-university',
    apiKey: 'AIzaSy-learnnov-youtube-live-key'
  }
};

export default function AdminDashboardPage() {
  const [db, setDb] = useState<any>(defaultDbState);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeUserId, setActiveUserId] = useState<string | number>('1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedSqlTable, setSelectedSqlTable] = useState<string>('users');

  // Modals visibility
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);

  // Form inputs for modals
  const [newCourse, setNewCourse] = useState({ title: '', category: 'الذكاء الاصطناعي', instructor: 'د. خالد بن محمد', price: 450, capacity: 30, image: '', description: '', startDate: '2026-09-01' });
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'student', role_id: '' as any, status: 'active' as const, mfa_enabled: false });
  const [newRole, setNewRole] = useState({ name: '', code: '', description: '', permissions: [] as number[] });
  const [newCert, setNewCert] = useState({ studentName: '', courseTitle: '', grade: 'امتياز مرتفع (98%)' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: 20, maxUses: 100, expiresAt: '2026-12-31' });

  const refreshData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data && data.users) {
          setDb((prev: any) => ({
            ...prev,
            ...data,
            financialAid: prev.financialAid,
            instructorApps: prev.instructorApps,
            coupons: prev.coupons,
            tickets: prev.tickets
          }));
        }
      }

      // Fetch financial aid & coupons
      const [aidRes, coupRes, appsRes, tckRes] = await Promise.all([
        fetch('/api/admin/financial-aid').catch(() => null),
        fetch('/api/admin/coupons').catch(() => null),
        fetch('/api/admin/instructor-applications').catch(() => null),
        fetch('/api/admin/tickets').catch(() => null)
      ]);

      if (aidRes && aidRes.ok) {
        const aidData = await aidRes.json();
        if (Array.isArray(aidData) && aidData.length) {
          setDb((prev: any) => ({ ...prev, financialAid: aidData }));
        }
      }

      if (coupRes && coupRes.ok) {
        const coupData = await coupRes.json();
        if (Array.isArray(coupData) && coupData.length) {
          setDb((prev: any) => ({ ...prev, coupons: coupData }));
        }
      }

      if (appsRes && appsRes.ok) {
        const appsData = await appsRes.json();
        if (Array.isArray(appsData) && appsData.length) {
          setDb((prev: any) => ({ ...prev, instructorApps: appsData }));
        }
      }

      if (tckRes && tckRes.ok) {
        const tckData = await tckRes.json();
        if (Array.isArray(tckData) && tckData.length) {
          setDb((prev: any) => ({ ...prev, tickets: tckData }));
        }
      }
    } catch (err) {
      console.warn("Keeping active dashboard state.");
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const getRoleName = (roleIdOrUser: any) => {
    if (!roleIdOrUser || !db) return 'طالب / متدرب';
    const roleId = typeof roleIdOrUser === 'object' ? (roleIdOrUser.role_id || roleIdOrUser.roleId) : roleIdOrUser;
    const userRoleStr = typeof roleIdOrUser === 'object' ? roleIdOrUser.role : '';
    const found = db.roles?.find((r: any) => r.id === roleId || r.name === userRoleStr || r.code === userRoleStr);
    return found?.name || userRoleStr || 'طالب / متدرب';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeUser = db.users?.find((u: any) => u.id === activeUserId) || db.users?.[0] || { id: '1', name: 'المدير', role_id: 1, role: 'admin' };

  const logAction = (action: string, resource: string, severity: 'info' | 'warning' | 'critical' = 'info') => {
    const newLog: any = {
      id: (db.auditLogs?.length || 0) + 1,
      user: activeUser.name,
      action,
      resource,
      ip: '192.168.1.10',
      severity,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setDb((prev: any) => ({
      ...prev,
      auditLogs: [newLog, ...(prev.auditLogs || [])]
    }));
  };

  const exportToCSV = (filename: string, rows: object[]) => {
    if (!rows || !rows.length) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows.map(e => Object.values(e).map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`تم تصدير ملف ${filename}.csv بنجاح!`);
  };

  // Course Handlers
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse)
      });
      
      const created = {
        id: String(Date.now()),
        ...newCourse,
        enrolled_count: 0,
        image: newCourse.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
      };

      setDb((prev: any) => ({
        ...prev,
        courses: [...prev.courses, created]
      }));

      logAction('إنشاء دورة تدريبية', newCourse.title);
      setShowAddCourseModal(false);
      showToast(`تم إضافة دورة: ${newCourse.title}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء الإنشاء');
    }
  };

  const handleEditCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      await fetch(`/api/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCourse)
      });

      setDb((prev: any) => ({
        ...prev,
        courses: prev.courses.map((c: any) => c.id === editingCourse.id ? editingCourse : c)
      }));

      logAction('تعديل دورة تدريبية', editingCourse.title);
      setShowEditCourseModal(false);
      setEditingCourse(null);
      showToast(`تم تحديث الدورة: ${editingCourse.title}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء تعديل الدورة');
    }
  };

  const handleDeleteCourse = async (courseId: string | number, courseTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف دورة "${courseTitle}" نهائياً؟`)) return;
    try {
      await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });

      setDb((prev: any) => ({
        ...prev,
        courses: prev.courses.filter((c: any) => c.id !== courseId)
      }));

      logAction('حذف دورة تدريبية', courseTitle, 'warning');
      showToast(`تم حذف دورة: ${courseTitle}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء الحذف');
    }
  };

  // User Handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const created = {
        id: String(Date.now()),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'active',
        mfa_enabled: false
      };

      setDb((prev: any) => ({
        ...prev,
        users: [...prev.users, created]
      }));

      logAction('إضافة مستخدم جديد', newUser.name);
      setShowAddUserModal(false);
      showToast(`تمت إضافة المستخدم: ${newUser.name}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء إنشاء المستخدم');
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });

      setDb((prev: any) => ({
        ...prev,
        users: prev.users.map((u: any) => u.id === editingUser.id ? editingUser : u)
      }));

      logAction('تعديل بيانات مستخدم', editingUser.name);
      setShowEditUserModal(false);
      setEditingUser(null);
      showToast(`تم تحديث بيانات المستخدم: ${editingUser.name}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء التعديل');
    }
  };

  const handleDeleteUser = async (userId: string | number, userName: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟`)) return;
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });

      setDb((prev: any) => ({
        ...prev,
        users: prev.users.filter((u: any) => u.id !== userId)
      }));

      logAction('حذف مستخدم', userName, 'warning');
      showToast(`تم حذف المستخدم: ${userName}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء الحذف');
    }
  };

  // Financial Aid Handler
  const handleReviewFinancialAid = async (aidId: string, status: 'approved' | 'rejected', discount = '100%') => {
    try {
      await fetch(`/api/admin/financial-aid/${aidId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, discountGranted: discount })
      });

      setDb((prev: any) => ({
        ...prev,
        financialAid: prev.financialAid.map((a: any) => a.id === aidId ? { ...a, status, discountGranted: discount } : a)
      }));

      logAction(`معالجة طلب دعم مالي (${status})`, aidId);
      showToast(`تم ${status === 'approved' ? 'قبول' : 'رفض'} طلب الدعم المالي بنجاح!`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء المعالجة');
    }
  };

  // Instructor App Handler
  const handleReviewInstructorApp = async (appId: string, email: string, status: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/admin/instructor-applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, email })
      });

      setDb((prev: any) => ({
        ...prev,
        instructorApps: prev.instructorApps.map((a: any) => a.id === appId ? { ...a, status } : a),
        users: status === 'approved' ? prev.users.map((u: any) => u.email === email ? { ...u, role: 'instructor' } : u) : prev.users
      }));

      logAction(`مراجعة طلب انضمام محاضر (${status})`, appId);
      showToast(`تم ${status === 'approved' ? 'اعتماد المحاضر وترقيته بنجاح' : 'رفض الطلب'}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء المراجعة');
    }
  };

  // Coupon Handlers
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon)
      });

      const couponObj = {
        id: String(Date.now()),
        code: newCoupon.code.toUpperCase(),
        discountPercent: Number(newCoupon.discountPercent),
        maxUses: Number(newCoupon.maxUses),
        usedCount: 0,
        active: true,
        expiresAt: newCoupon.expiresAt
      };

      setDb((prev: any) => ({
        ...prev,
        coupons: [couponObj, ...prev.coupons]
      }));

      logAction('إنشاء كوبون خصم', newCoupon.code);
      setShowAddCouponModal(false);
      showToast(`تم إضافة الكوبون ${newCoupon.code}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء إضافة الكوبون');
    }
  };

  const handleToggleCoupon = async (couponId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      });

      setDb((prev: any) => ({
        ...prev,
        coupons: prev.coupons.map((c: any) => c.id === couponId ? { ...c, active: !currentActive } : c)
      }));

      showToast(`تم ${!currentActive ? 'تفعيل' : 'إيقاف'} الكوبون`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء التعديل');
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (!confirm(`هل أنت متأكد من حذف الكوبون "${code}"؟`)) return;
    try {
      await fetch(`/api/admin/coupons/${couponId}`, { method: 'DELETE' });

      setDb((prev: any) => ({
        ...prev,
        coupons: prev.coupons.filter((c: any) => c.id !== couponId)
      }));

      logAction('حذف كوبون', code, 'warning');
      showToast(`تم حذف الكوبون: ${code}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء الحذف');
    }
  };

  // Ticket Handler
  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      setDb((prev: any) => ({
        ...prev,
        tickets: prev.tickets.map((t: any) => t.id === ticketId ? { ...t, status } : t)
      }));

      logAction(`تحديث تذكرة دعم (${status})`, ticketId);
      showToast(`تم تحديث حالة التذكرة إلى: ${status === 'resolved' ? 'تم الحل' : status === 'in_progress' ? 'قيد المعالجة' : 'مفتوحة'}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء التحديث');
    }
  };

  // Role & Cert Handlers
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRole.name, description: newRole.description, code: newRole.code })
      });

      const created = {
        id: Date.now(),
        name: newRole.name,
        code: newRole.code || newRole.name.toLowerCase(),
        description: newRole.description,
        is_system: false
      };

      setDb((prev: any) => ({
        ...prev,
        roles: [...prev.roles, created]
      }));

      logAction('إنشاء دور مخصص', newRole.name);
      setShowAddRoleModal(false);
      showToast(`تم إنشاء الدور: ${newRole.name}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء إنشاء الدور');
    }
  };

  const handleIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = `LNOV-CERT-${Math.floor(1000 + Math.random() * 9000)}`;
      const certObj = {
        id: code,
        studentName: newCert.studentName,
        courseTitle: newCert.courseTitle,
        issueDate: new Date().toISOString().split('T')[0],
        verifyCode: code,
        grade: newCert.grade
      };

      setDb((prev: any) => ({
        ...prev,
        certificates: [certObj, ...prev.certificates]
      }));

      logAction('إصدار شهادة رقمية', `${newCert.studentName} - ${newCert.courseTitle}`);
      setShowAddCertModal(false);
      showToast(`تم إصدار الشهادة برقم ${code}`);
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء إصدار الشهادة');
    }
  };

  const handleDeleteCert = async (certId: string, studentName: string) => {
    if (!confirm(`هل أنت متأكد من إلغاء وحذف الشهادة رقم "${certId}"؟`)) return;
    try {
      await fetch(`/api/certificates/${certId}`, { method: 'DELETE' });

      setDb((prev: any) => ({
        ...prev,
        certificates: prev.certificates.filter((c: any) => c.id !== certId && c.verifyCode !== certId)
      }));

      logAction('إلغاء شهادة رقمية', `${studentName} (${certId})`, 'critical');
      showToast('تم إلغاء الشهادة بنجاح');
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء حذف الشهادة');
    }
  };

  const handleToggleUserStatus = async (userId: number | string) => {
    const target = db.users.find((u: any) => u.id === userId);
    if (target) {
      const newStatus = target.status === 'active' ? 'suspended' : 'active';
      try {
        await fetch(`/api/users/${userId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });

        setDb((prev: any) => ({
          ...prev,
          users: prev.users.map((u: any) => u.id === userId ? { ...u, status: newStatus } : u)
        }));

        logAction(newStatus === 'active' ? 'تنشيط حساب' : 'تجميد حساب', target.name, 'warning');
        showToast(`تم تغيير حالة حساب ${target.name}`);
        refreshData();
      } catch (err) {
        showToast('حدث خطأ أثناء التحديث');
      }
    }
  };

  const handleTogglePermission = async (roleId: string | number, permissionId: string | number, isAssigned: boolean) => {
    try {
      await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, permissionId, action: isAssigned ? 'revoke' : 'assign' })
      });

      setDb((prev: any) => {
        const curPerms = prev.rolePermissions[roleId] || [];
        const nextPerms = isAssigned 
          ? curPerms.filter((p: any) => p !== permissionId)
          : [...curPerms, permissionId];
        return {
          ...prev,
          rolePermissions: {
            ...prev.rolePermissions,
            [roleId]: nextPerms
          }
        };
      });

      logAction('تحديث صلاحيات', `تعديل صلاحية للـ Role ${roleId}`);
      showToast('تم تحديث الصلاحيات بنجاح!');
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء تعديل الصلاحيات');
    }
  };

  const handleSaveSettings = async (key: string, value: any) => {
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });

      logAction('تحديث إعدادات النظام', key);
      showToast('تم اختبار وحفظ إعدادات الربط بنجاح!');
      refreshData();
    } catch (err) {
      showToast('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const navTabs = [
    { id: 'overview', name: '📊 نظرة عامة ومؤشرات النظام' },
    { id: 'courses', name: `📚 كتالوج وإدارة الدورات (${db.courses?.length || 0})` },
    { id: 'users', name: `👥 إدارة المستخدمين (${db.users?.length || 0})` },
    { id: 'enrollments', name: `📝 طلبات التسجيل والقبول (${db.enrollments?.filter((e: any) => e.status === 'pending').length || 0})` },
    { id: 'financialAid', name: `💰 طلبات الدعم المالي والمنح (${db.financialAid?.filter((a: any) => a.status === 'pending').length || 0})` },
    { id: 'instructorApps', name: `👨‍🏫 طلبات هيئة التدريس (${db.instructorApps?.filter((a: any) => a.status === 'pending').length || 0})` },
    { id: 'coupons', name: `🏷️ كوبونات الخصم والعروض (${db.coupons?.length || 0})` },
    { id: 'tickets', name: `🎫 تذاكر الدعم الفني (${db.tickets?.filter((t: any) => t.status === 'open').length || 0})` },
    { id: 'financialAnalytics', name: '📈 التحليلات والتقارير المالية' },
    { id: 'certificates', name: `🎓 الشهادات الرقمية المعتمدة (${db.certificates?.length || 0})` },
    { id: 'rbac', name: '🎛️ مصفوفة الصلاحيات (RBAC)' },
    { id: 'dbExplorer', name: '🗄️ مستكشف قواعد البيانات SQL' },
    { id: 'googleWorkspace', name: '🔗 إعدادات Google & YouTube' },
    { id: 'audit', name: '📜 سجلات التدقيق والأمان' }
  ];

  // Financial calculations
  const totalRevenue = (db.courses || []).reduce((acc: number, c: any) => acc + (c.price * (c.enrolled_count || 0)), 0);
  const totalPaidEnrollments = (db.courses || []).reduce((acc: number, c: any) => acc + (c.enrolled_count || 0), 0);
  const avgOrderValue = totalPaidEnrollments > 0 ? Math.round(totalRevenue / totalPaidEnrollments) : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Cairo, sans-serif', padding: '1.5rem', direction: 'rtl' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', backgroundColor: '#ffffff', border: '1px solid #10B981', borderLeft: '5px solid #10B981', color: '#0f172a', padding: '0.85rem 1.25rem', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 9999, fontWeight: 700 }}>
          ✅ {toastMessage}
        </div>
      )}

      {/* MODAL: ADD COURSE */}
      {showAddCourseModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', width: '100%', maxWidth: '550px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>➕ إضافة دورة تدريبية جديدة</h3>
            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input type="text" placeholder="عنوان الدورة" required value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <input type="text" placeholder="التصنيف (مثال: الذكاء الاصطناعي)" required value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input type="number" placeholder="السعر (ر.س)" required value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: Number(e.target.value)})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
                <input type="number" placeholder="السعة الاستيعابية" required value={newCourse.capacity} onChange={e => setNewCourse({...newCourse, capacity: Number(e.target.value)})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              </div>
              <input type="text" placeholder="اسم المحاضر / المدرب" required value={newCourse.instructor} onChange={e => setNewCourse({...newCourse, instructor: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <textarea placeholder="وصف الدورة والأهداف التدريبية" rows={3} value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddCourseModal(false)} style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
                <button type="submit" style={{ background: '#2563eb', color: '#FFF', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>حفظ الدورة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT COURSE */}
      {showEditCourseModal && editingCourse && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', width: '100%', maxWidth: '550px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>✏️ تعديل بيانات الدورة التدريبية</h3>
            <form onSubmit={handleEditCourseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input type="text" placeholder="عنوان الدورة" required value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <input type="text" placeholder="التصنيف" required value={editingCourse.category} onChange={e => setEditingCourse({...editingCourse, category: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input type="number" placeholder="السعر (ر.س)" required value={editingCourse.price} onChange={e => setEditingCourse({...editingCourse, price: Number(e.target.value)})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
                <input type="number" placeholder="السعة الاستيعابية" required value={editingCourse.capacity} onChange={e => setEditingCourse({...editingCourse, capacity: Number(e.target.value)})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              </div>
              <input type="text" placeholder="اسم المحاضر" required value={editingCourse.instructor} onChange={e => setEditingCourse({...editingCourse, instructor: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <textarea placeholder="وصف الدورة" rows={3} value={editingCourse.description} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => { setShowEditCourseModal(false); setEditingCourse(null); }} style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
                <button type="submit" style={{ background: '#10b981', color: '#FFF', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD USER */}
      {showAddUserModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>👤 إضافة مستخدم جديد</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input type="text" placeholder="الاسم الكامل" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <input type="email" placeholder="البريد الإلكتروني" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                <option value="student">طالب (Student)</option>
                <option value="instructor">محاضر (Instructor)</option>
                <option value="admin">مدير (Admin)</option>
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
                <button type="submit" style={{ background: '#2563eb', color: '#FFF', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إضافة المستخدم</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {showEditUserModal && editingUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>✏️ تعديل بيانات المستخدم</h3>
            <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input type="text" placeholder="الاسم الكامل" required value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <input type="email" placeholder="البريد الإلكتروني" required value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                <option value="student">طالب (Student)</option>
                <option value="instructor">محاضر (Instructor)</option>
                <option value="admin">مدير (Admin)</option>
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => { setShowEditUserModal(false); setEditingUser(null); }} style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
                <button type="submit" style={{ background: '#10b981', color: '#FFF', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COUPON */}
      {showAddCouponModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>🏷️ إنشاء كوبون خصم ترويجي جديد</h3>
            <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input type="text" placeholder="كود الكوبون (مثال: SUMMER2026)" required value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input type="number" placeholder="نسبة الخصم % (1-100)" required min="1" max="100" value={newCoupon.discountPercent} onChange={e => setNewCoupon({...newCoupon, discountPercent: Number(e.target.value)})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
                <input type="number" placeholder="الحد الأقصى للاستخدام" required value={newCoupon.maxUses} onChange={e => setNewCoupon({...newCoupon, maxUses: Number(e.target.value)})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              </div>
              <input type="date" placeholder="تاريخ الانتهاء" required value={newCoupon.expiresAt} onChange={e => setNewCoupon({...newCoupon, expiresAt: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddCouponModal(false)} style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
                <button type="submit" style={{ background: '#2563eb', color: '#FFF', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إنشاء الكوبون</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ROLE */}
      {showAddRoleModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>➕ إنشاء دور مخصص جديد</h3>
            <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input type="text" placeholder="اسم الدور (مثال: مدقق جودة)" required value={newRole.name} onChange={e => setNewRole({...newRole, name: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <input type="text" placeholder="الرمز التعريفي (مثال: auditor)" required value={newRole.code} onChange={e => setNewRole({...newRole, code: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <textarea placeholder="وصف الدور ومسؤولياته" rows={3} value={newRole.description} onChange={e => setNewRole({...newRole, description: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddRoleModal(false)} style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
                <button type="submit" style={{ background: '#2563eb', color: '#FFF', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إنشاء الدور</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CERTIFICATE */}
      {showAddCertModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>🎓 إصدار شهادة رقمية جديدة</h3>
            <form onSubmit={handleIssueCert} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input type="text" placeholder="اسم الطالب الثلاثي" required value={newCert.studentName} onChange={e => setNewCert({...newCert, studentName: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <input type="text" placeholder="اسم الدورة أو التخصص" required value={newCert.courseTitle} onChange={e => setNewCert({...newCert, courseTitle: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <input type="text" placeholder="التقدير (مثال: امتياز مرتفع 98%)" required value={newCert.grade} onChange={e => setNewCert({...newCert, grade: e.target.value})} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddCertModal(false)} style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
                <button type="submit" style={{ background: '#2563eb', color: '#FFF', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إصدار وتوثيق</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 10px rgba(0,0,0,0.04)', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
            LN
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>LearnNov — المركز الإداري الشامل والمتكامل</h1>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>نظام إدارة الصلاحيات المتقدم والدورات والمنح وهيئة التدريس والشهادات</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#64748b' }}>محاكي الحساب:</span>
            <select value={activeUserId || activeUser.id} onChange={(e) => setActiveUserId(e.target.value)} style={{ background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.3rem 0.6rem', borderRadius: '6px', fontFamily: 'Cairo, sans-serif' }}>
              {(db.users || []).map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({getRoleName(u)})</option>
              ))}
            </select>
          </div>

          <Link href="/" style={{ padding: '0.55rem 1.1rem', backgroundColor: '#2563eb', border: 'none', borderRadius: '10px', color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
            🏠 العودة للموقع
          </Link>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '1.5rem' }}>
        
        {/* Navigation Sidebar */}
        <aside style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 10px rgba(0,0,0,0.04)', padding: '1rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navTabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                style={{ 
                  textAlign: 'right', 
                  padding: '0.7rem 0.9rem', 
                  borderRadius: '10px', 
                  border: activeTab === tab.id ? '1px solid #2563eb' : '1px solid transparent', 
                  backgroundColor: activeTab === tab.id ? '#2563eb' : '#f8fafc', 
                  color: activeTab === tab.id ? '#FFF' : '#334155', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  fontFamily: 'Cairo, sans-serif', 
                  fontSize: '0.86rem',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(37,99,235,0.2)' : 'none'
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Pane */}
        <main style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 10px rgba(0,0,0,0.04)', padding: '1.75rem' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>مؤشرات الإدارة والنظام الحي</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#f0f7ff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 700 }}>المستخدمين المسجلين</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.4rem 0', color: '#1d4ed8' }}>{db.users?.length || 0}</h3>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', padding: '1.25rem', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>الدورات المتاحة</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.4rem 0', color: '#047857' }}>{db.courses?.length || 0}</h3>
                </div>
                <div style={{ backgroundColor: '#fffbeb', padding: '1.25rem', borderRadius: '14px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>طلبات التسجيل المعلقة</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.4rem 0', color: '#d97706' }}>{db.enrollments?.filter((e: any) => e.status === 'pending').length || 0}</h3>
                </div>
                <div style={{ backgroundColor: '#fdf4ff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e9d5ff' }}>
                  <span style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 700 }}>طلبات الدعم المالي</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.4rem 0', color: '#7c3aed' }}>{db.financialAid?.filter((a: any) => a.status === 'pending').length || 0}</h3>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>⚡ إجراءات إدارية سريعة</h3>
              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                <button onClick={() => { setActiveTab('courses'); setShowAddCourseModal(true); }} style={{ backgroundColor: '#2563eb', color: '#FFF', border: 'none', padding: '0.65rem 1.1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  ➕ إضافة دورة تدريبية
                </button>
                <button onClick={() => { setActiveTab('users'); setShowAddUserModal(true); }} style={{ backgroundColor: '#10b981', color: '#FFF', border: 'none', padding: '0.65rem 1.1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  👤 إضافة مستخدم
                </button>
                <button onClick={() => { setActiveTab('coupons'); setShowAddCouponModal(true); }} style={{ backgroundColor: '#f59e0b', color: '#FFF', border: 'none', padding: '0.65rem 1.1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  🏷️ إنشاء كود خصم
                </button>
                <button onClick={() => { setActiveTab('certificates'); setShowAddCertModal(true); }} style={{ backgroundColor: '#8b5cf6', color: '#FFF', border: 'none', padding: '0.65rem 1.1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  🎓 إصدار شهادة رقمية
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: COURSES */}
          {activeTab === 'courses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>إدارة كتالوج الدورات والبرامج ({db.courses?.length || 0})</h2>
                <button onClick={() => setShowAddCourseModal(true)} style={{ backgroundColor: '#2563eb', color: '#FFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  ➕ إضافة دورة تدريبية
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {(db.courses || []).map((course: any) => (
                  <div key={course.id} style={{ backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                    <img src={course.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'} alt={course.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>{course.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', height: '40px', overflow: 'hidden' }}>{course.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
                        <span style={{ color: '#10b981', fontWeight: 800 }}>{course.price} ر.س</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>المسجلين: {course.enrolled_count || 0}/{course.capacity || 30}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                        <button onClick={() => { setEditingCourse(course); setShowEditCourseModal(true); }} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.4rem 0.6rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Cairo, sans-serif' }}>
                          ✏️ تعديل
                        </button>
                        <button onClick={() => handleDeleteCourse(course.id, course.title)} style={{ flex: 1, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.4rem 0.6rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Cairo, sans-serif' }}>
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: USERS */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>إدارة المستخدمين والحسابات ({db.users?.length || 0})</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => exportToCSV('users_report', db.users)} style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                    📥 تصدير CSV
                  </button>
                  <button onClick={() => setShowAddUserModal(true)} style={{ backgroundColor: '#2563eb', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                    👤 مستخدم جديد
                  </button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem' }}>المستخدم</th>
                    <th style={{ padding: '0.75rem' }}>البريد الإلكتروني</th>
                    <th style={{ padding: '0.75rem' }}>الدور الحالي</th>
                    <th style={{ padding: '0.75rem' }}>الحالة</th>
                    <th style={{ padding: '0.75rem' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {(db.users || []).map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{u.name}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', backgroundColor: 'rgba(37,99,235,0.1)', color: '#2563eb', fontWeight: 700 }}>
                          {getRoleName(u)}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ color: u.status === 'active' ? '#10B981' : '#EF4444', fontWeight: 700 }}>{u.status === 'active' ? 'نشط' : 'مجمد'}</span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => { setEditingUser(u); setShowEditUserModal(true); }} style={{ backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                            ✏️ تعديل
                          </button>
                          <button onClick={() => handleToggleUserStatus(u.id)} style={{ backgroundColor: u.status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: u.status === 'active' ? '#EF4444' : '#10B981', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                            {u.status === 'active' ? 'تجميد' : 'تنشيط'}
                          </button>
                          <button onClick={() => handleDeleteUser(u.id, u.name)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                            🗑️ حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: ENROLLMENTS */}
          {activeTab === 'enrollments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>طلبات التسجيل والقبول</h2>
                <button onClick={() => exportToCSV('enrollments_report', db.enrollments)} style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  📥 تصدير التقرير CSV
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem' }}>#</th>
                    <th style={{ padding: '0.75rem' }}>الطالب</th>
                    <th style={{ padding: '0.75rem' }}>الدورة التدريبية</th>
                    <th style={{ padding: '0.75rem' }}>الحالة</th>
                    <th style={{ padding: '0.75rem' }}>الإجراء الإداري</th>
                  </tr>
                </thead>
                <tbody>
                  {(db.enrollments || []).map((en: any) => (
                    <tr key={en.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>#{en.id}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{en.userName}</td>
                      <td style={{ padding: '0.75rem', color: '#334155' }}>{en.courseTitle}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: en.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: en.status === 'approved' ? '#10B981' : '#F59E0B' }}>
                          {en.status === 'approved' ? 'مقبول' : 'قيد الانتظار'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {en.status === 'pending' && (
                            <button onClick={async () => {
                              try {
                                await fetch(`/api/enrollments/${en.id}/status`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'approved' })
                                });
                                setDb((prev: any) => ({
                                  ...prev,
                                  enrollments: prev.enrollments.map((e: any) => e.id === en.id ? { ...e, status: 'approved' } : e)
                                }));
                                logAction('قبول طلب تسجيل', `${en.userName} - ${en.courseTitle}`);
                                showToast(`تم قبول طلب تسجيل الطالب: ${en.userName}`);
                                refreshData();
                              } catch (err) {
                                showToast('حدث خطأ أثناء القبول');
                              }
                            }} style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                              قبول الطلب
                            </button>
                          )}
                          <button onClick={async () => {
                            if (!confirm(`هل أنت متأكد من حذف طلب تسجيل "${en.userName}"؟`)) return;
                            try {
                              await fetch(`/api/enrollments/${en.id}`, { method: 'DELETE' });
                              setDb((prev: any) => ({
                                ...prev,
                                enrollments: prev.enrollments.filter((e: any) => e.id !== en.id)
                              }));
                              logAction('حذف طلب تسجيل', `${en.userName}`, 'warning');
                              showToast('تم حذف طلب التسجيل بنجاح');
                              refreshData();
                            } catch (err) {
                              showToast('حدث خطأ');
                            }
                          }} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.35rem 0.65rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                            🗑️ حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: FINANCIAL AID & SCHOLARSHIPS */}
          {activeTab === 'financialAid' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>طلبات الدعم المالي والمنح الدراسية</h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>مراجعة الوضع المالي للمتقدمين ومنح الخصومات الأكاديمية والمنح الكاملة</p>
                </div>
                <button onClick={() => exportToCSV('financial_aid_report', db.financialAid || [])} style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  📥 تصدير CSV
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(db.financialAid || []).map((aid: any) => (
                  <div key={aid.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{aid.applicantName} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>({aid.email})</span></h4>
                        <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>{aid.courseTitle} ({aid.coursePrice} ر.س)</span>
                      </div>
                      <div>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: aid.status === 'approved' ? 'rgba(16,185,129,0.1)' : aid.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: aid.status === 'approved' ? '#10B981' : aid.status === 'rejected' ? '#EF4444' : '#F59E0B' }}>
                          {aid.status === 'approved' ? `تمت الموافقة (${aid.discountGranted || '100%'})` : aid.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </span>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div><strong>الدخل السنوي:</strong> {aid.annualIncome}</div>
                        <div><strong>الحالة المهنية:</strong> {aid.employmentStatus}</div>
                      </div>
                      <div><strong>الدافع والسبب:</strong> {aid.reason}</div>
                    </div>

                    {aid.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleReviewFinancialAid(aid.id, 'approved', '100%')} style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Cairo, sans-serif' }}>
                          ✅ منح منحة كاملة 100%
                        </button>
                        <button onClick={() => handleReviewFinancialAid(aid.id, 'approved', '50%')} style={{ backgroundColor: '#2563eb', color: '#FFF', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Cairo, sans-serif' }}>
                          🏷️ منح خصم 50%
                        </button>
                        <button onClick={() => handleReviewFinancialAid(aid.id, 'rejected')} style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Cairo, sans-serif' }}>
                          ❌ رفض الطلب
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: INSTRUCTOR APPLICATIONS */}
          {activeTab === 'instructorApps' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>طلبات الانضمام لهيئة التدريس والمدربين</h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>مراجعة السير الذاتية وترقية الحسابات تلقائياً إلى رتبة محاضر</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(db.instructorApps || []).map((app: any) => (
                  <div key={app.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{app.applicantName}</h4>
                        <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>{app.specialization} (خبرة {app.experienceYears} سنوات)</span>
                      </div>
                      <div>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: app.status === 'approved' ? 'rgba(16,185,129,0.1)' : app.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: app.status === 'approved' ? '#10B981' : app.status === 'rejected' ? '#EF4444' : '#F59E0B' }}>
                          {app.status === 'approved' ? 'معتمد (محاضر)' : app.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#334155', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      {app.bio}
                    </p>

                    {app.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                        <button onClick={() => handleReviewInstructorApp(app.id, app.email, 'approved')} style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Cairo, sans-serif' }}>
                          ✅ اعتماد وترقية لمحاضر
                        </button>
                        <button onClick={() => handleReviewInstructorApp(app.id, app.email, 'rejected')} style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Cairo, sans-serif' }}>
                          ❌ رفض الطلب
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: COUPONS */}
          {activeTab === 'coupons' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>كوبونات الخصم والعروض الترويجية</h2>
                <button onClick={() => setShowAddCouponModal(true)} style={{ backgroundColor: '#2563eb', color: '#FFF', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  🏷️ إنشاء كود خصم جديد
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem' }}>كود الكوبون</th>
                    <th style={{ padding: '0.75rem' }}>نسبة الخصم</th>
                    <th style={{ padding: '0.75rem' }}>الاستخدام</th>
                    <th style={{ padding: '0.75rem' }}>ينتهي في</th>
                    <th style={{ padding: '0.75rem' }}>الحالة</th>
                    <th style={{ padding: '0.75rem' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {(db.coupons || []).map((coup: any) => (
                    <tr key={coup.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: '0.95rem' }}>{coup.code}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 800, color: '#10B981' }}>{coup.discountPercent}%</td>
                      <td style={{ padding: '0.75rem', color: '#334155' }}>{coup.usedCount} / {coup.maxUses}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>{coup.expiresAt}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: coup.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: coup.active ? '#10B981' : '#EF4444' }}>
                          {coup.active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => handleToggleCoupon(coup.id, coup.active)} style={{ backgroundColor: coup.active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: coup.active ? '#EF4444' : '#10B981', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                            {coup.active ? 'تعطيل' : 'تفعيل'}
                          </button>
                          <button onClick={() => handleDeleteCoupon(coup.id, coup.code)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                            🗑️ حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 8: TICKETS */}
          {activeTab === 'tickets' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>مركز تذاكر الدعم الفني والأكاديمي</h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>متابعة شكاوى واستفسارات الطلاب والمحاضرين وحلها</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(db.tickets || []).map((tck: any) => (
                  <div key={tck.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#2563eb', fontWeight: 700 }}>{tck.id}</span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.2rem 0', color: '#0f172a' }}>{tck.subject}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>من: {tck.user} ({tck.email}) • {tck.createdAt}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: tck.priority === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', color: tck.priority === 'high' ? '#EF4444' : '#3B82F6' }}>
                          أولوية: {tck.priority === 'high' ? 'عالية' : 'عادية'}
                        </span>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: tck.status === 'resolved' ? 'rgba(16,185,129,0.1)' : tck.status === 'in_progress' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', color: tck.status === 'resolved' ? '#10B981' : tck.status === 'in_progress' ? '#F59E0B' : '#2563eb' }}>
                          {tck.status === 'resolved' ? 'تم الحل' : tck.status === 'in_progress' ? 'قيد المعالجة' : 'مفتوحة'}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#334155', backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      {tck.message}
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                      <button onClick={() => handleUpdateTicketStatus(tck.id, 'in_progress')} style={{ backgroundColor: '#f59e0b', color: '#FFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Cairo, sans-serif' }}>
                        ⏳ تعيين قيد المعالجة
                      </button>
                      <button onClick={() => handleUpdateTicketStatus(tck.id, 'resolved')} style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Cairo, sans-serif' }}>
                        ✅ إغلاق التذكرة كـ تم الحل
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: FINANCIAL ANALYTICS */}
          {activeTab === 'financialAnalytics' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>📈 التقارير والتحليلات المالية المتقدمة</h2>
                <button onClick={() => exportToCSV('revenue_financial_report', db.courses || [])} style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  📥 تصدير التقرير المالي CSV
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#f0fdf4', padding: '1.25rem', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>إجمالي الإيرادات المقدرة</span>
                  <h3 style={{ fontSize: '1.9rem', fontWeight: 900, margin: '0.4rem 0', color: '#047857' }}>{totalRevenue.toLocaleString()} ر.س</h3>
                </div>
                <div style={{ backgroundColor: '#f0f7ff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 700 }}>إجمالي الاشتراكات المدفوعة</span>
                  <h3 style={{ fontSize: '1.9rem', fontWeight: 900, margin: '0.4rem 0', color: '#1d4ed8' }}>{totalPaidEnrollments} اشتراك</h3>
                </div>
                <div style={{ backgroundColor: '#fffbeb', padding: '1.25rem', borderRadius: '14px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 700 }}>متوسط قيمة الطلب (AOV)</span>
                  <h3 style={{ fontSize: '1.9rem', fontWeight: 900, margin: '0.4rem 0', color: '#d97706' }}>{avgOrderValue} ر.س</h3>
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>تفاصيل الإيرادات لكل دورة تدريبية</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem' }}>الدورة</th>
                    <th style={{ padding: '0.75rem' }}>سعر المقعد</th>
                    <th style={{ padding: '0.75rem' }}>المسجلين</th>
                    <th style={{ padding: '0.75rem' }}>نسبة الإشغال</th>
                    <th style={{ padding: '0.75rem' }}>إجمالي الدخل</th>
                  </tr>
                </thead>
                <tbody>
                  {(db.courses || []).map((c: any) => {
                    const rev = c.price * (c.enrolled_count || 0);
                    const occupancy = Math.round(((c.enrolled_count || 0) / (c.capacity || 30)) * 100);
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{c.title}</td>
                        <td style={{ padding: '0.75rem', color: '#64748b' }}>{c.price} ر.س</td>
                        <td style={{ padding: '0.75rem', color: '#334155' }}>{c.enrolled_count || 0} / {c.capacity || 30}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontWeight: 800, color: occupancy > 70 ? '#10B981' : '#F59E0B' }}>{occupancy}%</span>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 800, color: '#10B981' }}>{rev.toLocaleString()} ر.س</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 10: CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>الشهادات الرقمية المعتمدة ({db.certificates?.length || 0})</h2>
                <button onClick={() => setShowAddCertModal(true)} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  🎓 إصدار شهادة جديدة
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem' }}>رقم الشهادة</th>
                    <th style={{ padding: '0.75rem' }}>اسم الطالب</th>
                    <th style={{ padding: '0.75rem' }}>الدورة / التخصص</th>
                    <th style={{ padding: '0.75rem' }}>التقدير</th>
                    <th style={{ padding: '0.75rem' }}>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {(db.certificates || []).map((cert: any) => (
                    <tr key={cert.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>{cert.verifyCode || cert.id}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{cert.studentName}</td>
                      <td style={{ padding: '0.75rem', color: '#334155' }}>{cert.courseTitle}</td>
                      <td style={{ padding: '0.75rem', color: '#10B981', fontWeight: 700 }}>{cert.grade}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button onClick={() => handleDeleteCert(cert.id, cert.studentName)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                          🗑️ إلغاء الشهادة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 11: RBAC MATRIX */}
          {activeTab === 'rbac' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>مصفوفة التحكم بالصلاحيات (RBAC Matrix)</h2>
                <button onClick={() => setShowAddRoleModal(true)} style={{ backgroundColor: '#2563eb', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  ➕ إنشاء دور مخصص جديد
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'right', color: '#0f172a' }}>الصلاحية</th>
                      {(db.roles || []).map((r: any) => (
                        <th key={r.id} style={{ padding: '0.75rem', textAlign: 'center', color: '#0f172a' }}>{r.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(db.permissions || []).map((perm: any) => (
                      <tr key={perm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{perm.name} <br/><span style={{ fontSize: '0.72rem', color: '#64748b' }}>{perm.code}</span></td>
                        {(db.roles || []).map((r: any) => {
                          const checked = (db.rolePermissions?.[r.id] || []).includes(perm.id);
                          return (
                            <td key={r.id} style={{ padding: '0.75rem', textAlign: 'center' }}>
                              <input type="checkbox" checked={checked} disabled={r.name === 'مدير نظام' || r.code === 'admin'} onChange={() => handleTogglePermission(r.id, perm.id, checked)} style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 12: SQL EXPLORER */}
          {activeTab === 'dbExplorer' && (
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>مستكشف واستعلامات SQL الحي</h2>
              <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', color: '#2563eb', fontFamily: 'monospace', border: '1px solid #e2e8f0', direction: 'ltr' }}>
                SELECT * FROM {selectedSqlTable} ORDER BY id DESC LIMIT 50;
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['users', 'courses', 'enrollments', 'certificates', 'roles', 'financialAid', 'coupons', 'tickets'].map(table => (
                  <button key={table} onClick={() => setSelectedSqlTable(table)} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: selectedSqlTable === table ? '#2563eb' : '#fff', color: selectedSqlTable === table ? '#FFF' : '#64748b', cursor: 'pointer', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                    جدول {table}
                  </button>
                ))}
              </div>
              <pre style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', color: '#0f172a', overflowX: 'auto', fontSize: '0.8rem', border: '1px solid #e2e8f0', direction: 'ltr' }}>
                {JSON.stringify((db as any)[selectedSqlTable] || [], null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 13: GOOGLE WORKSPACE & YOUTUBE SETTINGS */}
          {activeTab === 'googleWorkspace' && (
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>🔗 إعدادات وربط Google Workspace & YouTube</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                
                {/* Google Workspace Box */}
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>🌐 إعدادات Google Classroom & Meet</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input type="text" placeholder="Google Client ID" defaultValue={db.googleConfig?.clientId || '981273918237-learnnov.apps.googleusercontent.com'} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.6rem', borderRadius: '8px' }} id="googleClientId" />
                    <input type="password" placeholder="Google Secret Key" defaultValue={db.googleConfig?.secretKey || 'GOCSPX-learnnov-secret-key-12345'} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.6rem', borderRadius: '8px' }} id="googleSecretKey" />
                    <button onClick={() => {
                      const cid = (document.getElementById('googleClientId') as HTMLInputElement)?.value;
                      const sec = (document.getElementById('googleSecretKey') as HTMLInputElement)?.value;
                      handleSaveSettings('googleConfig', { clientId: cid, secretKey: sec });
                    }} style={{ backgroundColor: '#2563eb', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem', fontFamily: 'Cairo, sans-serif' }}>
                      💾 حفظ إعدادات Google
                    </button>
                  </div>
                </div>

                {/* YouTube Live Stream Box */}
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>📺 إعدادات البث المباشر YouTube Data API</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input type="text" placeholder="YouTube Channel ID" defaultValue={db.youtubeConfig?.channelId || 'UC-learnnov-cloud-university'} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.6rem', borderRadius: '8px' }} id="ytChannelId" />
                    <input type="password" placeholder="YouTube API Key v3" defaultValue={db.youtubeConfig?.apiKey || 'AIzaSy-learnnov-youtube-live-key'} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.6rem', borderRadius: '8px' }} id="ytApiKey" />
                    <button onClick={() => {
                      const chId = (document.getElementById('ytChannelId') as HTMLInputElement)?.value;
                      const aKey = (document.getElementById('ytApiKey') as HTMLInputElement)?.value;
                      handleSaveSettings('youtubeConfig', { channelId: chId, apiKey: aKey });
                    }} style={{ backgroundColor: '#dc2626', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem', fontFamily: 'Cairo, sans-serif' }}>
                      💾 حفظ إعدادات YouTube
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 14: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>سجلات التدقيق والأمان الحي (Audit Trail)</h2>
                <button onClick={() => exportToCSV('audit_logs_report', db.auditLogs || [])} style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  📥 تصدير السجلات CSV
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem' }}>الوقت</th>
                    <th style={{ padding: '0.75rem' }}>المستخدم</th>
                    <th style={{ padding: '0.75rem' }}>العملية</th>
                    <th style={{ padding: '0.75rem' }}>الهدف</th>
                    <th style={{ padding: '0.75rem' }}>مستوى الأهمية</th>
                  </tr>
                </thead>
                <tbody>
                  {(db.auditLogs || []).map((log: any) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{log.timestamp}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{log.user}</td>
                      <td style={{ padding: '0.75rem', color: '#334155' }}>{log.action}</td>
                      <td style={{ padding: '0.75rem', color: '#334155' }}>{log.resource}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: log.severity === 'critical' ? 'rgba(239,68,68,0.1)' : log.severity === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(37,99,235,0.1)', color: log.severity === 'critical' ? '#dc2626' : log.severity === 'warning' ? '#d97706' : '#2563eb' }}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
