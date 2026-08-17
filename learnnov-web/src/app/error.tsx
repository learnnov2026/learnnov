'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (in production you'd send to a monitoring service like Sentry)
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
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
        border: '1px solid rgba(239,68,68,0.1)',
        maxWidth: '480px',
        width: '100%'
      }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#dc2626', margin: '0 0 0.5rem 0' }}>
          خطأ في النظام
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => reset()} style={{
            background: '#dc2626',
            color: '#fff',
            padding: '0.75rem 2rem',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif'
          }}>
            🔄 إعادة المحاولة
          </button>
          <Link href="/" style={{
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
            🏠 الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
