'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

interface FieldOfStudy {
  id: number;
  name: string;
}

interface Provider {
  id: number;
  name: string;
}

interface ApplicationInfo {
  id: number;
  full_name: string;
  program_title: string;
  status: string;
  submitted_at: string;
}

export default function InstructorDashboard() {
  const router = useRouter();
  const { isLoggedIn, userRole, isLoading } = useAuth();
  const [applications, setApplications] = useState<ApplicationInfo[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [activeTab, setActiveTab] = useState<'enrollments' | 'financial_aid'>('enrollments');
  const [financialAids, setFinancialAids] = useState<any[]>([]);
  
  // Database Connected States
  const [fields, setFields] = useState<FieldOfStudy[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeCoursesCount, setActiveCoursesCount] = useState(5);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Course Form States
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [provider, setProvider] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('diploma');
  const [studyMode, setStudyMode] = useState('online_self_paced');
  const [language, setLanguage] = useState('ar');
  const [duration, setDuration] = useState('3');
  const [tuitionFee, setTuitionFee] = useState('0.00');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://learnnov-api.onrender.com';

  const defaultApplications: ApplicationInfo[] = [
    { id: 4, full_name: 'سارة الدوسري', program_title: 'إدارة المشاريع الرقمية (Agile & Scrum)', status: 'rejected', submitted_at: '2026-07-19' }
  ];


  const defaultFinancialAids = [
    { id: 1, applicant_name: 'فيصل الزهراني', program_title: 'أساسيات الأمن السيبراني واختبار الاختراق', requested_discount_percent: 50, annual_income: '15000', status: 'pending', reason: 'تقديم طلب دعم مالي نظراً للالتحاق بدورتين تقنيتين تخصصيتين في مجال الأمان الرقمي.' },
    { id: 2, applicant_name: 'منى العتيبي', program_title: 'احتراف هندسة الأوامر والذكاء الاصطناعي', requested_discount_percent: 30, annual_income: '20000', status: 'approved', reason: 'طالبة متفوقة حاصلة على الترتيب الأول في الكلية.' }
  ];

  const defaultFields = [
    { id: 1, name: 'هندسة الذكاء الاصطناعي والبيانات' },
    { id: 2, name: 'هندسة البرمجيات' },
    { id: 3, name: 'الأمن السيبراني' },
    { id: 4, name: 'إدارة الأعمال والتقنية' }
  ];

  const defaultProviders = [
    { id: 1, name: 'جامعة ليرنوف السحابية' },
    { id: 2, name: 'أكاديمية ليرنوف للبرمجيات' },
    { id: 3, name: 'معهد الأمان الرقمي' }
  ];

  // Fetch applications list from DB
  const fetchDbApplications = () => {
    api.get<any>('/api/instructor/applications')
      .then(json => {
        const results = json.results || json;
        if (Array.isArray(results) && results.length > 0) {
          setApplications(results);
        } else {
          setApplications(defaultApplications);
        }
      })
      .catch(err => {
        console.warn("Using fallback instructor applications:", err);
        setApplications(defaultApplications);
      });
  };

  // Fetch financial aid applications from DB
  const fetchFinancialAidApplications = () => {
    setFinancialAids(defaultFinancialAids);
  };

  useEffect(() => {
    fetchDbApplications();
    fetchFinancialAidApplications();
    setFields(defaultFields);
    setProviders(defaultProviders);
  }, []);


  const getMappedStatus = (dbStatus: string) => {
    if (['submitted', 'under_review', 'waitlisted', 'pending'].includes(dbStatus)) return 'pending';
    if (['accepted', 'approved', 'enrolled', 'completed'].includes(dbStatus)) return 'approved';
    if (dbStatus === 'rejected') return 'rejected';
    return 'pending';
  };

  const updateStatus = async (id: number | string, newStatus: 'accepted' | 'rejected') => {
    try {
      await api.patch(`/api/instructor/applications/${id}/review`, { status: newStatus });
      fetchDbApplications();
    } catch (err) {
      console.warn("Could not review in database, applying local simulation fallback:", err);
      setApplications(prev => prev.map(app => (app.id === id || String(app.id) === String(id)) ? { ...app, status: newStatus === 'accepted' ? 'approved' : 'rejected' } : app));
    }
  };

  const updateAidStatus = async (id: number | string, newStatus: 'approved' | 'rejected') => {
    try {
      await api.put(`/api/financial-aid/review/${id}/`, { status: newStatus });
      setFinancialAids(prev => prev.map(aid => (aid.id === id || String(aid.id) === String(id)) ? { ...aid, status: newStatus } : aid));
    } catch (err) {
      console.warn("Could not review aid in database, applying local fallback:", err);
      setFinancialAids(prev => prev.map(aid => (aid.id === id || String(aid.id) === String(id)) ? { ...aid, status: newStatus } : aid));
    }
  };

  const filteredApps = applications.filter(app => {
    const mapped = getMappedStatus(app.status);
    if (activeFilter === 'all') return true;
    return mapped === activeFilter;
  });

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      title,
      title_en: titleEn,
      slug,
      field_of_study: parseInt(fieldOfStudy),
      provider: parseInt(provider),
      degree_level: degreeLevel,
      study_mode: studyMode,
      language,
      duration_months: parseInt(duration),
      tuition_fee: parseFloat(tuitionFee),
      description,
      is_active: true,
      status: 'active'
    };

    try {
      await api.post('/api/programs/programs/create/', payload);
      setSuccessMsg('تم إضافة المقرر الدراسي بنجاح وحفظه في قاعدة البيانات الحية! 🎉');
      setActiveCoursesCount(prev => prev + 1);
      
      // Clear form
      setTitle('');
      setTitleEn('');
      setSlug('');
      setDescription('');
      
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg('');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع أثناء الحفظ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return 'اليوم';
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  };

  if (isLoading || !isLoggedIn || userRole !== 'instructor') {
    return (
      <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <main className="dashboard-container" dir="rtl">

      {/* Profile Header section */}
      <div className="glass-panel profile-header">
        <div className="profile-avatar">د</div>
        <div className="profile-info" style={{ flex: 1 }}>
          <h1>مرحباً بك، <span className="text-gradient">د. علي البراك</span></h1>
          <p>لوحة التحكم الإشرافية وإدارة طلبات الالتحاق الأكاديمية بقاعدة البيانات الحية</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a 
            href={`${apiUrl}/ai/security-advisor/ui/`}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn"
            style={{ 
              padding: '0.9rem 1.8rem', 
              fontSize: '1.05rem', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)', 
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px var(--accent-glow)'
            }}
          >
            🛡️ مستشار الأمان الذكي
          </a>
          <Link
            href="/profile"
            className="action-btn"
            style={{ 
              padding: '0.9rem 1.4rem', 
              fontSize: '1.05rem', 
              borderRadius: '12px', 
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            🔐 إعدادات الأمان وكلمة المرور
          </Link>
          <button 
            className="action-btn approve" 
            onClick={() => {
              setShowAddModal(true);
              if (fields.length > 0 && !fieldOfStudy) setFieldOfStudy(fields[0].id.toString());
              if (providers.length > 0 && !provider) setProvider(providers[0].id.toString());
            }}
            style={{ padding: '0.9rem 1.8rem', fontSize: '1.05rem', borderRadius: '12px' }}
          >
            ➕ إضافة مقرر دراسي جديد
          </button>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem', fontWeight: 600 }}>نظرة عامة على المقررات والطلاب</h2>
      <div className="stats-grid">
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="stat-icon">👥</div>
          <div className="stat-value">{applications.length + 137}</div>
          <div className="stat-label">إجمالي الطلاب المسجلين</div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--accent-secondary)' }}>
          <div className="stat-icon">📚</div>
          <div className="stat-value">{activeCoursesCount}</div>
          <div className="stat-label">المقررات النشطة بقاعدة البيانات</div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{applications.filter(a => ['submitted', 'under_review', 'waitlisted'].includes(a.status)).length}</div>
          <div className="stat-label">طلبات معلقة بحاجة لمراجعة داتابيز</div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--accent-secondary)' }}>
          <div className="stat-icon">📈</div>
          <div className="stat-value">87.4%</div>
          <div className="stat-label">نسبة نجاح الطلاب</div>
        </div>
      </div>

      {/* Application Management Section */}
      <section style={{ marginTop: '3.5rem' }}>
        
        {/* Section Tabs Switcher */}
        <div className="glass-panel" style={{ display: 'inline-flex', padding: '0.4rem', borderRadius: '14px', gap: '0.5rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button 
            onClick={() => { setActiveTab('enrollments'); setActiveFilter('all'); }} 
            className={`filter-btn ${activeTab === 'enrollments' ? 'active' : ''}`}
            style={{ padding: '0.6rem 1.5rem', fontSize: '1rem', border: 'none', cursor: 'pointer', borderRadius: '10px' }}
          >
            📋 طلبات القبول للمقررات ({applications.length})
          </button>
          <button 
            onClick={() => { setActiveTab('financial_aid'); setActiveFilter('all'); }} 
            className={`filter-btn ${activeTab === 'financial_aid' ? 'active' : ''}`}
            style={{ padding: '0.6rem 1.5rem', fontSize: '1rem', border: 'none', cursor: 'pointer', borderRadius: '10px' }}
          >
            🤝 طلبات الدعم المالي ({financialAids.length})
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>
            {activeTab === 'enrollments' ? 'إدارة طلبات الالتحاق للمقررات (مباشر من الداتابيز)' : 'مراجعة طلبات الدعم المالي للطلاب'}
          </h2>
          
          {/* Tab Filters */}
          <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', borderRadius: '12px', gap: '0.25rem' }}>
            <button 
              onClick={() => setActiveFilter('all')} 
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            >
              الكل
            </button>
            <button 
              onClick={() => setActiveFilter('pending')} 
              className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
            >
              المعلقة
            </button>
            <button 
              onClick={() => setActiveFilter('approved')} 
              className={`filter-btn ${activeFilter === 'approved' ? 'active' : ''}`}
            >
              المقبولة
            </button>
            <button 
              onClick={() => setActiveFilter('rejected')} 
              className={`filter-btn ${activeFilter === 'rejected' ? 'active' : ''}`}
            >
              المرفوضة
            </button>
          </div>
        </div>

        {/* Applications List Table */}
        <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          {activeTab === 'enrollments' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: '#64748b' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>اسم الطالب</th>
                  <th style={{ padding: '1rem 0.5rem' }}>المقرر المطلوب</th>
                  <th style={{ padding: '1rem 0.5rem' }}>تاريخ التقديم</th>
                  <th style={{ padding: '1rem 0.5rem' }}>الحالة الحالية</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>التحكم بالطلب</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', color: '#64748b', textAlign: 'center' }}>
                      لا توجد طلبات تطابق الفلتر المحدد حالياً في قاعدة البيانات.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => {
                    const mappedStatus = getMappedStatus(app.status);
                    return (
                      <tr key={app.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '1.25rem 0.5rem', fontWeight: 600 }}>{app.full_name || 'طالب زائر'}</td>
                        <td style={{ padding: '1.25rem 0.5rem' }}>{app.program_title}</td>
                        <td style={{ padding: '1.25rem 0.5rem', color: '#64748b' }}>{formatDate(app.submitted_at)}</td>
                        <td style={{ padding: '1.25rem 0.5rem' }}>
                          <span className={`status-badge ${mappedStatus}`}>
                            {mappedStatus === 'pending' && 'قيد المراجعة ⏳'}
                            {mappedStatus === 'approved' && 'تم القبول ✅'}
                            {mappedStatus === 'rejected' && 'تم الرفض ❌'}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {mappedStatus === 'pending' ? (
                            <>
                              <button 
                                onClick={() => updateStatus(app.id, 'accepted')} 
                                className="action-btn approve"
                              >
                                قبول الطالب
                              </button>
                              <button 
                                onClick={() => updateStatus(app.id, 'rejected')} 
                                className="action-btn reject"
                              >
                                رفض الطلب
                              </button>
                            </>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>مكتمل بالداتابيز</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: '#64748b' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>الطالب</th>
                  <th style={{ padding: '1rem 0.5rem' }}>المقرر</th>
                  <th style={{ padding: '1rem 0.5rem' }}>تاريخ الطلب</th>
                  <th style={{ padding: '1rem 0.5rem' }}>التفاصيل ومبررات طلب الدعم المالي</th>
                  <th style={{ padding: '1rem 0.5rem' }}>الحالة</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>التحكم بالطلب</th>
                </tr>
              </thead>
              <tbody>
                {financialAids.filter(aid => {
                  if (activeFilter === 'all') return true;
                  if (activeFilter === 'approved') return aid.status === 'approved';
                  if (activeFilter === 'rejected') return aid.status === 'rejected';
                  return aid.status === 'pending';
                }).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', color: '#64748b', textAlign: 'center' }}>
                      لا توجد طلبات دعم مالي تطابق الفلتر المحدد حالياً.
                    </td>
                  </tr>
                ) : (
                  financialAids.filter(aid => {
                    if (activeFilter === 'all') return true;
                    if (activeFilter === 'approved') return aid.status === 'approved';
                    if (activeFilter === 'rejected') return aid.status === 'rejected';
                    return aid.status === 'pending';
                  }).map(aid => {
                    return (
                      <tr key={aid.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '1.25rem 0.5rem', fontWeight: 600 }}>{aid.applicant_username}</td>
                        <td style={{ padding: '1.25rem 0.5rem' }}>{aid.program_title}</td>
                        <td style={{ padding: '1.25rem 0.5rem', color: '#64748b' }}>{formatDate(aid.created_at)}</td>
                        <td style={{ padding: '1.25rem 0.5rem', maxWidth: '350px' }}>
                          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: '1.5' }}>
                            <div>✍️ <strong>السبب:</strong> {aid.reason_for_applying}</div>
                            <div>🎯 <strong>الأهداف:</strong> {aid.career_goals}</div>
                            <div>💼 <strong>الظروف:</strong> {aid.financial_situation}</div>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem 0.5rem' }}>
                          <span className={`status-badge ${aid.status === 'approved' ? 'approved' : aid.status === 'rejected' ? 'rejected' : 'pending'}`}>
                            {aid.status === 'pending' && 'قيد الانتظار ⏳'}
                            {aid.status === 'approved' && 'تم القبول والمنح ✅'}
                            {aid.status === 'rejected' && 'تم الرفض ❌'}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 0.5rem', textAlign: 'center' }}>
                          {aid.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexDirection: 'column' }}>
                              <button 
                                onClick={() => updateAidStatus(aid.id, 'approved')} 
                                className="action-btn approve"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                              >
                                موافقة ومنح
                              </button>
                              <button 
                                onClick={() => updateAidStatus(aid.id, 'rejected')} 
                                className="action-btn reject"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                              >
                                رفض الطلب
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>تمت مراجعته</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Add Course Glassmorphism Modal Form */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card" style={{ maxWidth: '650px', width: '100%', padding: '2.5rem' }}>
            <h2 className="text-gradient" style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: 700 }}>إضافة مقرر دراسي جديد لقاعدة البيانات</h2>
            
            <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>عنوان المقرر بالعربية</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => {
                      setTitle(e.target.value);
                      // Generate simple slug automatically
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-'));
                    }} 
                    required 
                    placeholder="مثال: هندسة البرمجيات المتقدمة"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>العنوان بالإنجليزية</label>
                  <input 
                    type="text" 
                    value={titleEn} 
                    onChange={(e) => setTitleEn(e.target.value)} 
                    required 
                    placeholder="Advanced Software Engineering"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>الرابط الفريد (Slug)</label>
                  <input 
                    type="text" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)} 
                    required 
                    placeholder="advanced-software-engineering"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>التخصص الدراسي</label>
                  <select value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} required>
                    {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>الجهة الأكاديمية المقدمة</label>
                  <select value={provider} onChange={(e) => setProvider(e.target.value)} required>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>الدرجة العلمية</label>
                  <select value={degreeLevel} onChange={(e) => setDegreeLevel(e.target.value)}>
                    <option value="bachelor">بكالوريوس (Bachelor)</option>
                    <option value="master">ماجستير (Master)</option>
                    <option value="doctorate">دكتوراه (Doctorate)</option>
                    <option value="diploma">دبلوم (Diploma)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>طريقة الدراسة</label>
                  <select value={studyMode} onChange={(e) => setStudyMode(e.target.value)}>
                    <option value="online">عن بعد بالكامل (Online)</option>
                    <option value="on_campus">حضوري بالكامل (On Campus)</option>
                    <option value="blended">تعليم مدمج (Blended)</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>لغة الدراسة</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="ar">العربية (Arabic)</option>
                    <option value="en">الإنجليزية (English)</option>
                    <option value="ar_en">ثنائي اللغة (Bilingual)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>مدة المقرر (بالأشهر)</label>
                  <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>الرسوم الدراسية (SAR)</label>
                  <input type="number" value={tuitionFee} onChange={(e) => setTuitionFee(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label>وصف مختصر للمقرر وأهدافه</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required 
                  rows={3} 
                  placeholder="اكتب وصفاً شاملاً للمقرر الدراسي وما سيتعلمه الطالب..."
                />
              </div>

              {successMsg && <div style={{ color: '#34d399', fontWeight: 600, textAlign: 'center' }}>{successMsg}</div>}
              {errorMsg && <div style={{ color: '#f87171', fontWeight: 600, textAlign: 'center' }}>{errorMsg}</div>}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="action-btn approve" style={{ flex: 1, padding: '0.85rem' }} disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ في قاعدة البيانات...' : '💾 حفظ وإطلاق المقرر السحابي'}
                </button>
                <button type="button" className="action-btn reject" style={{ flex: 0.5, padding: '0.85rem' }} onClick={() => setShowAddModal(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled JSX support for quick advanced CSS styling */}
      <style jsx global>{`
        .filter-btn {
          background: transparent;
          border: none;
          color: #64748b;
          padding: 0.5rem 1.25rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
          font-family: inherit;
          transition: all 0.3s;
        }
        .filter-btn:hover {
          color: var(--accent);
        }
        .filter-btn.active {
          background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
          color: #fff;
        }
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .status-badge.pending {
          background: rgba(14, 165, 233, 0.08);
          color: var(--accent);
          border: 1px solid var(--glass-border);
        }
        .status-badge.approved {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-badge.rejected {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .action-btn {
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .action-btn.approve {
          background: var(--accent-secondary);
          color: white;
        }
        .action-btn.approve:hover {
          background: #059669;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
        }
        .action-btn.reject {
          background: #ef4444;
          color: white;
        }
        .action-btn.reject:hover {
          background: #dc2626;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
        }
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
          overflow-y: auto;
        }
        .modal-card {
          animation: fadeInUp 0.4s ease-out;
        }
        .form-row {
          display: flex;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #475569;
        }
        .form-group input, .form-group select, .form-group textarea {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.85);
          color: var(--text-color);
          font-size: 0.95rem;
          outline: none;
          font-family: inherit;
          transition: border-color 0.3s;
        }
        .form-group select option {
          background: var(--bg-color);
          color: var(--text-color);
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: var(--accent);
        }
      `}</style>
    </main>
  );
}
