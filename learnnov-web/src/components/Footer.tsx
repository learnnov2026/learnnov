'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const { language, isRtl } = useLanguage();

  // If inside admin or instructor dashboards, hide global footer (they have their own layout)
  if (pathname.startsWith('/admin') || pathname.startsWith('/instructor')) {
    return null;
  }

  // If on login page, display only a clean, minimal copyright footer without internal links
  if (pathname === '/login') {
    return (
      <footer 
        dir={isRtl ? 'rtl' : 'ltr'} 
        style={{
          borderTop: '1px solid rgba(226, 232, 240, 0.6)',
          padding: '1.5rem',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.85rem',
          fontFamily: 'Cairo, sans-serif'
        }}
      >
        © 2026 LearnNov Academic Cloud Platform. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
      </footer>
    );
  }

  return (
    <footer 
      dir={isRtl ? 'rtl' : 'ltr'} 
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        color: '#64748b',
        padding: '3.5rem 1.5rem 2rem',
        marginTop: '5rem',
        fontFamily: 'Cairo, sans-serif'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid #f1f5f9' }}>
        
        {/* Col 1: Platform Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#FFF', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
              LN
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>LearnNov Platform</span>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>المنصة الأكاديمية السحابية الذكية</span>
            </div>
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: '1.7', color: '#475569' }}>
            {language === 'ar' 
              ? 'المنصة الأكاديمية السحابية المتكاملة لهندسة الذكاء الاصطناعي، الأمن السيبراني، وتطوير تطبيقات الويب الفائقة.' 
              : 'The comprehensive cloud academic platform for AI Engineering, Cybersecurity, and Next.js Web Development.'}
          </p>
        </div>

        {/* Col 2: Quick Links (Contextual based on auth) */}
        <div>
          <h4 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem' }}>
            {language === 'ar' ? 'الروابط السريعة' : 'Quick Navigation'}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
            <li><Link href="/" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>{language === 'ar' ? '🏠 الرئيسية' : '🏠 Home'}</Link></li>
            <li><Link href="/specializations" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>{language === 'ar' ? '🎓 المسارات والتخصصات' : '🎓 Specializations'}</Link></li>
            <li><Link href="/certificates" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>{language === 'ar' ? '📜 توثيق الشهادات' : '📜 Certificate Verification'}</Link></li>
            <li><Link href="/leaderboard" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>{language === 'ar' ? '🏆 لوحة المتصدرين' : '🏆 Leaderboard'}</Link></li>
            {isLoggedIn && (
              <>
                <li><Link href="/exams" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>{language === 'ar' ? '📝 الاختبارات والتقييم' : '📝 Exams'}</Link></li>
                <li><Link href="/discussions" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>{language === 'ar' ? '💬 منتدى النقاشات' : '💬 Discussions'}</Link></li>
              </>
            )}
          </ul>
        </div>

        {/* Col 3: Services & Integrations */}
        <div>
          <h4 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem' }}>
            {language === 'ar' ? 'الخدمات والدعم' : 'Services & Support'}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
            <li><Link href="/support" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}>{language === 'ar' ? '🛟 مركز الدعم والمساعدة' : '🛟 Help Center'}</Link></li>
            {isLoggedIn ? (
              <>
                <li><Link href="/workspace" style={{ color: '#dc2626', textDecoration: 'none', fontWeight: 700 }}>{language === 'ar' ? '📺 YouTube و Google Workspace' : '📺 YouTube & Google'}</Link></li>
                <li><Link href="/career" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 700 }}>{language === 'ar' ? '💼 المرشد المهني وسوق العمل' : '💼 Career Pathfinder'}</Link></li>
                <li><Link href="/payments" style={{ color: '#059669', textDecoration: 'none', fontWeight: 700 }}>{language === 'ar' ? '💳 الفواتير والاشتراكات' : '💳 Invoices & Payments'}</Link></li>
              </>
            ) : (
              <>
                <li><Link href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>{language === 'ar' ? '🔑 تسجيل الدخول' : '🔑 Sign In'}</Link></li>
                <li><Link href="/login" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 700 }}>{language === 'ar' ? '📝 تقديم والتحاق طالب جديد' : '📝 Apply as Student'}</Link></li>
              </>
            )}
          </ul>
        </div>

        {/* Col 4: Google & Cloud Badge */}
        <div>
          <h4 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem' }}>
            {language === 'ar' ? 'الاعتماد والأمان السحابي' : 'Cloud & Security'}
          </h4>
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.85rem', margin: '0 0 0.75rem 0', color: '#334155', lineHeight: 1.5 }}>
              {language === 'ar' ? '⚡ منصة مشغلة بقواعد بيانات PostgreSQL السحابية ومحمية بـ Vercel Enterprise' : '⚡ Powered by PostgreSQL & Vercel Enterprise Cloud'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 800 }}>
                100% Operational & Secure
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div style={{ maxWidth: '1200px', margin: '1.5rem auto 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem' }}>
        <div style={{ color: '#64748b' }}>
          © 2026 LearnNov Academic Cloud Platform. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {isLoggedIn ? (
            <>
              <Link href="/profile" style={{ color: '#64748b', textDecoration: 'none' }}>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</Link>
              <Link href="/chat" style={{ color: '#64748b', textDecoration: 'none' }}>{language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}</Link>
            </>
          ) : (
            <>
              <Link href="/specializations" style={{ color: '#64748b', textDecoration: 'none' }}>{language === 'ar' ? 'التخصصات' : 'Specializations'}</Link>
              <Link href="/certificates" style={{ color: '#64748b', textDecoration: 'none' }}>{language === 'ar' ? 'الشهادات' : 'Certificates'}</Link>
            </>
          )}
          <Link href="/support" style={{ color: '#64748b', textDecoration: 'none' }}>{language === 'ar' ? 'الدعم الفني' : 'Support'}</Link>
        </div>
      </div>

      {/* Floating AI Academic Assistant Widget Button - ONLY visible when authenticated */}
      {isLoggedIn && (
        <Link 
          href="/chat" 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: isRtl ? 'auto' : '24px',
            left: isRtl ? '24px' : 'auto',
            background: 'linear-gradient(135deg, #2563eb 0%, #10b981 100%)',
            color: '#FFF',
            padding: '0.85rem 1.35rem',
            borderRadius: '99px',
            boxShadow: '0 10px 30px rgba(37, 99, 235, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            zIndex: 1000,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🤖</span>
          <span>{language === 'ar' ? 'المساعد الأكاديمي الذكي' : 'AI Academic Tutor'}</span>
        </Link>
      )}

    </footer>
  );
};
