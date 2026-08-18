'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { User, Mail, Shield, Key, CheckCircle, Save, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { userName, userRole, isLoggedIn, userEmail, isLoading } = useAuth();
  const { language, isRtl } = useLanguage();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form State
  const [name, setName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [bio, setBio] = useState('');
  const [mfa, setMfa] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security & Credentials Form State
  const [customUsername, setCustomUsername] = useState(userName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

  // Notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (userEmail) setEmail(userEmail);
    if (userName) {
      setName(userName);
      setCustomUsername(userName);
    }
  }, [userEmail, userName]);

  // Strict Password Strength Rules Check
  const hasMinLength = newPassword.length >= 10;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword);
  const isNotOld = newPassword !== '' && currentPassword !== '' && newPassword !== currentPassword;
  const passwordsMatch = newPassword !== '' && newPassword === confirmPassword;

  const passedRulesCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
  const isPasswordFullyValid = passedRulesCount === 5 && passwordsMatch && isNotOld;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/users/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio })
      });
      if (!res.ok) throw new Error('فشل التحديث');
      
      showToast(language === 'ar' ? 'تم حفظ بيانات الملف الشخصي بنجاح!' : 'Profile updated successfully!', 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء حفظ الملف الشخصي', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && !isPasswordFullyValid) {
      showToast('يرجى استيفاء كافة شروط كلمة المرور الصارمة وتأكيدها بدقة', 'error');
      return;
    }

    setIsUpdatingSecurity(true);
    try {
      const res = await fetch('/api/users/me/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: customUsername,
          currentPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تحديث بيانات الأمان');
      }

      showToast(data.message || 'تم تحديث واعتماد بيانات الحساب وكلمة المرور بنجاح!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (customUsername) {
        setName(customUsername);
      }
    } catch (error: any) {
      showToast(error.message || 'حدث خطأ أثناء تحديث بيانات الأمان', 'error');
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  if (isLoading || !isLoggedIn) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <main className="dashboard-container" dir={isRtl ? 'rtl' : 'ltr'} style={{ padding: '2rem', maxWidth: '1050px', margin: '0 auto', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          left: '20px', 
          backgroundColor: '#ffffff', 
          border: `1px solid ${toastMsg.type === 'success' ? '#10B981' : '#EF4444'}`, 
          borderLeft: `5px solid ${toastMsg.type === 'success' ? '#10B981' : '#EF4444'}`, 
          color: '#0f172a', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '12px', 
          zIndex: 9999, 
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          fontWeight: 700 
        }}>
          {toastMsg.type === 'success' ? <CheckCircle size={18} color="#10B981" /> : <AlertCircle size={18} color="#EF4444" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: userRole === 'admin' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : userRole === 'instructor' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '1.8rem', fontWeight: 800 }}>
            {userRole === 'admin' ? '👑' : userRole === 'instructor' ? '👨‍🏫' : '👨‍🎓'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{name}</h1>
              <span style={{ backgroundColor: userRole === 'admin' ? '#fef3c7' : userRole === 'instructor' ? '#eff6ff' : '#ecfdf5', color: userRole === 'admin' ? '#b45309' : userRole === 'instructor' ? '#1d4ed8' : '#047857', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                {userRole === 'admin' ? 'مدير نظام' : userRole === 'instructor' ? 'مشرف / محاضر' : 'طالب'}
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0.3rem 0 0 0' }}>
              {email} • {userRole === 'admin' ? 'تحكم كامل بمنظومة ليرنوف' : userRole === 'instructor' ? 'إشراف وتدريب أكاديمي' : 'طالب أكاديمي'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {userRole === 'admin' && (
            <Link href="/admin" style={{ backgroundColor: '#2563eb', color: '#FFF', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>لوحة التحكم الإدارية</span>
              <ArrowLeft size={16} />
            </Link>
          )}
          {userRole === 'instructor' && (
            <Link href="/instructor" style={{ backgroundColor: '#2563eb', color: '#FFF', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>لوحة المشرف والمحاضر</span>
              <ArrowLeft size={16} />
            </Link>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{ 
            background: activeTab === 'profile' ? '#2563eb' : 'transparent', 
            color: activeTab === 'profile' ? '#FFF' : '#64748b', 
            border: 'none', 
            padding: '0.6rem 1.2rem', 
            borderRadius: '10px', 
            fontWeight: 700, 
            fontSize: '0.9rem', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontFamily: 'Cairo, sans-serif'
          }}
        >
          <User size={16} />
          <span>الملف الشخصي والبيانات العامة</span>
        </button>

        <button 
          onClick={() => setActiveTab('security')}
          style={{ 
            background: activeTab === 'security' ? '#2563eb' : 'transparent', 
            color: activeTab === 'security' ? '#FFF' : '#64748b', 
            border: 'none', 
            padding: '0.6rem 1.2rem', 
            borderRadius: '10px', 
            fontWeight: 700, 
            fontSize: '0.9rem', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontFamily: 'Cairo, sans-serif'
          }}
        >
          <Key size={16} />
          <span>🔐 الأمان وتغيير اسم المستخدم وكلمة المرور</span>
        </button>
      </div>

      {/* TAB 1: PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
            {language === 'ar' ? 'البيانات الشخصية والأكاديمية' : 'Personal Profile Information'}
          </h2>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  {language === 'ar' ? 'الاسم الظاهر' : 'Display Name'}
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  {language === 'ar' ? 'البريد الإلكتروني المعتمد' : 'Verified Email Address'}
                </label>
                <input 
                  type="email" 
                  value={email} 
                  readOnly
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.9rem', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                {language === 'ar' ? 'النبذة التعريفية' : 'Bio'}
              </label>
              <textarea 
                rows={3} 
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.9rem', lineHeight: 1.6 }} 
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                checked={mfa} 
                onChange={e => setMfa(e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} 
              />
              <span>تفعيل المصادقة الثنائية (MFA) وتأمين الجلسات الحية</span>
            </label>

            <button 
              type="submit" 
              disabled={isSavingProfile}
              style={{ 
                background: 'linear-gradient(135deg, #2563eb, #10b981)', 
                color: '#FFF', 
                border: 'none', 
                padding: '0.75rem 1.5rem', 
                borderRadius: '12px', 
                fontWeight: 800, 
                fontSize: '0.9rem', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                alignSelf: 'flex-start',
                fontFamily: 'Cairo, sans-serif'
              }}
            >
              <Save size={16} />
              <span>{isSavingProfile ? 'جاري الحفظ...' : 'حفظ البيانات'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: SECURITY & CREDENTIALS TAB */}
      {activeTab === 'security' && (
        <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Shield size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                تغيير اسم المستخدم وكلمة المرور (وفق الشروط الأمنية الصارمة)
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
                متاح للمديرين والمشرفين وكافة الحسابات لتحديث بيانات الدخول المعتمدة
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateSecurity} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Section 1: Change Username */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                👤 اسم المستخدم / الاسم المعتمد للدخول
              </label>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem' }}>
                شروط الاسم: لا يقل عن 3 أحرف، فريد في النظام، ويمكن استخدامه لتسجيل الدخول مباشرة بدلاً من البريد.
              </p>
              <input 
                type="text" 
                value={customUsername} 
                onChange={e => setCustomUsername(e.target.value)} 
                required 
                placeholder="مثال: learnnov albra"
                style={{ width: '100%', maxWidth: '450px', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem', fontFamily: 'inherit' }}
              />
            </div>

            {/* Section 2: Strict Password Change */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={16} color="#2563eb" />
                تغيير كلمة المرور
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>
                اترك الحقول فارغة إذا كنت ترغب فقط في تغيير اسم المستخدم دون تغيير كلمة المرور.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                
                {/* Current Password */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    كلمة المرور الحالية (للتحقق من هويتك)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showCurrentPass ? 'text' : 'password'} 
                      value={currentPassword} 
                      onChange={e => setCurrentPassword(e.target.value)} 
                      placeholder="••••••••••••"
                      style={{ width: '100%', padding: '0.7rem 2.5rem 0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem', fontFamily: 'inherit' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    كلمة المرور الجديدة الصارمة
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showNewPass ? 'text' : 'password'} 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      placeholder="كلمة مرور قوية جديدة"
                      style={{ width: '100%', padding: '0.7rem 2.5rem 0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem', fontFamily: 'inherit' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showConfirmPass ? 'text' : 'password'} 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      placeholder="أعد كتابة كلمة المرور"
                      style={{ width: '100%', padding: '0.7rem 2.5rem 0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem', fontFamily: 'inherit' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Password Strength Meter & Checklist */}
              {newPassword && (
                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                  
                  {/* Strength Bar */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      <span style={{ color: '#475569' }}>مقياس قوة كلمة المرور:</span>
                      <span style={{ color: passedRulesCount === 5 ? '#10b981' : passedRulesCount >= 3 ? '#f59e0b' : '#ef4444' }}>
                        {passedRulesCount === 5 ? '💪 قوية جداً ومستوفية للشروط' : passedRulesCount >= 3 ? '⚠️ متوسطة (ينقصها بعض الشروط)' : '❌ ضعيفة وغير مقبولة'}
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(passedRulesCount / 5) * 100}%`, 
                        backgroundColor: passedRulesCount === 5 ? '#10b981' : passedRulesCount >= 3 ? '#f59e0b' : '#ef4444',
                        transition: 'width 0.3s ease, background-color 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Strict Checklist */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem', fontSize: '0.78rem' }}>
                    <div style={{ color: hasMinLength ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: hasMinLength ? 700 : 400 }}>
                      {hasMinLength ? '✅' : '⚪'} لا تقل عن 10 خانات
                    </div>
                    <div style={{ color: hasUppercase ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: hasUppercase ? 700 : 400 }}>
                      {hasUppercase ? '✅' : '⚪'} حرف كبير إنجليزي (A-Z)
                    </div>
                    <div style={{ color: hasLowercase ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: hasLowercase ? 700 : 400 }}>
                      {hasLowercase ? '✅' : '⚪'} حرف صغير إنجليزي (a-z)
                    </div>
                    <div style={{ color: hasNumber ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: hasNumber ? 700 : 400 }}>
                      {hasNumber ? '✅' : '⚪'} رقم واحد على الأقل (0-9)
                    </div>
                    <div style={{ color: hasSpecial ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: hasSpecial ? 700 : 400 }}>
                      {hasSpecial ? '✅' : '⚪'} رمز خاص (!@#$%...)
                    </div>
                    <div style={{ color: passwordsMatch ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: passwordsMatch ? 700 : 400 }}>
                      {passwordsMatch ? '✅' : '⚪'} تطابق كلمتي المرور
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isUpdatingSecurity || (newPassword !== '' && !isPasswordFullyValid)}
              style={{ 
                background: (newPassword === '' || isPasswordFullyValid) ? 'linear-gradient(135deg, #2563eb, #10b981)' : '#94a3b8', 
                color: '#FFF', 
                border: 'none', 
                padding: '0.85rem 1.75rem', 
                borderRadius: '12px', 
                fontWeight: 800, 
                fontSize: '0.95rem', 
                cursor: (newPassword === '' || isPasswordFullyValid) ? 'pointer' : 'not-allowed', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                alignSelf: 'flex-start',
                boxShadow: (newPassword === '' || isPasswordFullyValid) ? '0 4px 14px rgba(37, 99, 235, 0.25)' : 'none',
                fontFamily: 'Cairo, sans-serif'
              }}
            >
              <Save size={18} />
              <span>{isUpdatingSecurity ? 'جاري الفحص والاعتماد...' : 'اعتماد وحفظ بيانات الأمان'}</span>
            </button>

          </form>
        </div>
      )}

    </main>
  );
}

