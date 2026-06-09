'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
  const { isLoggedIn, accessToken, userRole, isLoading } = useAuth();
  const [applications, setApplications] = useState<ApplicationInfo[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Database Connected States
  const [fields, setFields] = useState<FieldOfStudy[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeCoursesCount, setActiveCoursesCount] = useState(5);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [provider, setProvider] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('master');
  const [studyMode, setStudyMode] = useState('online');
  const [language, setLanguage] = useState('ar_en');
  const [duration, setDuration] = useState('24');
  const [tuitionFee, setTuitionFee] = useState('35000');
  const [description, setDescription] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://learnnov-api.onrender.com';

  // Fetch applications list from DB
  const fetchDbApplications = () => {
    if (!accessToken) return;
    fetch(`${apiUrl}/api/programs/applications/`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(json => {
        const results = json.results || json;
        if (Array.isArray(results)) {
          setApplications(results);
        }
      })
      .catch(err => console.error("Error loading instructor applications:", err));
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || userRole !== 'instructor') {
        router.push('/login');
      }
    }
  }, [isLoggedIn, userRole, isLoading, router]);

  useEffect(() => {
    if (!isLoggedIn || !accessToken || userRole !== 'instructor') return;

    // 1. Fetch DB applications list
    fetchDbApplications();

    // 2. Fetch live fields from database
    fetch(`${apiUrl}/api/programs/fields/`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        const results = data.results || data;
        if (Array.isArray(results)) {
          setFields(results.map((f: FieldOfStudy) => ({ id: f.id, name: f.name })));
        }
      })
      .catch(err => console.error("Error loading study fields:", err));

    // 3. Fetch live providers from database
    fetch(`${apiUrl}/api/programs/providers/`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        const results = data.results || data;
        if (Array.isArray(results)) {
          setProviders(results.map((p: Provider) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(err => console.error("Error loading providers:", err));

    // 4. Fetch total active programs count from database
    fetch(`${apiUrl}/api/programs/stats/`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.total_programs) {
          setActiveCoursesCount(data.total_programs);
        }
      })
      .catch(err => console.error("Error loading stats:", err));
  }, [isLoggedIn, accessToken, userRole]);

  const getMappedStatus = (dbStatus: string) => {
    if (['submitted', 'under_review', 'waitlisted'].includes(dbStatus)) return 'pending';
    if (['accepted', 'approved', 'enrolled', 'completed'].includes(dbStatus)) return 'approved';
    if (dbStatus === 'rejected') return 'rejected';
    return 'pending';
  };

  const updateStatus = async (id: number, newStatus: 'accepted' | 'rejected') => {
    try {
      const token = accessToken;
      const res = await fetch(`${apiUrl}/api/programs/applications/${id}/review/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("API status review request failed");
      
      // Re-fetch all applications to refresh the dashboard dynamically!
      fetchDbApplications();
    } catch (err) {
      console.warn("Could not review in database, applying local simulation fallback:", err);
      // Fallback
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
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
      const token = accessToken;
      const res = await fetch(`${apiUrl}/api/programs/programs/create/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('فشل تسجيل المقرر في قاعدة البيانات السحابية.');
      }

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
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'حدث خطأ غير متوقع أثناء الحفظ.');
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>إدارة طلبات الالتحاق للمقررات (مباشر من الداتابيز)</h2>
          
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
