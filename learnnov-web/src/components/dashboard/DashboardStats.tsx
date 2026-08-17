'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface DashboardStatsProps {
  userName: string | null;
  userRole: string | null;
  certificatesEarned: number;
  examsPassed: number;
  activeProgramsCount: number;
  discussionsStarted: number;
  referralCode: string;
  referralPoints: number;
  statsError: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  userName,
  userRole,
  certificatesEarned,
  examsPassed,
  activeProgramsCount,
  discussionsStarted,
  referralCode,
  referralPoints,
  statsError,
}) => {
  const { language, t, isRtl } = useLanguage();

  const welcomeName = userName || (userRole === 'instructor' ? 'د. علي البراك' : 'طالب ليرنوف المتميز');

  return (
    <>
      {/* Profile Header section */}
      <div className="glass-panel profile-header">
        <div className="profile-avatar">{welcomeName.charAt(0)}</div>
        <div className="profile-info">
          <h1>{t('welcomeStudent', { name: welcomeName })}</h1>
          <p>
            {language === 'ar'
              ? 'أهلاً بك في فضاء التعلم الذكي المتصل بقواعد البيانات السحابية الحية'
              : 'Welcome to the smart learning environment connected to the live cloud database'}
          </p>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <h2 className="section-title">
        {language === 'ar' ? 'إحصائياتك الأكاديمية الحية' : 'Your Live Academic Statistics'}
      </h2>
      {statsError && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            color: '#f87171',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          ⚠️ {language === 'ar' ? 'فشل تحميل البيانات الأكاديمية الحية من الخادم.' : 'Failed to load live academic data from server.'}
        </div>
      )}

      <div className="stats-grid">
        <div
          className="glass-panel stat-card"
          style={{
            borderLeft: isRtl ? '4px solid var(--accent)' : 'none',
            borderRight: !isRtl ? '4px solid var(--accent)' : 'none',
          }}
        >
          <div className="stat-icon">🎓</div>
          <div className="stat-value">{certificatesEarned}</div>
          <div className="stat-label">{language === 'ar' ? 'الشهادات المكتسبة' : 'Certificates Earned'}</div>
        </div>

        <div
          className="glass-panel stat-card"
          style={{
            borderLeft: isRtl ? '4px solid var(--accent-secondary)' : 'none',
            borderRight: !isRtl ? '4px solid var(--accent-secondary)' : 'none',
          }}
        >
          <div className="stat-icon">📝</div>
          <div className="stat-value">{examsPassed}</div>
          <div className="stat-label">{language === 'ar' ? 'الاختبارات المجتازة' : 'Exams Passed'}</div>
        </div>

        <div
          className="glass-panel stat-card"
          style={{
            borderLeft: isRtl ? '4px solid var(--accent)' : 'none',
            borderRight: !isRtl ? '4px solid var(--accent)' : 'none',
          }}
        >
          <div className="stat-icon">📚</div>
          <div className="stat-value">{activeProgramsCount}</div>
          <div className="stat-label">{language === 'ar' ? 'البرامج النشطة بالداتابيز' : 'Active Programs in DB'}</div>
        </div>

        <div
          className="glass-panel stat-card"
          style={{
            borderLeft: isRtl ? '4px solid var(--accent-secondary)' : 'none',
            borderRight: !isRtl ? '4px solid var(--accent-secondary)' : 'none',
          }}
        >
          <div className="stat-icon">💬</div>
          <div className="stat-value">{discussionsStarted}</div>
          <div className="stat-label">{language === 'ar' ? 'النقاشات المطروحة' : 'Discussions Started'}</div>
        </div>

        <div
          className="glass-panel stat-card"
          style={{
            borderLeft: isRtl ? '4px solid var(--accent)' : 'none',
            borderRight: !isRtl ? '4px solid var(--accent)' : 'none',
            gridColumn: 'span 1',
          }}
        >
          <div className="stat-icon">🌟</div>
          <div className="stat-value">{referralPoints}</div>
          <div className="stat-label">
            {language === 'ar' ? 'رمز الإحالة: ' : 'Referral Code: '}
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{referralCode}</span>
          </div>
        </div>
      </div>
    </>
  );
};
