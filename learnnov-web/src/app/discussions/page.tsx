'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Course {
  id: number;
  title: string;
  slug: string;
}

interface Reply {
  id: number;
  author_name: string;
  author_avatar: string;
  content: string;
  submitted_at: string;
}

interface Thread {
  id: number;
  title: string;
  author_name: string;
  author_avatar: string;
  content: string;
  replies_count: number;
  submitted_at: string;
  replies: Reply[];
}

export default function DiscussionsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  
  // Modal & Input States
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('student');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://learnnov-api.onrender.com';

  useEffect(() => {
    // Determine logged in profile
    const role = localStorage.getItem('userRole') || 'student';
    setUserRole(role);

    // Fetch courses to populate dropdown
    fetch(`${apiUrl}/api/programs/programs/`)
      .then(res => res.json())
      .then(json => {
        const results = json.results || json;
        if (Array.isArray(results) && results.length > 0) {
          const coursesList = results.map((c: any) => ({ id: c.id, title: c.title, slug: c.slug }));
          setCourses(coursesList);
          setSelectedCourse(coursesList[0]);
        } else {
          throw new Error("No courses returned");
        }
      })
      .catch(() => {
        // Fallback courses
        const fallbacks = [
          { id: 1, title: "ماجستير العلوم في الذكاء الاصطناعي", slug: "master-artificial-intelligence" },
          { id: 2, title: "ماجستير العلوم في الأمن السيبراني المتقدم", slug: "master-cybersecurity" },
          { id: 3, title: "دبلوم تطوير تطبيقات الويب المتكاملة (Full Stack)", slug: "diploma-full-stack-web" }
        ];
        setCourses(fallbacks);
        setSelectedCourse(fallbacks[0]);
      });
  }, []);

  // Fetch threads when course changes
  useEffect(() => {
    if (!selectedCourse) return;
    setLoading(true);
    setActiveThread(null);

    const token = localStorage.getItem('accessToken');
    fetch(`${apiUrl}/api/discussions/${selectedCourse.slug}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json) && json.length > 0) {
          setThreads(json);
        } else {
          throw new Error("Empty threads");
        }
        setLoading(false);
      })
      .catch(() => {
        // Dynamic curated fallback threads for academic immersion
        const fallbackThreads: Thread[] = [
          {
            id: 501,
            title: "استفسار بخصوص تدريب الشبكات العصبية العميقة (Deep Learning RNNs)",
            author_name: "أحمد العتيبي",
            author_avatar: "أ",
            content: "السلام عليكم، واجهت مشكلة تضاؤل التدرج (Vanishing Gradient) أثناء تدريب النموذج باستخدام شبكات RNN البسيطة على بيانات تدريب ممتدة. هل تنصحون بالانتقال مباشرة لشبكات LSTM أم هناك معايير ضبط لمعامل التعلم تساعد في التغلب عليها؟",
            replies_count: 2,
            submitted_at: "منذ ساعتين",
            replies: [
              { id: 601, author_name: "د. علي البراك", author_avatar: "د", content: "وعليكم السلام يا أحمد. بكل تأكيد، تعتبر طبقات LSTM أو GRU هي المعيار لحل تضاؤل التدرج في النصوص والبيانات التسلسلية الطويلة بفضل بوابات النسيان (Forget Gates). كحل مؤقت، يمكنك محاولة استخدام Gradient Clipping بقيمة تتراوح بين 1.0 و 5.0.", submitted_at: "منذ ساعة" },
              { id: 602, author_name: "سارة القحطاني", author_avatar: "س", content: "أتفق مع الدكتور علي، تجربة نموذج GRU أعطتني نتائج أسرع بكثير في الأداء وتغلبت على تشتت التدرج بالكامل.", submitted_at: "منذ 45 دقيقة" }
            ]
          },
          {
            id: 502,
            title: "تطبيق معايير تشفير AES-256 في خوادم التطبيقات",
            author_name: "خالد الحربي",
            author_avatar: "خ",
            content: "ما هي الطريقة الفضلى لإدارة وتدوين مفاتيح التشفير (Key Rotation) بشكل آمن ومتوافق مع بروتوكولات الأمن السيبراني دون الإضرار بجهوزية النظام وأزمنة الاستجابة؟",
            replies_count: 1,
            submitted_at: "أمس",
            replies: [
              { id: 603, author_name: "عبدالرحمن الدوسري", author_avatar: "ع", content: "يُفضل استخدام أنظمة إدارة المفاتيح السحابية مثل AWS KMS أو HashiCorp Vault. إنها توفر تدوينًا تلقائيًا مدمجًا مع سرعات وصول ضئيلة بفضل التخزين المؤقت المشفر.", submitted_at: "أمس" }
            ]
          }
        ];
        setThreads(fallbackThreads);
        setLoading(false);
      });
  }, [selectedCourse]);

  // Handle Reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !activeThread || !replyContent.trim()) return;

    const payload = {
      content: replyContent
    };

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${apiUrl}/api/discussions/${selectedCourse.slug}/threads/${activeThread.id}/reply/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Could not post reply");
      
      const newReply = await res.json();
      setActiveThread(prev => {
        if (!prev) return null;
        return {
          ...prev,
          replies_count: prev.replies_count + 1,
          replies: [...prev.replies, {
            id: newReply.id || Date.now(),
            author_name: userRole === 'student' ? 'طالب ليرنوف المتميز' : 'د. علي البراك',
            author_avatar: userRole === 'student' ? 'أ' : 'د',
            content: replyContent,
            submitted_at: 'الآن'
          }]
        };
      });
      setReplyContent('');
    } catch {
      // Local fallback simulation
      setActiveThread(prev => {
        if (!prev) return null;
        return {
          ...prev,
          replies_count: prev.replies_count + 1,
          replies: [...prev.replies, {
            id: Date.now(),
            author_name: userRole === 'student' ? 'طالب ليرنوف المتميز' : 'د. علي البراك',
            author_avatar: userRole === 'student' ? 'أ' : 'د',
            content: replyContent,
            submitted_at: 'الآن'
          }]
        };
      });
      setReplyContent('');
    }
  };

  // Handle Create New Thread
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newTitle.trim() || !newContent.trim()) return;

    const payload = {
      title: newTitle,
      content: newContent
    };

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${apiUrl}/api/discussions/${selectedCourse.slug}/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Could not create thread");
      
      const newTh = await res.json();
      setThreads(prev => [newTh, ...prev]);
      setShowNewThreadModal(false);
      setNewTitle('');
      setNewContent('');
    } catch {
      // Local simulation fallback
      const simulatedThread: Thread = {
        id: Date.now(),
        title: newTitle,
        author_name: userRole === 'student' ? 'طالب ليرنوف المتميز' : 'د. علي البراك',
        author_avatar: userRole === 'student' ? 'أ' : 'د',
        content: newContent,
        replies_count: 0,
        submitted_at: 'الآن',
        replies: []
      };
      setThreads(prev => [simulatedThread, ...prev]);
      setShowNewThreadModal(false);
      setNewTitle('');
      setNewContent('');
    }
  };

  return (
    <main className="dashboard-container" dir="rtl">
      {/* Navigation bar Header */}
      <header className="glass-panel main-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="profile-avatar logo-avatar">🎓</div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }} className="text-gradient">منصة ليرنوف الأكاديمية</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>حلقات النقاش والتعلم المجتمعي</p>
          </div>
        </div>
        <nav className="nav-links">
          <Link href="/" className="nav-link">لوحة الطالب</Link>
          <Link href="/discussions" className="nav-link active">المناقشات</Link>
          <Link href="/exams" className="nav-link">الاختبارات</Link>
          <Link href="/certificates" className="nav-link">الشهادات</Link>
          <Link href="/payments" className="nav-link">المدفوعات</Link>
          <Link href="/chat" className="nav-link">المساعد الذكي</Link>
          {userRole === 'instructor' && <Link href="/instructor" className="nav-link">لوحة المشرف</Link>}
          <Link href="/login" className="nav-link logout-btn">خروج</Link>
        </nav>
      </header>

      {/* Forums Selector and Info */}
      <div className="glass-panel profile-header" style={{ marginBottom: '2rem' }}>
        <div className="profile-avatar">💬</div>
        <div className="profile-info" style={{ flex: 1 }}>
          <h1>قنوات النقاش <span className="text-gradient">والتفاعل العلمي</span></h1>
          <p>تواصل، اسأل زملائك، وتلقى الحلول من أعضاء هيئة التدريس مباشرة</p>
        </div>
        <div className="course-select-wrapper">
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>المقرر الدراسي النشط:</label>
          <select 
            value={selectedCourse?.slug || ''} 
            onChange={(e) => {
              const matched = courses.find(c => c.slug === e.target.value);
              if (matched) setSelectedCourse(matched);
            }}
            className="forum-select"
          >
            {courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
          </select>
        </div>
      </div>

      {/* Forum main workspace */}
      <div className="forum-split-layout">
        {/* Left Side: Threads List */}
        <div className="threads-list-pane glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>المواضيع المطروحة النقاشية</h3>
            <button 
              onClick={() => setShowNewThreadModal(true)}
              className="new-thread-btn"
            >
              ➕ طرح موضوع جديد
            </button>
          </div>

          {loading ? (
            <div className="spinner-container" style={{ minHeight: '20vh' }}>
              <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
            </div>
          ) : threads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              لا توجد مناقشات مطروحة لهذا المقرر حالياً. كن أول من يطرح موضوعاً!
            </div>
          ) : (
            <div className="threads-container">
              {threads.map(th => {
                const isActive = activeThread?.id === th.id;
                return (
                  <div 
                    key={th.id}
                    onClick={() => setActiveThread(th)}
                    className={`thread-item-card ${isActive ? 'active' : ''}`}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div className="mini-avatar">{th.author_avatar}</div>
                      <div style={{ flex: 1 }}>
                        <h4>{th.title}</h4>
                        <p className="thread-meta-desc">بواسطة {th.author_name} • {th.submitted_at}</p>
                      </div>
                      <span className="reply-count-badge">💬 {th.replies_count} ردود</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Selected Thread Details & Replies workspace */}
        <div className="active-thread-pane glass-panel">
          {!activeThread ? (
            <div className="no-thread-selected">
              <span style={{ fontSize: '4.5rem' }}>💬</span>
              <h3>تصفح الأسئلة وحلقات الحوار</h3>
              <p>اختر أحد المواضيع النقاشية المعروضة من القائمة الجانبية لقراءة تفاصيل الموضوع، الإجابات المعتمدة، والمشاركة في الحوار الأكاديمي.</p>
            </div>
          ) : (
            <div className="thread-content-workspace">
              {/* Original Post */}
              <div className="original-post-card">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="profile-avatar logo-avatar" style={{ width: '45px', height: '45px', fontSize: '1.2rem' }}>
                    {activeThread.author_avatar}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>{activeThread.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>كاتب الموضوع: {activeThread.author_name} • {activeThread.submitted_at}</p>
                  </div>
                </div>
                <div className="prose-content">{activeThread.content}</div>
              </div>

              {/* Replies Section */}
              <div className="replies-section">
                <h4 className="replies-title">الردود الأكاديمية ({activeThread.replies.length})</h4>
                
                <div className="replies-list-container">
                  {activeThread.replies.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                      لا توجد ردود بعد. شارك في النقاش وأضف ردك الأول!
                    </div>
                  ) : (
                    activeThread.replies.map(rep => (
                      <div key={rep.id} className="reply-item-card">
                        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div className="mini-avatar" style={{ background: rep.author_avatar === 'د' ? 'linear-gradient(135deg, #10b981, #059669)' : '' }}>{rep.author_avatar}</div>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f1f5f9' }}>{rep.author_name}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginRight: '0.75rem' }}>{rep.submitted_at}</span>
                          </div>
                        </div>
                        <p className="reply-content-prose">{rep.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleReplySubmit} className="reply-compose-form">
                <textarea 
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="اكتب ردك الأكاديمي أو إجابتك التوضيحية لزملائك هنا..."
                  rows={2}
                  required
                />
                <button type="submit" className="send-reply-btn">إرسال الرد 💾</button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* New Thread Modal Form */}
      {showNewThreadModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card" style={{ maxWidth: '580px', width: '100%', padding: '2.5rem' }}>
            <h2 className="text-gradient" style={{ marginBottom: '1.5rem', fontSize: '1.6rem', fontWeight: 700 }}>طرح موضوع نقاشي جديد بالمساق</h2>
            
            <form onSubmit={handleCreateThread} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>عنوان الموضوع (سؤالك أو موضوعك)</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="مثال: استفسار عن خوارزميات التصنيف"
                />
              </div>

              <div className="form-group">
                <label>تفاصيل الموضوع وشرح الاستفسار</label>
                <textarea 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                  rows={5}
                  placeholder="اكتب بالتفصيل سؤالك البرمجي أو الأكاديمي مع ذكر تفاصيل المشكلة لتسهل على الآخرين مساعدتك..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="confirm-btn">💾 طرح ونشر الموضوع بالمساق</button>
                <button type="button" onClick={() => setShowNewThreadModal(false)} className="cancel-btn">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        .main-header {
          padding: 1rem 2rem;
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 1rem;
          z-index: 100;
        }
        .nav-links {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }
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
        .logout-btn {
          color: #f87171 !important;
          background: rgba(239, 68, 68, 0.08) !important;
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2) !important;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.2) !important;
        }

        /* Forums specific layout */
        .forum-select {
          padding: 0.6rem 1rem;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(0,0,0,0.5);
          color: white;
          font-size: 0.9rem;
          font-family: inherit;
          outline: none;
          max-width: 320px;
          width: 100%;
        }
        .forum-split-layout {
          display: flex;
          gap: 1.5rem;
          height: 620px;
        }
        .threads-list-pane {
          flex: 1;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-color: rgba(255,255,255,0.05);
        }
        .new-thread-btn {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-family: inherit;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s;
        }
        .new-thread-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
        }
        .threads-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          overflow-y: auto;
          flex: 1;
          padding-left: 0.5rem;
        }
        .thread-item-card {
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.04);
          padding: 1rem 1.25rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .thread-item-card:hover, .thread-item-card.active {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .mini-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .thread-item-card h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: white;
          line-height: 1.4;
        }
        .thread-meta-desc {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.2rem;
        }
        .reply-count-badge {
          font-size: 0.75rem;
          background: rgba(255,255,255,0.05);
          color: #94a3b8;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          white-space: nowrap;
        }

        /* Right thread active details */
        .active-thread-pane {
          flex: 1.5;
          padding: 2rem;
          border-color: rgba(255,255,255,0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .no-thread-selected {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          max-width: 420px;
          margin: 0 auto;
          gap: 1rem;
        }
        .no-thread-selected h3 {
          font-size: 1.4rem;
          font-weight: 700;
          color: white;
        }
        .no-thread-selected p {
          font-size: 0.9rem;
          color: #94a3b8;
          line-height: 1.6;
        }
        .thread-content-workspace {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .original-post-card {
          border-bottom: 1px dashed rgba(255,255,255,0.1);
          padding-bottom: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .prose-content {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #cbd5e1;
          text-align: justify;
          margin-top: 0.5rem;
        }
        .replies-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .replies-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.85rem;
        }
        .replies-list-container {
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-left: 0.5rem;
          margin-bottom: 1rem;
        }
        .reply-item-card {
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.03);
          padding: 1rem;
          border-radius: 10px;
        }
        .reply-content-prose {
          font-size: 0.9rem;
          color: #cbd5e1;
          line-height: 1.5;
        }
        .reply-compose-form {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 1rem;
        }
        .reply-compose-form textarea {
          flex: 1;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(0,0,0,0.4);
          color: white;
          font-family: inherit;
          font-size: 0.9rem;
          outline: none;
          resize: none;
        }
        .reply-compose-form textarea:focus {
          border-color: #3b82f6;
        }
        .send-reply-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          font-family: inherit;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }
        .send-reply-btn:hover {
          background: #059669;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </main>
  );
}
