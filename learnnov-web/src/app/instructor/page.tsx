'use client';
import { useState } from 'react';
import Link from 'next/link';

interface Application {
  id: string;
  studentName: string;
  programTitle: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function InstructorDashboard() {
  // Mock data for initial premium dashboard feel
  const [applications, setApplications] = useState<Application[]>([
    { id: '1', studentName: 'أحمد العتيبي', programTitle: 'ماجستير العلوم في الذكاء الاصطناعي', date: '2026-05-24', status: 'pending' },
    { id: '2', studentName: 'سارة القحطاني', programTitle: 'ماجستير العلوم في الأمن السيبراني', date: '2026-05-25', status: 'pending' },
    { id: '3', studentName: 'عبدالرحمن الدوسري', programTitle: 'دبلوم تطوير تطبيقات الويب المتكاملة', date: '2026-05-25', status: 'approved' },
    { id: '4', studentName: 'فاطمة الشمري', programTitle: 'ماجستير إدارة الأعمال التنفيذي (EMBA)', date: '2026-05-23', status: 'pending' },
    { id: '5', studentName: 'خالد الحربي', programTitle: 'ماجستير العلوم في الذكاء الاصطناعي', date: '2026-05-22', status: 'rejected' },
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const updateStatus = (id: string, newStatus: 'approved' | 'rejected') => {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
  };

  const filteredApps = applications.filter(app => {
    if (activeFilter === 'all') return true;
    return app.status === activeFilter;
  });

  const stats = {
    totalStudents: 142,
    activePrograms: 5,
    pendingApps: applications.filter(a => a.status === 'pending').length,
    passRate: '87.4%',
  };

  return (
    <main className="dashboard-container" dir="rtl">
      {/* Navigation bar Header */}
      <header className="glass-panel" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="profile-avatar" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>🎓</div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }} className="text-gradient">منصة ليرنوف الأكاديمية</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>بوابة المشرفين وأعضاء هيئة التدريس</p>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/" className="nav-link">لوحة الطالب</Link>
          <Link href="/instructor" className="nav-link active">لوحة المشرف</Link>
          <Link href="/chat" className="nav-link">المساعد الذكي</Link>
        </nav>
      </header>

      {/* Profile Header section */}
      <div className="glass-panel profile-header">
        <div className="profile-avatar">د</div>
        <div className="profile-info">
          <h1>مرحباً بك، <span className="text-gradient">د. علي البراك</span></h1>
          <p>لوحة التحكم الإشرافية وإدارة طلبات الالتحاق الأكاديمية</p>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem', fontWeight: 600 }}>نظرة عامة على المقررات والطلاب</h2>
      <div className="stats-grid">
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.totalStudents}</div>
          <div className="stat-label">إجمالي الطلاب المسجلين</div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon">📚</div>
          <div className="stat-value">{stats.activePrograms}</div>
          <div className="stat-label">المقررات النشطة</div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-value" style={{ color: stats.pendingApps > 0 ? '#f59e0b' : '#fff' }}>{stats.pendingApps}</div>
          <div className="stat-label">طلبات معلقة بحاجة لمراجعة</div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="stat-icon">📈</div>
          <div className="stat-value">{stats.passRate}</div>
          <div className="stat-label">نسبة نجاح الطلاب</div>
        </div>
      </div>

      {/* Application Management Section */}
      <section style={{ marginTop: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>إدارة طلبات الالتحاق للمقررات</h2>
          
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
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
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
                  <td colSpan={5} style={{ padding: '3rem', textKeep: 'center', color: '#64748b', textAlign: 'center' }}>
                    لا توجد طلبات تطابق الفلتر المحدد حالياً.
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => (
                  <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1.25rem 0.5rem', fontWeight: 600 }}>{app.studentName}</td>
                    <td style={{ padding: '1.25rem 0.5rem' }}>{app.programTitle}</td>
                    <td style={{ padding: '1.25rem 0.5rem', color: '#94a3b8' }}>{app.date}</td>
                    <td style={{ padding: '1.25rem 0.5rem' }}>
                      <span className={`status-badge ${app.status}`}>
                        {app.status === 'pending' && 'قيد المراجعة ⏳'}
                        {app.status === 'approved' && 'تم القبول ✅'}
                        {app.status === 'rejected' && 'تم الرفض ❌'}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {app.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => updateStatus(app.id, 'approved')} 
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
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>مكتمل</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Styled JSX support for quick advanced CSS styling */}
      <style jsx global>{`
        .nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.3s;
        }
        .nav-link:hover, .nav-link.active {
          color: #fff;
          background: rgba(59, 130, 246, 0.15);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
        }
        .filter-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 0.5rem 1.25rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
          font-family: inherit;
          transition: all 0.3s;
        }
        .filter-btn:hover {
          color: #fff;
        }
        .filter-btn.active {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.3);
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
          background: #10b981;
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
      `}</style>
    </main>
  );
}
