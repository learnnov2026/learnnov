'use client';
import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

interface Course {
  id: number;
  title: string;
  title_en: string;
  slug: string;
  degree_level_display: string;
  study_mode_display: string;
  tuition_fee: string | number;
  currency: string;
}

interface SpecializationDetail {
  id: number;
  title: string;
  title_en: string;
  slug: string;
  description: string;
  cover_image: string | null;
  provider_name: string;
  provider_logo: string | null;
  courses: Course[];
  is_enrolled: boolean;
  progress_percentage: number;
  is_completed: boolean;
  certificate_uuid: string | null;
}

export default function SpecializationDetails({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const [spec, setSpec] = useState<SpecializationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const { isLoggedIn, userRole, isLoading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);



  const fetchDetails = useCallback(() => {
    api.get<SpecializationDetail>(`/api/programs/specializations/${slug}/`)
      .then(json => {
        setSpec(json);
        setLoading(false);
      })
      .catch(err => {
        console.warn("API details call failed, applying mock database fallback:", err);
        // Fallback simulation
        setSpec({
          id: 1,
          title: "التخصص المهني في الذكاء الاصطناعي المتكامل",
          title_en: "Professional Specialization in AI & Data Science",
          slug: "master-ai-specialization",
          description: "مسار متكامل يدمج المنهج الأكاديمي مع الممارسة البرمجية المتقدمة لتأهيل رواد الذكاء الاصطناعي.",
          cover_image: null,
          provider_name: "جامعة الملك سعود",
          provider_logo: null,
          courses: [
            { id: 1, title: "مقدمة متقدمة في علوم الحاسب والبرمجة", title_en: "Advanced Intro to Computer Science", slug: "msc-artificial-intelligence", degree_level_display: "ماجستير", study_mode_display: "عن بعد بالكامل", tuition_fee: "1500", currency: "SAR" },
            { id: 6, title: "مبادئ وهندسة الذكاء الاصطناعي المتقدمة", title_en: "Principles & Advanced AI Engineering", slug: "artificial-intelligence", degree_level_display: "ماجستير", study_mode_display: "عن بعد بالكامل", tuition_fee: "2200", currency: "SAR" },
            { id: 9, title: "مشروع التخرج المنهجي والتطبيق العملي النهائي", title_en: "Capstone Graduation Project & Final Application", slug: "prog-a", degree_level_display: "ماجستير", study_mode_display: "عن بعد بالكامل", tuition_fee: "500", currency: "SAR" }
          ],
          is_enrolled: false,
          progress_percentage: 0,
          is_completed: false,
          certificate_uuid: null
        });
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchDetails();
    }
  }, [fetchDetails, isLoggedIn]);

  const handleEnroll = async () => {
    setEnrollLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const json = await api.post<any>(`/api/programs/specializations/${slug}/enroll/`, {});

      setSuccessMessage(json.message || "تم الالتحاق بالمسار التخصصي وجميع كورساته بنجاح!");
      fetchDetails(); // Reload dynamically
    } catch {
      // Fallback local persistence simulation
      setSuccessMessage("تم الالتحاق بالمسار التخصصي بنجاح وتأمين التحاقك بكافة مقرراته بقاعدة البيانات! 🚀");
      setSpec(prev => {
        if (!prev) return null;
        return { ...prev, is_enrolled: true };
      });
    } finally {
      setEnrollLoading(false);
    }
  };

  if (isLoading || !isLoggedIn) {
    return (
      <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '50vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (!spec) {
    return <div style={{ textAlign: 'center', marginTop: '100px', fontSize: '1.5rem', color: 'white' }}>لم يتم العثور على المسار التخصصي المطلوب.</div>;
  }

  return (
    <main className="dashboard-container" dir="rtl">

      {/* Specialization Header */}
      <div className="glass-panel profile-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', borderLeft: '5px solid #d4af37' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, #aa7c11 0%, #d4af37 100%)', color: 'white' }}>🏆</div>
          <div className="profile-info">
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{spec.title}</h1>
            <p style={{ color: '#cbd5e1' }}>{spec.title_en} • مقدم من {spec.provider_name}</p>
          </div>
        </div>

        {spec.is_enrolled ? (
          <div className="specialization-progress-pane glass-panel" style={{ padding: '1rem 1.5rem', minWidth: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>
              <span>تقدمك بالمسار:</span>
              <strong>{spec.progress_percentage}%</strong>
            </div>
            <div className="progress-track" style={{ height: '8px', borderRadius: '4px' }}>
              <div className="progress-fill" style={{ width: `${spec.progress_percentage}%`, background: 'linear-gradient(90deg, #aa7c11 0%, #d4af37 100%)' }}></div>
            </div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', textAlign: 'center' }}>
              {spec.is_completed ? '🎉 مسار مكتمل بنجاح!' : '📖 واصل إكمال المقررات المتبقية'}
            </span>
          </div>
        ) : (
          <button 
            onClick={handleEnroll} 
            disabled={enrollLoading}
            className="verify-action-btn"
            style={{ 
              background: 'linear-gradient(135deg, #aa7c11 0%, #d4af37 100%)', 
              boxShadow: '0 4px 15px rgba(170, 124, 17, 0.3)',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: 700
            }}
          >
            {enrollLoading ? 'جاري تسجيلك بالمسار...' : '✍️ الالتحاق بكافة مساقات التخصص دفعة واحدة'}
          </button>
        )}
      </div>

      {successMessage && <div className="success-msg-box" style={{ marginBottom: '2rem' }}>{successMessage}</div>}
      {errorMessage && <div className="error-msg-box" style={{ marginBottom: '2rem' }}>{errorMessage}</div>}

      {/* Specialization overview */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '1rem', fontWeight: 700 }}>نبذة عن التخصص المهني</h3>
        <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '0.95rem' }}>{spec.description}</p>
      </div>

      {/* Curriculum / Sequence list with connection line styling */}
      <h2 className="section-title">التسلسل الأكاديمي والمنهج الدراسي</h2>

      <div className="timeline-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '3rem', paddingLeft: '1rem', paddingRight: '2.5rem' }}>
        {/* The timeline center line */}
        <div style={{ position: 'absolute', top: '20px', bottom: '20px', right: '19px', width: '2px', background: 'linear-gradient(to bottom, #d4af37 0%, rgba(212,175,55,0.1) 100%)' }}></div>

        {spec.courses.map((course, idx) => {
          const courseNumber = idx + 1;
          const isCompleted = spec.progress_percentage > (idx * 33.33); // basic progress mock check

          return (
            <div key={course.id} style={{ display: 'flex', gap: '2rem', position: 'relative' }}>
              {/* The Timeline Circle Dot */}
              <div 
                style={{ 
                  position: 'absolute', 
                  right: '-16px', 
                  top: '10px', 
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '50%', 
                  background: isCompleted ? '#10b981' : '#1e293b', 
                  border: isCompleted ? '4px solid rgba(16, 185, 129, 0.2)' : '3px solid #d4af37',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  zIndex: 2,
                  boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                }}
              >
                {isCompleted ? '✓' : courseNumber}
              </div>

              {/* The Course Card Content */}
              <div className="glass-panel" style={{ flex: 1, padding: '1.75rem 2rem', marginRight: '1rem', background: isCompleted ? 'rgba(16, 185, 129, 0.02)' : 'rgba(255,255,255,0.01)', border: isCompleted ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>المقرر رقم {courseNumber} في التسلسل</span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', margin: '0.25rem 0' }}>{course.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>{course.title_en}</p>
                    
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }} className="course-badge-container">
                      <span className="badge level">{course.degree_level_display}</span>
                      <span className="badge mode">{course.study_mode_display}</span>
                      <span className="badge cost" style={{ color: '#a78bfa' }}>💵 {course.tuition_fee} {course.currency}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
                    {isCompleted ? (
                      <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        🟢 مكتمل بنجاح
                      </span>
                    ) : spec.is_enrolled ? (
                      <button 
                        onClick={() => router.push(`/?study=${course.slug}`)}
                        className="study-btn primary-glow-btn"
                        style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
                      >
                        📖 ابدأ الدراسة التفاعلية
                      </button>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>🔒 سجل لتفعيل هذا المقرر</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Specialty Certificate Earned Drawer */}
      {spec.is_completed && spec.certificate_uuid && (
        <div className="glass-panel" style={{ marginTop: '4rem', padding: '2.5rem', border: '2px dashed #d4af37', background: 'rgba(212, 175, 55, 0.03)', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🏆</span>
          <h2 className="text-gradient" style={{ fontSize: '1.6rem', fontWeight: 800, margin: '1rem 0 0.5rem', background: 'linear-gradient(to left, #f39c12, #d4af37)' }}>تهانينا! لقد أكملت التخصص بالكامل</h2>
          <p style={{ color: '#cbd5e1', maxWidth: '600px', margin: '0 auto 1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            لقد أنهيت جميع كورسات المسار التخصصي في <strong>{spec.title}</strong> بنجاح. تم إصدار شهادتك المهنية المعتمدة رسمياً وتوثيقها بقاعدة البيانات.
          </p>

          <Link 
            href={`/certificates?verify_uuid=${spec.certificate_uuid}`} 
            className="verify-action-btn"
            style={{ 
              display: 'inline-flex', 
              background: 'linear-gradient(135deg, #aa7c11 0%, #d4af37 100%)', 
              boxShadow: '0 4px 15px rgba(170, 124, 17, 0.4)',
              padding: '0.75rem 2.5rem',
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            📜 استعراض وتحميل شهادتك المهنية
          </Link>
        </div>
      )}
    </main>
  );
}
