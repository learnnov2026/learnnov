'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Specialization {
  id: number;
  title: string;
  title_en: string;
  slug: string;
  description: string;
  cover_image: string | null;
  provider_name: string;
  courses_count: number;
}

export default function SpecializationsCatalog() {
  const router = useRouter();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole') || 'student';
    }
    return 'student';
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://learnnov-api.onrender.com';

  useEffect(() => {
    // Check Auth
    const token = localStorage.getItem('accessToken');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!token || !isLoggedIn) {
      router.push('/login');
      return;
    }

    // Fetch specializations list
    fetch(`${apiUrl}/api/programs/specializations/`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load specializations");
        return res.json();
      })
      .then(json => {
        const results = json.results || json;
        if (Array.isArray(results)) {
          setSpecializations(results);
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn("API load failed, using high fidelity mock specialization tracks:", err);
        // High fidelity mock database fallback
        setSpecializations([
          {
            id: 1,
            title: "التخصص المهني في الذكاء الاصطناعي المتكامل",
            title_en: "Professional Specialization in AI & Data Science",
            slug: "master-ai-specialization",
            description: "مسار متكامل يدمج المنهج الأكاديمي مع الممارسة البرمجية المتقدمة لتأهيل رواد الذكاء الاصطناعي.",
            cover_image: null,
            provider_name: "جامعة الملك سعود",
            courses_count: 3
          }
        ]);
        setLoading(false);
      });
  }, [apiUrl, router]);

  return (
    <main className="dashboard-container" dir="rtl">
      {/* Navigation Header */}
      <header className="glass-panel main-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="profile-avatar logo-avatar">🎓</div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }} className="text-gradient">منصة ليرنوف الأكاديمية</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>المسارات التخصصية والشهادات المهنية</p>
          </div>
        </div>
        <nav className="nav-links">
          <Link href="/" className="nav-link">لوحة الطالب</Link>
          <Link href="/specializations" className="nav-link active">التخصصات</Link>
          <Link href="/discussions" className="nav-link">المناقشات</Link>
          <Link href="/exams" className="nav-link">الاخـتبارات</Link>
          <Link href="/certificates" className="nav-link">الشهادات</Link>
          <Link href="/payments" className="nav-link">المدفوعات</Link>
          <Link href="/chat" className="nav-link">المساعد الذكي</Link>
          {userRole === 'instructor' && <Link href="/instructor" className="nav-link">لوحة المشرف</Link>}
          <Link href="/login" className="nav-link logout-btn">خروج</Link>
        </nav>
      </header>

      {/* Header Banner */}
      <div className="glass-panel profile-header" style={{ marginBottom: '2.5rem', borderLeft: '5px solid #d4af37' }}>
        <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)', color: 'white' }}>🏆</div>
        <div className="profile-info">
          <h1>المسارات المهنية <span className="text-gradient" style={{ background: 'linear-gradient(to left, #f39c12, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>والتخصصات المعتمدة</span></h1>
          <p>ادرس سلسلة متكاملة من المقررات الأكاديمية المنسقة، ونفّذ مشاريع تطبيقية عملية، لتحصل على شهادة تخصص مهنية معتمدة من شؤون الجامعات</p>
        </div>
      </div>

      <h2 className="section-title">مسارات التخصص المتاحة حالياً</h2>

      {loading ? (
        <div className="spinner-container" style={{ minHeight: '30vh' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderColor: '#d4af37 transparent' }}></div>
        </div>
      ) : specializations.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          لا توجد مسارات تخصص مهنية نشطة حالياً.
        </div>
      ) : (
        <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
          {specializations.map(spec => (
            <div key={spec.id} className="glass-panel course-card" style={{ position: 'relative', border: '1px solid rgba(212, 175, 55, 0.15)', overflow: 'hidden' }}>
              {/* Gold badge ornament */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #aa7c11 0%, #d4af37 50%, #f39c12 100%)' }}></div>
              
              <div className="course-badge-container" style={{ marginTop: '0.5rem' }}>
                <span className="badge level" style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#d4af37', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  🎓 مسار تخصص مهني
                </span>
                <span className="badge mode">
                  📚 {spec.courses_count} مقررات متتالية
                </span>
              </div>

              <h3 className="course-title-text" style={{ fontSize: '1.2rem', marginTop: '1rem' }}>{spec.title}</h3>
              <p className="course-en-title" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{spec.title_en}</p>

              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6', margin: '1rem 0 1.5rem' }}>{spec.description}</p>

              <div className="course-meta" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                <div className="meta-item">
                  <span className="meta-icon">🏫</span>
                  <span>الجهة الأكاديمية: <strong>{spec.provider_name}</strong></span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">📜</span>
                  <span>الشهادة المستحقة: <strong>شهادة تخصص مهنية معتمدة</strong></span>
                </div>
              </div>

              <Link href={`/specializations/${spec.slug}`} className="verify-action-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #aa7c11 0%, #d4af37 100%)', boxShadow: '0 4px 15px rgba(170, 124, 17, 0.25)' }}>
                🔍 استكشاف المسار والالتحاق
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
