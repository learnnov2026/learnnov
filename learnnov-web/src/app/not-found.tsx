'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: 'Cairo, sans-serif',
      direction: 'rtl',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '3rem 4rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        border: '1px solid rgba(37,99,235,0.08)',
        maxWidth: '480px',
        width: '100%'
      }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔍</div>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, color: '#2563eb', margin: '0 0 0.5rem 0', lineHeight: 1 }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
          الصفحة غير موجودة
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها أو حذفها.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            background: '#2563eb',
            color: '#fff',
            padding: '0.75rem 2rem',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            display: 'inline-block'
          }}>
            🏠 الصفحة الرئيسية
          </Link>
          <Link href="/login" style={{
            background: 'transparent',
            color: '#2563eb',
            padding: '0.75rem 2rem',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: '1px solid #2563eb',
            display: 'inline-block'
          }}>
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
