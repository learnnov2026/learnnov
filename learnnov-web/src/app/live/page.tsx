'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface LiveSession {
  id: string;
  title: string;
  titleEn: string;
  instructor: string;
  date: string;
  status: 'live' | 'upcoming' | 'recorded';
  viewers?: number;
  thumbnail: string;
  tags: string[];
}

const mockSessions: LiveSession[] = [
  {
    id: 'l1',
    title: 'هندسة البرمجيات المتقدمة: معمارية المايكروسيرفيسز',
    titleEn: 'Advanced Software Engineering: Microservices Architecture',
    instructor: 'د. علي البراك',
    date: 'الآن',
    status: 'live',
    viewers: 1240,
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    tags: ['Backend', 'Architecture', 'LIVE']
  },
  {
    id: 'l2',
    title: 'أساسيات الذكاء الاصطناعي وتعلم الآلة',
    titleEn: 'Fundamentals of AI & Machine Learning',
    instructor: 'د. سارة العتيبي',
    date: 'غداً، 7:00 م',
    status: 'upcoming',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    tags: ['AI', 'Python']
  },
  {
    id: 'l3',
    title: 'ورشة عمل تفاعلية: بناء تطبيقات Next.js 16',
    titleEn: 'Interactive Workshop: Building Next.js 16 Apps',
    instructor: 'م. أحمد الخالد',
    date: 'بعد يومين، 5:00 م',
    status: 'upcoming',
    thumbnail: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    tags: ['Frontend', 'React', 'Next.js']
  }
];

export default function LiveClassesPage() {
  const router = useRouter();
  const { isLoggedIn, userRole, isLoading } = useAuth();
  const { language, isRtl, t } = useLanguage();
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState<{user: string, msg: string}[]>([
    { user: 'Ahmed', msg: 'Welcome everyone!' },
    { user: 'Sara', msg: 'Is the sound clear?' },
    { user: 'System', msg: 'The instructor has started screen sharing.' }
  ]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading || !isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatLog(prev => [...prev, { user: 'You', msg: chatMessage }]);
    setChatMessage('');
  };

  if (activeSession) {
    return (
      <main className="dashboard-container" dir={isRtl ? 'rtl' : 'ltr'} style={{ height: 'calc(100vh - 100px)', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="live-badge-pulse"></span>
              {language === 'ar' ? activeSession.title : activeSession.titleEn}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {language === 'ar' ? 'بواسطة' : 'By'}: {activeSession.instructor} • 👁️ {activeSession.viewers} {language === 'ar' ? 'مشاهد' : 'viewers'}
            </p>
          </div>
          <button 
            onClick={() => setActiveSession(null)}
            style={{ padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            {language === 'ar' ? 'مغادرة الفصل' : 'Leave Class'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1rem', height: 'calc(100% - 80px)' }}>
          {/* Video Player Area */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, background: '#000', position: 'relative' }}>
              <img src={activeSession.thumbnail} alt="stream" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', marginBottom: '1rem' }}>
                  <span style={{ color: '#FFF', fontSize: '1.5rem', marginLeft: '5px' }}>▶</span>
                </div>
                <span style={{ color: '#FFF', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                  {language === 'ar' ? 'جاري البث المباشر...' : 'Live Stream in progress...'}
                </span>
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="stream-btn">🎤</button>
                <button className="stream-btn">📹</button>
                <button className="stream-btn">💻</button>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="stream-btn">⚙️</button>
                <button className="stream-btn">🔲</button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', fontWeight: 600 }}>
              💬 {language === 'ar' ? 'المحادثة المباشرة' : 'Live Chat'}
            </div>
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {chatLog.map((c, i) => (
                <div key={i} style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, color: c.user === 'System' ? '#ef4444' : c.user === 'You' ? 'var(--accent)' : '#818cf8', marginRight: '0.5rem' }}>{c.user}:</span>
                  <span style={{ color: c.user === 'System' ? '#94a3b8' : 'var(--text-color)', fontStyle: c.user === 'System' ? 'italic' : 'normal' }}>{c.msg}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-color)' }}
              />
              <button type="submit" style={{ padding: '0 1rem', borderRadius: '8px', background: 'var(--accent)', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {language === 'ar' ? 'إرسال' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-container" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {language === 'ar' ? 'الفصول الافتراضية المباشرة' : 'Live Virtual Classrooms'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            {language === 'ar' ? 'انضم إلى البث المباشر وتفاعل مع المحاضرين والزملاء في الوقت الفعلي' : 'Join live streams and interact with instructors and peers in real-time'}
          </p>
        </div>
        {userRole === 'instructor' && (
          <button style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))', color: '#FFF', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 25px var(--accent-glow)' }}>
            + {language === 'ar' ? 'إنشاء فصل مباشر جديد' : 'Create New Live Class'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {mockSessions.map(session => (
          <div key={session.id} className="glass-panel session-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', height: '180px' }}>
              <img src={session.thumbnail} alt={session.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {session.status === 'live' && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', backdropFilter: 'blur(4px)' }}>
                  <span className="live-indicator"></span> LIVE
                </div>
              )}
              {session.status === 'upcoming' && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0, 0, 0, 0.7)', color: '#FFF', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                  🗓️ {language === 'ar' ? 'مجدول' : 'Upcoming'}
                </div>
              )}
            </div>
            
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {session.tags.map((tag, idx) => (
                  <span key={idx} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent)', borderRadius: '4px', fontWeight: 600 }}>
                    {tag}
                  </span>
                ))}
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                {language === 'ar' ? session.title : session.titleEn}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                👨‍🏫 {session.instructor}
              </p>
              
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                  {session.status === 'live' ? `👁️ ${session.viewers} ${language === 'ar' ? 'مشاهد' : 'watching'}` : `⏰ ${session.date}`}
                </span>
                
                <button 
                  onClick={() => session.status === 'live' ? setActiveSession(session) : alert(language === 'ar' ? 'الفصل لم يبدأ بعد!' : 'Class has not started yet!')}
                  style={{ 
                    padding: '0.5rem 1.25rem', 
                    borderRadius: '8px', 
                    background: session.status === 'live' ? 'var(--accent)' : 'transparent',
                    border: session.status === 'live' ? 'none' : '1px solid var(--accent)',
                    color: session.status === 'live' ? '#FFF' : 'var(--accent)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  className={session.status === 'live' ? 'live-join-btn' : 'upcoming-join-btn'}
                >
                  {session.status === 'live' ? (language === 'ar' ? 'انضمام الآن' : 'Join Now') : (language === 'ar' ? 'تذكير' : 'Remind Me')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .live-indicator {
          width: 8px;
          height: 8px;
          background-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-red 1.5s infinite;
        }
        .live-badge-pulse {
          width: 12px;
          height: 12px;
          background-color: #ef4444;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-red 1.5s infinite;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .session-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .session-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .live-join-btn:hover {
          box-shadow: 0 0 15px var(--accent-glow);
        }
        .upcoming-join-btn:hover {
          background: rgba(14, 165, 233, 0.1) !important;
        }
        .stream-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          transition: all 0.2s;
        }
        .stream-btn:hover {
          background: rgba(255,255,255,0.2);
          transform: scale(1.05);
        }
      `}</style>
    </main>
  );
}
