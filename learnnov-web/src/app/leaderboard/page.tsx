'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/services/api';

interface StudentRank {
  rank: number;
  name: string;
  avatar: string;
  track: string;
  xp: number;
  gpa: string;
  streak: number;
  badge: string;
}

export default function LeaderboardPage() {
  const { isLoggedIn, userName, isLoading } = useAuth();
  const { language, isRtl } = useLanguage();
  const [leaderData, setLeaderData] = useState<StudentRank[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fallbackData: StudentRank[] = [
    { rank: 1, name: 'سارة الأحمد', avatar: '👩‍💻', track: 'هندسة الذكاء الاصطناعي', xp: 9850, gpa: '99.2%', streak: 45, badge: '🥇 خبير ماسي Diamond' },
    { rank: 2, name: userName || 'طالب ليرنوف المتميز', avatar: '🎓', track: 'تطوير تطبيقات الويب بـ Next.js', xp: 9420, gpa: '98.5%', streak: 32, badge: '🥈 محترف ذهبي Gold' },
    { rank: 3, name: 'م. عبد الله العتيبي', avatar: '👨‍💻', track: 'الأمن السيبراني والـ RBAC', xp: 9110, gpa: '97.8%', streak: 28, badge: '🥉 متفوق فضي Silver' },
    { rank: 4, name: 'د. يوسف الغامدي', avatar: '🧠', track: 'هندسة الأوامر والـ Prompts', xp: 8840, gpa: '96.5%', streak: 21, badge: '🎖️ متميز Elite' },
    { rank: 5, name: 'ريم المطيري', avatar: '⚡', track: 'قواعد البيانات السحابية Supabase', xp: 8520, gpa: '95.9%', streak: 19, badge: '🎖️ متميز Elite' },
    { rank: 6, name: 'خالد بن محمد', avatar: '🚀', track: 'تطوير تطبيقات الويب بـ Next.js', xp: 8200, gpa: '95.0%', streak: 15, badge: '⭐ متقدم Pro' },
    { rank: 7, name: 'منى الشمري', avatar: '💻', track: 'الأمن السيبراني والـ RBAC', xp: 7950, gpa: '94.2%', streak: 12, badge: '⭐ متقدم Pro' },
    { rank: 8, name: 'عمر الزهراني', avatar: '🛡️', track: 'هندسة الذكاء الاصطناعي', xp: 7600, gpa: '93.5%', streak: 10, badge: '⭐ متقدم Pro' },
  ];

  useEffect(() => {
    api.get<StudentRank[]>('/api/leaderboard')
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLeaderData(data);
        } else {
          setLeaderData(fallbackData);
        }
      })
      .catch(() => {
        setLeaderData(fallbackData);
      })
      .finally(() => setLoadingData(false));
  }, []);

  if (isLoading || loadingData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)', color: '#0f172a', fontFamily: 'Cairo, sans-serif' }}>
        جاري تحميل لائحة المتفوقين والشرف الأكاديمي...
      </div>
    );
  }

  const top1 = leaderData[0] || fallbackData[0];
  const top2 = leaderData[1] || fallbackData[1];
  const top3 = leaderData[2] || fallbackData[2];

  return (
    <main className="dashboard-container" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="glass-panel profile-header" style={{ borderLeft: '5px solid #2563eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', background: '#ffffff', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            🏆 {language === 'ar' ? 'لائحة الشرف ولوحة المتفوقين الأكاديمية' : 'Global Academic Leaderboard & Honor Roll'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.3rem' }}>
            {language === 'ar' ? 'تصنيف أفضل طلاب المنصة بناءً على معدل الاختبارات، المشاريع المسلمة، والشهادات المكتسبة.' : 'Global rankings based on exam GPA, submitted projects, and earned certificates.'}
          </p>
        </div>
      </div>

      {/* Top 3 Podium Display */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '2.5rem', alignItems: 'flex-end' }}>
        
        {/* 2nd Place */}
        <div style={{ padding: '1.5rem', borderRadius: '20px', borderTop: '6px solid #94a3b8', textAlign: 'center', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '2.5rem' }}>🥈</div>
          <div style={{ fontSize: '2.2rem', margin: '0.4rem 0' }}>{top2.avatar}</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>{top2.name}</h3>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>{top2.track}</div>
          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800 }}>
            {top2.xp} XP
          </span>
        </div>

        {/* 1st Place (Center / Taller) */}
        <div style={{ padding: '2rem 1.5rem', borderRadius: '20px', borderTop: '6px solid #eab308', textAlign: 'center', background: 'linear-gradient(180deg, #fefce8 0%, #ffffff 100%)', transform: 'scale(1.05)', border: '1px solid #fef08a', boxShadow: '0 10px 30px rgba(234, 179, 8, 0.15)' }}>
          <div style={{ fontSize: '3rem' }}>🥇</div>
          <div style={{ fontSize: '2.8rem', margin: '0.4rem 0' }}>{top1.avatar}</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>{top1.name}</h3>
          <div style={{ fontSize: '0.8rem', color: '#ca8a04', marginBottom: '0.75rem', fontWeight: 700 }}>{top1.track}</div>
          <span style={{ backgroundColor: '#eab308', color: '#000', padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 900 }}>
            {top1.xp} XP 🔥
          </span>
        </div>

        {/* 3rd Place */}
        <div style={{ padding: '1.5rem', borderRadius: '20px', borderTop: '6px solid #f97316', textAlign: 'center', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '2.5rem' }}>🥉</div>
          <div style={{ fontSize: '2.2rem', margin: '0.4rem 0' }}>{top3.avatar}</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>{top3.name}</h3>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>{top3.track}</div>
          <span style={{ backgroundColor: '#fff7ed', color: '#c2410c', padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800 }}>
            {top3.xp} XP
          </span>
        </div>

      </div>

      {/* Leaderboard Table */}
      <div style={{ marginTop: '2.5rem', padding: '1.5rem', borderRadius: '20px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
          📜 {language === 'ar' ? 'جدول ترتيب المتفوقين الكامل' : 'Complete Honor Roll Rankings'}
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.75rem 1rem' }}># الترتيب</th>
              <th style={{ padding: '0.75rem 1rem' }}>الطالب</th>
              <th style={{ padding: '0.75rem 1rem' }}>المسار الأكاديمي</th>
              <th style={{ padding: '0.75rem 1rem' }}>المعدل (GPA)</th>
              <th style={{ padding: '0.75rem 1rem' }}>الأيام المتوالية</th>
              <th style={{ padding: '0.75rem 1rem' }}>نقاط الخبرة XP</th>
              <th style={{ padding: '0.75rem 1rem' }}>الرتبة الأكاديمية</th>
            </tr>
          </thead>
          <tbody>
            {leaderData.map(student => (
              <tr 
                key={student.rank} 
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: student.rank === 1 ? 'rgba(234, 179, 8, 0.04)' : student.rank === 2 ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                  color: '#0f172a',
                  fontSize: '0.9rem'
                }}
              >
                <td style={{ padding: '1rem', fontWeight: 800, color: student.rank <= 3 ? '#2563eb' : '#64748b' }}>
                  #{student.rank}
                </td>
                <td style={{ padding: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{student.avatar}</span>
                  <span>{student.name}</span>
                </td>
                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem' }}>{student.track}</td>
                <td style={{ padding: '1rem', color: '#10b981', fontWeight: 800 }}>{student.gpa}</td>
                <td style={{ padding: '1rem', color: '#0284c7', fontWeight: 700 }}>{student.streak} يوم 🔥</td>
                <td style={{ padding: '1rem', fontWeight: 900, color: '#2563eb' }}>{student.xp}</td>
                <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748b' }}>{student.badge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
