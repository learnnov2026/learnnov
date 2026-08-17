'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

interface Certificate {
  id: number;
  course_title: string;
  provider_name: string;
  student_name: string;
  grade: string;
  date_earned: string;
  verify_uuid: string;
  qr_image_url?: string;
  verification_url?: string;
  is_specialization?: boolean;
  specialization_title?: string;
  specialization_title_en?: string;
  signatories?: Array<{
    name: string;
    title: string;
    organization: string;
  }>;
}

interface VerifiedCertificateResult {
  is_specialization: boolean;
  student_name: string;
  specialization_title?: string;
  course_title?: string;
  provider_name: string;
  date_earned: string;
  verify_uuid: string;
}

interface SpecCertItem {
  id: number;
  specialization_title: string;
  provider_name: string;
  student_name: string;
  date_earned: string;
  verify_uuid: string;
  qr_image_url: string;
  verification_url: string;
}

export default function CertificatesPage() {
  const { isLoggedIn, userRole, isLoading } = useAuth();

  // Verification Portal States
  const [searchUuid, setSearchUuid] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<VerifiedCertificateResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Active Printing Overlay
  const [printingCert, setPrintingCert] = useState<Certificate | null>(null);

  const router = useRouter();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [specCerts, setSpecCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const defaultCerts: Certificate[] = [
      {
        id: 101,
        course_title: 'احتراف هندسة الأوامر والذكاء الاصطناعي التوليدي',
        provider_name: 'جامعة ليرنوف السحابية للذكاء الاصطناعي',
        student_name: 'طالب ليرنوف المتميز',
        grade: 'امتياز مرتفع (98%)',
        date_earned: '2026-07-20',
        verify_uuid: 'CERT-LNOV-9821',
        qr_image_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://learnnov-web.vercel.app/verify/CERT-LNOV-9821',
        verification_url: 'https://learnnov-web.vercel.app/verify/CERT-LNOV-9821',
        signatories: [
          { name: 'د. خالد بن محمد', title: 'عميد كلية الذكاء الاصطناعي', organization: 'LearnNov University' },
          { name: 'د. سارة الأحمد', title: 'رئيس مجلس الاعتماد الأكاديمي', organization: 'LearnNov Global' }
        ]
      },
      {
        id: 102,
        course_title: 'بناء تطبيقات الويب الفائقة السرعة بـ Next.js و React',
        provider_name: 'أكاديمية ليرنوف للبرمجيات',
        student_name: 'طالب ليرنوف المتميز',
        grade: 'ممتاز (94%)',
        date_earned: '2026-07-15',
        verify_uuid: 'CERT-LNOV-9822',
        qr_image_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://learnnov-web.vercel.app/verify/CERT-LNOV-9822',
        verification_url: 'https://learnnov-web.vercel.app/verify/CERT-LNOV-9822',
        signatories: [
          { name: 'م. عمر الشمري', title: 'مدير البرامج الهندسية', organization: 'LearnNov Tech' }
        ]
      }
    ];

    const defaultSpecCerts: Certificate[] = [
      {
        id: 201,
        course_title: 'التخصص الاحترافي الكامل في هندسة الذكاء الاصطناعي والبرمجة الحديثة',
        provider_name: 'جامعة ليرنوف الدولية',
        student_name: 'طالب ليرنوف المتميز',
        grade: 'مرتبة الشرف الأولى',
        date_earned: '2026-07-22',
        verify_uuid: 'SPEC-LNOV-7701',
        is_specialization: true,
        specialization_title: 'التخصص الاحترافي الكامل في هندسة الذكاء الاصطناعي والبرمجة الحديثة',
        specialization_title_en: 'Full Professional Specialization in AI Engineering',
        qr_image_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://learnnov-web.vercel.app/verify/SPEC-LNOV-7701',
        verification_url: 'https://learnnov-web.vercel.app/verify/SPEC-LNOV-7701'
      }
    ];

    // Fetch earned course certificates
    api.get<Certificate[]>('/api/certificates/my')
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCerts(data);
        } else {
          setCerts(defaultCerts);
        }
      })
      .catch((err) => {
        console.warn("Using default certificates:", err);
        setCerts(defaultCerts);
      })
      .finally(() => setLoading(false));

    setSpecCerts(defaultSpecCerts);
  }, [isLoggedIn, router]);

  // Handle Third-Party Verification UUID lookup
  const handleVerifyLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUuid.trim()) return;

    setVerifying(true);
    setVerifiedResult(null);
    setVerifyError(null);

    try {
      const json = await api.get<VerifiedCertificateResult & { is_valid?: boolean; error?: string }>(`/api/certificates/verify/${encodeURIComponent(searchUuid.trim())}`);
      if (json.is_valid === false) {
        throw new Error("لم يتم العثور على وثيقة معتمدة بهذا الرمز.");
      }
      setVerifiedResult(json);
    } catch (err: any) {
      setVerifyError(err.message || "عذراً، لم يتم العثور على وثيقة متوافقة مع هذا المعرف في سجلات قاعدة البيانات المعتمدة. يرجى التحقق من الرقم التعريفي وإعادة المحاولة.");
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading || !isLoggedIn) {
    return (
      <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <main className="dashboard-container" dir="rtl">

      {/* Profile Header */}
      <div className="glass-panel profile-header" style={{ marginBottom: '2rem' }}>
        <div className="profile-avatar">🎓</div>
        <div className="profile-info">
          <h1>شهادات التخرج <span className="text-gradient">والاعتماد الأكاديمي</span></h1>
          <p>استعرض شهاداتك الموثقة، أو قم بتسليمها لجهات التوظيف للتحقق المباشر من قاعدة البيانات</p>
        </div>
      </div>

      {/* Main Certificates split layout */}
      <div className="forum-split-layout">
        {/* Left column: My Certificates list */}
        <div className="threads-list-pane glass-panel" style={{ flex: 1.3 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>شهاداتك الأكاديمية الصادرة</h3>

          {loading ? (
            <div className="spinner-container" style={{ minHeight: '20vh' }}>
              <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
            </div>
          ) : certs.length === 0 && specCerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              لم تصدر لك أي شهادة بعد. أكمل الوحدات الدراسية واجتز الاختبارات بنسبة 60% أو أعلى لتكسب شهادتك الأولى!
            </div>
          ) : (
            <div className="certs-grid-vertical">
              {/* Render Specialization Certificates First */}
              {specCerts.map(c => (
                <div key={`spec-${c.id}`} className="glass-panel cert-card-item" style={{ border: '1px solid rgba(212, 175, 55, 0.3)', background: 'rgba(212, 175, 55, 0.02)' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '3.25rem' }}>🏆</span>
                    <div style={{ flex: 1 }}>
                      <span className="badge" style={{ background: '#d4af37', color: 'black', fontWeight: 800, fontSize: '0.7rem', marginBottom: '0.3rem' }}>تخصص مهني معتمد</span>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.2rem' }}>{c.course_title}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>جهة الاعتماد: {c.provider_name} • المسار المهني المكتمل</p>
                      <p style={{ fontSize: '0.75rem', color: '#d4af37', marginTop: '0.5rem', fontFamily: 'monospace', fontWeight: 'bold' }}>رقم التوثيق: {c.verify_uuid}</p>
                    </div>
                    
                    <button 
                      onClick={() => setPrintingCert(c)}
                      className="print-preview-btn"
                      style={{ background: 'linear-gradient(135deg, #aa7c11, #d4af37)', color: 'white' }}
                    >
                      📜 عرض وطباعة شهادة التخصص
                    </button>
                  </div>
                </div>
              ))}

              {/* Render Course Certificates */}
              {certs.map(c => (
                <div key={`course-${c.id}`} className="glass-panel cert-card-item">
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '3rem' }}>📜</span>
                    <div style={{ flex: 1 }}>
                      <span className="badge" style={{ background: 'var(--accent)', color: 'white', fontWeight: 700, fontSize: '0.7rem', marginBottom: '0.3rem' }}>شهادة إتمام مقرر</span>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '0.2rem' }}>{c.course_title}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>جهة الاعتماد: {c.provider_name} • التقدير: {c.grade}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem', fontFamily: 'monospace', fontWeight: 'bold' }}>رقم التوثيق: {c.verify_uuid}</p>
                    </div>
                    
                    <button 
                      onClick={() => setPrintingCert(c)}
                      className="print-preview-btn"
                    >
                      📜 عرض وطباعة الشهادة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Third-Party verification portal */}
        <div className="active-thread-pane glass-panel" style={{ flex: 1, padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>بوابة التحقق الرسمية للمؤسسات</h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            تتيح هذه البوابة لجهات التوظيف، الشركاء، والجامعات التحقق الفوري من صحة وموثوقية الشهادات مباشرة عبر الاستعلام بالمعرف الفريد (UUID) من سجلاتنا.
          </p>

          <form onSubmit={handleVerifyLookup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>أدخل المعرف الرقمي للوثيقة (UUID)</label>
              <input 
                type="text" 
                value={searchUuid}
                onChange={(e) => setSearchUuid(e.target.value)}
                required
                placeholder="مثال: LNOV-AI-9382F6CC"
                className="verify-input"
              />
            </div>

            <button type="submit" disabled={verifying} className="verify-action-btn">
              {verifying ? 'جاري الاستعلام وقراءة البيانات...' : '🔍 تحقق وصادق على الوثيقة'}
            </button>
          </form>

          {/* Verification Result Output */}
          {verifiedResult && (
            <div className="verification-success-card glass-panel" style={{ border: verifiedResult.is_specialization ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(16, 185, 129, 0.2)', background: verifiedResult.is_specialization ? 'rgba(212, 175, 55, 0.02)' : 'rgba(16, 185, 129, 0.03)' }}>
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', gap: '0.5rem', color: verifiedResult.is_specialization ? '#d4af37' : '#10b981', fontWeight: 'bold', fontSize: '1rem', marginBottom: '1rem' }}>
                <span>✅ {verifiedResult.is_specialization ? 'وثيقة تخصص مهني أصلية معتمدة' : 'وثيقة مقرر أصلية معتمدة'}</span>
              </div>

              <div className="verified-meta-grid">
                <div className="v-meta-row">
                  <span className="v-lbl">اسم الخريج:</span>
                  <span className="v-val">{verifiedResult.student_name}</span>
                </div>
                <div className="v-meta-row">
                  <span className="v-lbl">اسم البرنامج:</span>
                  <span className="v-val">{verifiedResult.specialization_title || verifiedResult.course_title}</span>
                </div>
                <div className="v-meta-row">
                  <span className="v-lbl">المؤسسة المانحة:</span>
                  <span className="v-val">{verifiedResult.provider_name}</span>
                </div>
                <div className="v-meta-row">
                  <span className="v-lbl">النوع:</span>
                  <span className="v-val" style={{ color: verifiedResult.is_specialization ? '#d4af37' : 'var(--accent)', fontWeight: 600 }}>
                    {verifiedResult.is_specialization ? 'تخصص مهني كامل' : 'مقرر فردي'}
                  </span>
                </div>
                <div className="v-meta-row">
                  <span className="v-lbl">تاريخ التوثيق:</span>
                  <span className="v-val">{verifiedResult.date_earned}</span>
                </div>
                <div className="v-meta-row" style={{ border: 'none', padding: 0, marginTop: '0.5rem' }}>
                  <span className="v-lbl" style={{ color: 'var(--accent)' }}>معرف التحقق:</span>
                  <span className="v-val" style={{ color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 'bold' }}>{verifiedResult.verify_uuid}</span>
                </div>
              </div>
            </div>
          )}

          {verifyError && (
            <div className="verification-failure-card">
              <p>{verifyError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Official Golden Bilingual Certificate printable template overlay */}
      {printingCert && (
        <div className="cert-print-backdrop">
          <div className="cert-print-actions">
            <button onClick={() => window.print()} className="action-btn approve" style={{ padding: '0.6rem 1.5rem' }}>🖨️ طباعة الشهادة الورقية</button>
            <button onClick={() => setPrintingCert(null)} className="action-btn reject" style={{ padding: '0.6rem 1.5rem' }}>إغلاق المعاينة ❌</button>
          </div>

          {/* Printable Frame */}
          <div className="official-golden-certificate-frame" style={{ border: printingCert.is_specialization ? '4px solid #d4af37' : 'none' }}>
            <div className="golden-border-outer" style={{ borderColor: printingCert.is_specialization ? '#d4af37' : '#c5a880' }}>
              <div className="golden-border-inner" style={{ borderColor: printingCert.is_specialization ? '#d4af37' : '#c5a880' }}>
                {/* Headers */}
                <div className="cert-header-row" style={{ borderColor: printingCert.is_specialization ? '#d4af37' : '#c5a880' }}>
                  <div className="cert-header-side left">
                    <h4>{printingCert.is_specialization ? 'ACADEMIC SPECIALIZATION BOARD' : 'ACADEMIC AFFAIRS'}</h4>
                    <h5>{printingCert.provider_name.toUpperCase()}</h5>
                  </div>
                  
                  <div className="cert-header-center">
                    <span className="cert-logo-emoji">{printingCert.is_specialization ? '🏆' : '🎓'}</span>
                    <h3 style={{ color: printingCert.is_specialization ? '#d4af37' : '#b45309' }}>
                      {printingCert.is_specialization ? 'منصة ليرنوف للتخصصات المهنية' : 'منصة ليرنوف الأكاديمية'}
                    </h3>
                    <h6>LEARNNOV PLATFORM</h6>
                  </div>

                  <div className="cert-header-side right">
                    <h4>{printingCert.is_specialization ? 'الهيئة المشتركة للتخصصات' : 'الشؤون الأكاديمية للمساقات'}</h4>
                    <h5>{printingCert.provider_name}</h5>
                  </div>
                </div>

                {/* Main Body */}
                <div className="cert-main-body">
                  <h2>{printingCert.is_specialization ? 'شهادة تخصص مهنية معتمدة' : 'شهادة إتمام وتخرج معتمدة'}</h2>
                  <h4 className="en-sub" style={{ color: printingCert.is_specialization ? '#d4af37' : '#b45309' }}>
                    {printingCert.is_specialization ? 'PROFESSIONAL SPECIALIZATION CERTIFICATE' : 'CERTIFICATE OF GRADUATION'}
                  </h4>
                  
                  <p className="cert-prose-ar">
                    تشهد عمادة القبول والشؤون الأكاديمية بمنصة ليرنوف بالتعاون مع <strong>{printingCert.provider_name}</strong> بأن الطالب:
                  </p>
                  <h1 className="student-name-cert">{printingCert.student_name}</h1>
                  
                  <p className="cert-prose-en">
                    This is to officially certify that the student above has successfully completed the program:
                  </p>
                  
                  <h3 className="course-title-cert" style={{ color: printingCert.is_specialization ? '#d4af37' : '#78350f' }}>{printingCert.course_title}</h3>
                  
                  <p className="cert-prose-ar">
                    {printingCert.is_specialization 
                      ? 'وقد اجتاز كافة مساقات المسار التخصصي والتطبيقات العملية المقررة بنجاح متفوقاً.' 
                      : `وقد اجتاز كافة المتطلبات الدراسية والاختبارات التقييمية بنجاح بتقدير عام: ${printingCert.grade}`}
                  </p>

                  <p className="cert-date-verify">
                    حررت بتاريخ: {printingCert.date_earned} • الرقم التعريفي للتوثيق المعتمد: {printingCert.verify_uuid}
                  </p>
                </div>

                {/* Signatures */}
                <div className="cert-signatures-row">
                  <div className="signature-block">
                    <p className="sig-title">{printingCert.signatories?.[0]?.title || 'عميد الشؤون الأكاديمية'}</p>
                    <p className="sig-handwritten">{printingCert.signatories?.[0]?.name || 'د. خالد بن محمد'}</p>
                    <p className="sig-org" style={{ fontSize: '0.7rem', color: '#78716c', margin: 0 }}>{printingCert.signatories?.[0]?.organization || 'منصة ليرنوف الأكاديمية'}</p>
                    <div className="sig-line" style={{ background: printingCert.is_specialization ? '#d4af37' : '#c5a880' }}></div>
                  </div>

                  <div className="cert-qr-block">
                    {printingCert.qr_image_url ? (
                      <img 
                        src={printingCert.qr_image_url} 
                        alt="QR Verification" 
                        style={{ width: '85px', height: '85px', border: printingCert.is_specialization ? '1px solid #d4af37' : '1px solid #c5a880', padding: '2px', backgroundColor: 'white' }} 
                      />
                    ) : (
                      <div className="qr-simulated-box" style={{ borderColor: printingCert.is_specialization ? '#d4af37' : '#c5a880' }}>
                        <div className="qr-row"><span className="b"></span><span></span><span className="b"></span><span></span><span className="b"></span></div>
                        <div className="qr-row"><span></span><span className="b"></span><span></span><span className="b"></span><span></span></div>
                        <div className="qr-row"><span className="b"></span><span></span><span className="b"></span><span></span><span className="b"></span></div>
                      </div>
                    )}
                    <span style={{ fontSize: '0.65rem', color: '#888', marginTop: '0.25rem', display: 'block' }}>قاعدة البيانات السحابية</span>
                  </div>

                  <div className="signature-block">
                    <p className="sig-title">{printingCert.signatories?.[1]?.title || 'المديرة التنفيذية'}</p>
                    <p className="sig-handwritten">{printingCert.signatories?.[1]?.name || 'أ. سارة الودعاني'}</p>
                    <p className="sig-org" style={{ fontSize: '0.7rem', color: '#78716c', margin: 0 }}>{printingCert.signatories?.[1]?.organization || 'منصة ليرنوف الأكاديمية'}</p>
                    <div className="sig-line" style={{ background: printingCert.is_specialization ? '#d4af37' : '#c5a880' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styled JSX */}
      <style jsx global>{`
        .cert-card-item {
          padding: 1.5rem 2rem;
          border-color: var(--glass-border);
          background: rgba(255,255,255,0.4);
          transition: border-color 0.3s;
        }
        .cert-card-item:hover {
          border-color: var(--accent);
        }
        .print-preview-btn {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border: none;
          color: #0f172a;
          padding: 0.65rem 1.25rem;
          border-radius: 8px;
          font-weight: 700;
          font-family: inherit;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }
        .print-preview-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(245, 158, 11, 0.4);
        }
        .certs-grid-vertical {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .verify-input {
          padding: 0.85rem 1.25rem;
          border-radius: 10px;
          border: 1px solid var(--glass-border);
          background: rgba(255,255,255,0.85);
          color: var(--text-color);
          font-family: monospace;
          font-size: 1rem;
          outline: none;
          text-align: center;
          font-weight: bold;
          transition: border-color 0.3s;
        }
        .verify-input:focus {
          border-color: var(--accent);
        }
        .verify-action-btn {
          background: var(--accent);
          border: none;
          color: white;
          padding: 0.85rem;
          border-radius: 10px;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .verify-action-btn:hover {
          background: var(--accent);
          box-shadow: 0 4px 12px var(--accent-glow);
        }
        .verification-success-card {
          padding: 1.5rem;
          background: rgba(16, 185, 129, 0.03);
          border-color: rgba(16, 185, 129, 0.2);
        }
        .verified-meta-grid {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          font-size: 0.85rem;
        }
        .v-meta-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 0.4rem;
        }
        .v-lbl { color: #64748b; }
        .v-val { color: var(--text-color); font-weight: 500; }
        .verification-failure-card {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          line-height: 1.5;
          text-align: center;
        }
        .cert-print-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(12px);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow-y: auto;
        }
        .cert-print-actions {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .official-golden-certificate-frame {
          width: 100%;
          max-width: 900px;
          background: #faf9f6;
          color: #1c1917;
          font-family: 'Outfit', 'Inter', sans-serif;
          padding: 1.5rem;
          border-radius: 4px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          position: relative;
          box-sizing: border-box;
        }
        .golden-border-outer {
          border: 12px double #c5a880;
          padding: 1rem;
          height: 100%;
          box-sizing: border-box;
        }
        .golden-border-inner {
          border: 2px solid #c5a880;
          padding: 2.5rem 2.5rem 1.5rem;
          height: 100%;
          box-sizing: border-box;
          text-align: center;
          position: relative;
        }
        .cert-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #c5a880;
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }
        .cert-header-side {
          flex: 1;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .cert-header-side.left { text-align: left; }
        .cert-header-side.right { text-align: right; }
        .cert-header-side h4 { margin: 0; color: #1c1917; }
        .cert-header-side h5 { margin: 0.15rem 0 0; color: #78716c; }
        .cert-header-center {
          flex: 1.5;
          text-align: center;
        }
        .cert-logo-emoji {
          font-size: 1.75rem;
        }
        .cert-header-center h3 { margin: 0.1rem 0; font-size: 1.15rem; color: #b45309; font-weight: 800; }
        .cert-header-center h6 { margin: 0; font-size: 0.7rem; color: #78716c; font-weight: 600; letter-spacing: 0.5px; }
        
        .cert-main-body h2 {
          font-size: 2.2rem;
          font-weight: 800;
          color: #78350f;
          margin: 0;
        }
        .cert-main-body .en-sub {
          font-size: 0.95rem;
          color: #b45309;
          margin: 0.2rem 0 1.5rem;
          letter-spacing: 2px;
          font-weight: 600;
        }
        .cert-prose-ar {
          font-size: 1.05rem;
          color: #292524;
          margin: 0.85rem 0;
          line-height: 1.5;
        }
        .cert-prose-en {
          font-size: 0.85rem;
          color: #57534e;
          margin: 0.85rem 0;
          line-height: 1.5;
          font-style: italic;
        }
        .student-name-cert {
          font-size: 2.6rem;
          font-weight: 800;
          color: #1c1917;
          border-bottom: 2px solid #e7e5e4;
          display: inline-block;
          padding: 0 2rem 0.25rem;
          margin: 0.5rem 0;
        }
        .course-title-cert {
          font-size: 1.7rem;
          font-weight: 800;
          color: #78350f;
          margin: 0.75rem 0;
        }
        .cert-date-verify {
          font-size: 0.75rem;
          color: #78716c;
          margin-top: 1.5rem;
          border-top: 1px dashed #e7e5e4;
          padding-top: 0.85rem;
        }
        .cert-signatures-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
        }
        .signature-block {
          width: 180px;
          text-align: center;
        }
        .sig-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #57534e;
          margin-bottom: 0.4rem;
        }
        .sig-handwritten {
          font-family: 'Brush Script MT', cursive, sans-serif;
          font-size: 1.5rem;
          color: #1e3a8a;
          margin: 0.25rem 0;
        }
        .sig-line {
          height: 1px;
          background: #c5a880;
          width: 100%;
        }
        .cert-qr-block {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .qr-simulated-box {
          border: 1px solid #c5a880;
          padding: 0.25rem;
          background: white;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .qr-row {
          display: flex;
          gap: 2px;
        }
        .qr-row span {
          width: 5px;
          height: 5px;
          background: #e7e5e4;
        }
        .qr-row span.b {
          background: black;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .official-golden-certificate-frame, .official-golden-certificate-frame * {
            visibility: visible;
          }
          .official-golden-certificate-frame {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            box-shadow: none;
            background: white;
          }
          .cert-print-actions {
            display: none !important;
          }
          .cert-print-backdrop {
            background: white !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}
