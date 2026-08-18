'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface NotificationItem {
  id: number;
  title: string;
  titleEn: string;
  date: string;
  read: boolean;
  icon: string;
  category: 'academic' | 'system' | 'certificate';
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const { language, isRtl } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'unread' | 'academic' | 'certificate'>('all');

  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data);
      })
      .catch(() => {});
  }, [isLoggedIn]);

  if (isLoading || !isLoggedIn) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const markAllRead = () => {
    setItems(items.map(item => ({ ...item, read: true })));
  };

  const toggleRead = (id: number) => {
    setItems(items.map(item => item.id === id ? { ...item, read: !item.read } : item));
  };

  const filteredItems = items.filter(item => {
    if (filter === 'unread') return !item.read;
    if (filter === 'academic') return item.category === 'academic';
    if (filter === 'certificate') return item.category === 'certificate';
    return true;
  });

  return (
    <main className="dashboard-container" dir={isRtl ? 'rtl' : 'ltr'} style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="section-title text-gradient" style={{ margin: 0 }}>
            {language === 'ar' ? '🔔 مركز الإشعارات والتنبيهات الحية' : '🔔 Notification Center'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '0.3rem 0 0 0' }}>
            {language === 'ar' ? 'متابعة تنبيهات القبول، الشهادات الصادرة، ومواعيد البث المباشر' : 'Track enrollment approvals, issued certificates, and live lecture alerts'}
          </p>
        </div>

        <button
          onClick={markAllRead}
          style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.3)', padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
        >
          {language === 'ar' ? '✓ تحديد الكل كـ مقروء' : '✓ Mark All as Read'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none', background: filter === 'all' ? '#6366F1' : 'rgba(255,255,255,0.05)', color: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
          {language === 'ar' ? 'الكل' : 'All'} ({items.length})
        </button>
        <button onClick={() => setFilter('unread')} style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none', background: filter === 'unread' ? '#6366F1' : 'rgba(255,255,255,0.05)', color: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
          {language === 'ar' ? 'غير مقروء' : 'Unread'} ({items.filter(i => !i.read).length})
        </button>
        <button onClick={() => setFilter('academic')} style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none', background: filter === 'academic' ? '#6366F1' : 'rgba(255,255,255,0.05)', color: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
          {language === 'ar' ? 'أكاديمي' : 'Academic'}
        </button>
        <button onClick={() => setFilter('certificate')} style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none', background: filter === 'certificate' ? '#6366F1' : 'rgba(255,255,255,0.05)', color: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
          {language === 'ar' ? 'الشهادات' : 'Certificates'}
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredItems.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
            {language === 'ar' ? 'لا توجد إشعارات حالية في هذه الفئة.' : 'No notifications in this category.'}
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => toggleRead(item.id)}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                cursor: 'pointer',
                borderLeft: item.read ? '1px solid rgba(255,255,255,0.08)' : '4px solid #6366F1',
                backgroundColor: item.read ? 'rgba(17,24,39,0.7)' : 'rgba(99,102,241,0.08)',
                borderRadius: '12px'
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: item.read ? 600 : 800, margin: 0, color: '#FFF' }}>
                  {language === 'ar' ? item.title : item.titleEn}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '0.3rem 0 0 0' }}>{item.date}</p>
              </div>
              {!item.read && (
                <span style={{ backgroundColor: '#6366F1', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '99px' }}>
                  {language === 'ar' ? 'جديد' : 'New'}
                </span>
              )}
            </div>
          ))
        )}
      </div>

    </main>
  );
}
