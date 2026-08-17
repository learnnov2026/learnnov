'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { User, Mail, Shield, Key, CheckCircle, Save } from 'lucide-react';

export default function ProfilePage() {
  const { userName, userRole, isLoggedIn, userEmail } = useAuth();
  const { language, isRtl } = useLanguage();

  const [name, setName] = useState(userName || 'طالب ليرنوف المتميز');
  const [email, setEmail] = useState(userEmail || 'student.demo@learnnov.com');
  const [bio, setBio] = useState('طالب شغوف بهندسة الذكاء الاصطناعي وتطوير تطبيقات الويب المتقدمة.');
  const [mfa, setMfa] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userEmail) setEmail(userEmail);
    if (userName) setName(userName);
  }, [userEmail, userName]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio })
      });
      if (!res.ok) throw new Error('فشل التحديث');
      
      setToastMsg(language === 'ar' ? 'تم حفظ وإعادة توثيق بيانات الملف الشخصي بنجاح!' : 'Profile updated successfully!');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (error) {
      setToastMsg('حدث خطأ أثناء حفظ الملف الشخصي');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="dashboard-container" dir={isRtl ? 'rtl' : 'ltr'} style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Cairo, sans-serif' }}>
      
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', backgroundColor: '#ffffff', border: '1px solid #10B981', borderLeft: '5px solid #10B981', color: '#0f172a', padding: '0.85rem 1.25rem', borderRadius: '12px', zIndex: 999, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #2563eb, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '1.8rem', fontWeight: 800 }}>
            {name ? name.charAt(0) : '👤'}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{name}</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.3rem 0 0 0' }}>
              {email} • {userRole === 'instructor' ? (language === 'ar' ? 'عضو هيئة تدريس محترف' : 'Professional Instructor') : (language === 'ar' ? 'طالب أكاديمي في هندسة الذكاء الاصطناعي' : 'Academic AI & Data Student')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ backgroundColor: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', padding: '0.4rem 0.85rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle size={14} /> بريد موثق
          </span>
          <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.4rem 0.85rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Shield size={14} /> حماية MFA نشطة
          </span>
        </div>
      </div>

      {/* Profile Form Card */}
      <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>
          {language === 'ar' ? 'إعدادات الحساب والبيانات الشخصية' : 'Account & Personal Profile Settings'}
        </h2>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                {language === 'ar' ? 'البريد الإلكتروني المعتمد' : 'Verified Email Address'}
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                {language === 'ar' ? 'نوع الحساب والصلاحية' : 'Account Role'}
              </label>
              <input 
                type="text" 
                value={userRole === 'instructor' ? 'محاضر / مدرب' : userRole === 'admin' ? 'مدير نظام' : 'طالب أكاديمي'} 
                readOnly 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.9rem', cursor: 'not-allowed' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                {language === 'ar' ? 'حالة التوثيق الرقمي' : 'JWT Auth Security'}
              </label>
              <input 
                type="text" 
                value={isLoggedIn ? 'جلسة نشطة وموثقة سحابياً' : 'جلسة محلية'} 
                readOnly 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#10b981', fontSize: '0.9rem', fontWeight: 700, cursor: 'not-allowed' }}
              />
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
              {language === 'ar' ? 'نبذة عن الطالب والأهداف الأكاديمية' : 'Academic Bio'}
            </label>
            <textarea 
              rows={3} 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.9rem', outline: 'none', lineHeight: 1.6 }} 
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
            <input 
              type="checkbox" 
              checked={mfa} 
              onChange={e => setMfa(e.target.checked)} 
              style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} 
            />
            <span>{language === 'ar' ? 'تفعيل المصادقة الثنائية (MFA) لتأمين الاختبارات والشهادات' : 'Enable Multi-Factor Authentication (MFA)'}</span>
          </label>

          <button 
            type="submit" 
            disabled={isSaving}
            style={{ 
              background: 'linear-gradient(135deg, #2563eb, #10b981)', 
              color: '#FFF', 
              border: 'none', 
              padding: '0.85rem 1.75rem', 
              borderRadius: '12px', 
              fontWeight: 800, 
              fontSize: '0.95rem', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem', 
              alignSelf: 'flex-start',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              fontFamily: 'Cairo, sans-serif'
            }}
          >
            <Save size={18} />
            <span>{isSaving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}</span>
          </button>
        </form>
      </div>

    </main>
  );
}
