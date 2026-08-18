'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function AnalyticsPage() {
  const router = useRouter();
  const { isLoggedIn, userName, userRole, isLoading } = useAuth();
  const { language, isRtl } = useLanguage();
  const [profileData, setProfileData] = useState<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/users/me/profile')
      .then(res => res.json())
      .then(data => setProfileData(data.user))
      .catch(err => console.error(err));
  }, [isLoggedIn]);

  if (isLoading || !isLoggedIn || !profileData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)', color: '#0f172a', fontFamily: 'Cairo, sans-serif' }}>
        جاري تحضير مؤشرات أداء الطالب...
      </div>
    );
  }

  const studentName = userName || 'طالب ليرنوف المتميز';
  const completedCoursesCount = profileData?.certificates?.length || 0;
  const examsPassedCount = 3; // Mocked for now
  const totalLearningHours = 48;
  const streakDays = 14;

  const skills = [
    { name: language === 'ar' ? 'هندسة الأوامر Prompt Engineering' : 'Prompt Engineering', score: 96, color: '#6366F1' },
    { name: language === 'ar' ? 'تطوير تطبيقات الويب Next.js 16' : 'Next.js 16 Web Dev', score: 92, color: '#06B6D4' },
    { name: language === 'ar' ? 'الأمن السيبراني والتحكم بالصلاحيات RBAC' : 'Cybersecurity & RBAC', score: 88, color: '#10B981' },
    { name: language === 'ar' ? 'قواعد البيانات السحابية Supabase & SQL' : 'Cloud Databases & SQL', score: 94, color: '#F59E0B' },
  ];

  const weeklyData = [
    { day: language === 'ar' ? 'الأحد' : 'Sun', hours: 3.5 },
    { day: language === 'ar' ? 'الإثنين' : 'Mon', hours: 5.0 },
    { day: language === 'ar' ? 'الثلاثاء' : 'Tue', hours: 4.2 },
    { day: language === 'ar' ? 'الأربعاء' : 'Wed', hours: 6.8 },
    { day: language === 'ar' ? 'الخميس' : 'Thu', hours: 5.5 },
    { day: language === 'ar' ? 'الجمعة' : 'Fri', hours: 2.0 },
    { day: language === 'ar' ? 'السبت' : 'Sat', hours: 4.0 },
  ];

  const handleDownloadPdf = () => {
    alert(language === 'ar' ? 'جاري تجهيز وتحميل التقرير الأكاديمي الشامل بصيغة PDF...' : 'Generating official academic transcript PDF report...');
  };

  return (
    <main className="dashboard-container" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="glass-panel profile-header" style={{ borderLeft: '5px solid #06B6D4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', background: '#ffffff', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            📊 {language === 'ar' ? 'لوحة تحليلات الأداء الأكاديمي والسرعة التعليمية' : 'Academic Analytics & Performance Radar'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.3rem' }}>
            {language === 'ar' ? `مرحباً ${studentName}، إليك تحليل الذكاء الاصطناعي لساعات دراستك ومدى استيعابك للمهارات.` : `Welcome ${studentName}, here is your AI-driven learning velocity and skill radar.`}
          </p>
        </div>

        <button onClick={handleDownloadPdf} style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Cairo, sans-serif' }}>
          📄 {language === 'ar' ? 'تحميل السجل الأكاديمي PDF' : 'Download Transcript PDF'}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '2rem' }}>
        <div style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '4px solid #6366F1', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{language === 'ar' ? 'ساعات التعلم التراكمية' : 'Total Study Hours'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0' }}>{totalLearningHours} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>ساعة</span></div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>📈 +18% {language === 'ar' ? 'مقارنة بالأسبوع الماضي' : 'vs last week'}</div>
        </div>

        <div style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '4px solid #06B6D4', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{language === 'ar' ? 'أيام الاستمرارية المباشرة' : 'Current Study Streak'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0' }}>{streakDays} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>يوم متوالي 🔥</span></div>
          <div style={{ fontSize: '0.75rem', color: '#06B6D4', fontWeight: 700 }}>🔥 {language === 'ar' ? 'أفضل تتابع تعليمي لك هذا الشهر' : 'Best monthly streak'}</div>
        </div>

        <div style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '4px solid #10B981', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{language === 'ar' ? 'معدل النجاح والاختبارات' : 'Exam Success Rate'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0' }}>96.5%</div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>🎯 {examsPassedCount} {language === 'ar' ? 'اختبارات مجتازة بنجاح' : 'exams passed'}</div>
        </div>

        <div style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '4px solid #F59E0B', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{language === 'ar' ? 'الترتيب بين الدفعة' : 'Cohort Percentile'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0' }}>Top 3%</div>
          <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>🏆 {language === 'ar' ? 'ضمن قائمة المتفوقين' : 'Honor Roll Student'}</div>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        
        {/* Weekly Hours Bar Graph Simulation */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
              📈 {language === 'ar' ? 'توزيع ساعات التعلم اليومية (هذا الأسبوع)' : 'Daily Learning Distribution (This Week)'}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingTop: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {weeklyData.map((d, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: '#06B6D4', fontWeight: 700 }}>{d.hours}h</span>
                <div style={{
                  width: '28px',
                  height: `${(d.hours / 7) * 130}px`,
                  background: idx === 3 ? 'linear-gradient(180deg, #06B6D4 0%, #6366F1 100%)' : 'rgba(99,102,241,0.3)',
                  borderRadius: '6px',
                  transition: 'height 0.3s ease'
                }} />
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Competency Heatmap */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem 0', color: '#FFF' }}>
            🎯 {language === 'ar' ? 'مؤشر إتقان المهارات الأكاديمية' : 'Skill Mastery Index'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {skills.map((skill, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, color: '#E2E8F0' }}>{skill.name}</span>
                  <span style={{ color: skill.color, fontWeight: 800 }}>{skill.score}%</span>
                </div>
                <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${skill.score}%`, backgroundColor: skill.color, borderRadius: '99px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
