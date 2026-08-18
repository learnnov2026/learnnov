'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  youtubeId: string;
  category: string;
}

export default function GoogleWorkspaceAndYouTubePage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const { language, isRtl } = useLanguage();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  const [activeVideo, setActiveVideo] = useState<YouTubeVideo>({
    id: '1',
    title: language === 'ar' ? 'احتراف هندسة الأوامر والذكاء الاصطناعي التوليدي' : 'Mastering Prompt Engineering & Generative AI',
    channel: 'جامعة ليرنوف السحابية - LearnNov Channel',
    duration: '18:45',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    youtubeId: 'dQw4w9WgXcQ',
    category: 'الذكاء الاصطناعي'
  });

  const [customYoutubeUrl, setCustomYoutubeUrl] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const videos: YouTubeVideo[] = [
    {
      id: '1',
      title: language === 'ar' ? 'احتراف هندسة الأوامر والذكاء الاصطناعي التوليدي' : 'Mastering Prompt Engineering & Generative AI',
      channel: 'قناة ليرنوف التعليمية',
      duration: '18:45',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      youtubeId: 'dQw4w9WgXcQ',
      category: 'الذكاء الاصطناعي'
    },
    {
      id: '2',
      title: language === 'ar' ? 'بناء تطبيقات الويب الحديثة بـ Next.js 16 و React 19' : 'Building Modern Fullstack Apps with Next.js 16',
      channel: 'أكاديمية ليرنوف للبرمجة',
      duration: '24:10',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
      youtubeId: 'SqcY0GlETPk',
      category: 'هندسة البرمجيات'
    },
    {
      id: '3',
      title: language === 'ar' ? 'أساسيات الأمن السيبراني واختبار الاختراق الأخلاقي' : 'Cybersecurity & Ethical Hacking Guide',
      channel: 'معهد الأمان الرقمي',
      duration: '32:00',
      thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
      youtubeId: '3Kq1MIfTWCE',
      category: 'الأمن السيبراني'
    }
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleEmbedCustomVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYoutubeId(customYoutubeUrl);
    if (ytId) {
      const customVid: YouTubeVideo = {
        id: Date.now().toString(),
        title: language === 'ar' ? 'فيديو يوتيوب تعليمي مخصص' : 'Custom YouTube Video Lesson',
        channel: 'YouTube Video',
        duration: 'مباشر',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        youtubeId: ytId,
        category: 'مخصص'
      };
      setActiveVideo(customVid);
      showToast(language === 'ar' ? 'تم تضمين فيديو يوتيوب داخل الدرس بنجاح!' : 'YouTube Video Embedded!');
      setCustomYoutubeUrl('');
    } else {
      showToast(language === 'ar' ? 'يرجى إدخال رابط يوتيوب صحيح.' : 'Invalid YouTube URL.');
    }
  };

  // Google Calendar Link Builder
  const createGoogleCalendarLink = (title: string, details: string) => {
    const startTime = new Date(Date.now() + 86400000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endTime = new Date(Date.now() + 90000000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(details)}&location=LearnNov+Cloud+Platform`;
  };

  if (isLoading || !isLoggedIn) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <main className="dashboard-container" dir={isRtl ? 'rtl' : 'ltr'} style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Cairo, sans-serif' }}>
      
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', backgroundColor: '#ffffff', border: '1px solid #10B981', borderLeft: '5px solid #10B981', color: '#0f172a', padding: '0.85rem 1.25rem', borderRadius: '12px', zIndex: 9999, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          ✅ {toastMsg}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '2rem', flexShrink: 0 }}>
          📺
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            {language === 'ar' ? 'ربط YouTube و Google Workspace الأكاديمي' : 'YouTube & Google Workspace Hub'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.4rem 0 0 0' }}>
            {language === 'ar' 
              ? 'عرض وبث المحاضرات التعليمية مباشرة من YouTube، والربط المتكامل مع Google Meet, Calendar, Drive & Classroom' 
              : 'Stream YouTube lectures directly inside the platform and seamlessly integrate with Google Meet, Calendar, Drive & Classroom'}
          </p>
        </div>
      </div>

      {/* Grid: Main YouTube Player & Workspace Tools */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Left/Main Column: YouTube Player */}
        <div>
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '14px', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=0&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: 800 }}>
                  {activeVideo.category}
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.5rem', color: '#0f172a' }}>{activeVideo.title}</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>📺 {activeVideo.channel} • ⏱️ {activeVideo.duration}</p>
              </div>

              {/* Share to Google Classroom Button */}
              <a
                href={`https://classroom.google.com/share?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`)}&title=${encodeURIComponent(activeVideo.title)}`}
                target="_blank"
                rel="noreferrer"
                style={{ background: '#2563eb', color: '#FFF', padding: '0.55rem 1.1rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                🏫 مشاركة في Google Classroom
              </a>
            </div>
          </div>

          {/* Embed Custom YouTube Video Form */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>🔗 تضمين فيديو يوتيوب مخصص في المقرر:</h3>
            <form onSubmit={handleEmbedCustomVideo} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder={language === 'ar' ? 'ضع رابط فيديو يوتيوب هنا (مثال: https://www.youtube.com/watch?v=...)' : 'Paste YouTube URL here...'}
                value={customYoutubeUrl}
                onChange={e => setCustomYoutubeUrl(e.target.value)}
                style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }}
                required
              />
              <button type="submit" style={{ backgroundColor: '#dc2626', color: '#FFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                عرض الفيديو
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Google Workspace Integration Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Google Meet Card */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', borderRight: '5px solid #10b981', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📹</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Google Meet</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              {language === 'ar' ? 'إطلاق وبدء المحاضرات التفاعلية المباشرة وساعات العمل المكتبية عبر Google Meet.' : 'Launch live lectures and office hours via Google Meet.'}
            </p>
            <a
              href="https://meet.google.com/new"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', textAlign: 'center', backgroundColor: '#10b981', color: '#FFF', padding: '0.6rem', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}
            >
              🚀 فتح قاعة Google Meet الحية
            </a>
          </div>

          {/* Google Calendar Card */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', borderRight: '5px solid #2563eb', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Google Calendar</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              {language === 'ar' ? 'إضافة مواعيد المحاضرات والاختبارات مباشرة لتقويم Google الخاص بك.' : 'Sync lecture dates and exam schedules to your Google Calendar.'}
            </p>
            <a
              href={createGoogleCalendarLink('محاضرة ليرنوف التفاعلية - الذكاء الاصطناعي', 'محاضرة بث مباشر لمقرر احتراف هندسة الأوامر والذكاء الاصطناعي')}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', textAlign: 'center', backgroundColor: '#2563eb', color: '#FFF', padding: '0.6rem', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}
            >
              ➕ مزامنة مع تقويم Google
            </a>
          </div>

          {/* Google Drive Card */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', borderRight: '5px solid #f59e0b', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📁</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Google Drive & Docs</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              {language === 'ar' ? 'مستودع المذكرات، الملخصات، والمراجع الأكاديمية المشتركة على السحابة.' : 'Cloud storage for course notes, lecture slides, and PDF assignments.'}
            </p>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', textAlign: 'center', backgroundColor: '#f59e0b', color: '#FFF', padding: '0.6rem', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}
            >
              📂 فتح مجلد المراجع على Google Drive
            </a>
          </div>

        </div>

      </div>

      {/* Playlist Grid */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
        📚 قائمة المحاضرات المسجلة عبر YouTube:
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {videos.map(vid => (
          <div
            key={vid.id}
            onClick={() => { setActiveVideo(vid); showToast(`تم اختيار: ${vid.title}`); }}
            style={{ backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', border: activeVideo.id === vid.id ? '2px solid #2563eb' : '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
          >
            <div style={{ position: 'relative', height: '140px' }}>
              <img src={vid.thumbnail} alt={vid.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.75)', color: '#FFF', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                {vid.duration}
              </span>
            </div>
            <div style={{ padding: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#0f172a' }}>{vid.title}</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{vid.channel}</p>
            </div>
          </div>
        ))}
      </div>

    </main>
  );
}
