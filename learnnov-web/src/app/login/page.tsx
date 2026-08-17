'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { language, setLanguage, t, isRtl } = useLanguage();
  
  // Auth mode: login vs register
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Common states
  const [role, setRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-fill demo credentials for login mode
  const handleQuickRoleSelect = (selectedRole: 'student' | 'instructor' | 'admin') => {
    setRole(selectedRole);
    if (selectedRole === 'student') {
      setEmail('student.demo@learnnov.com');
      setPassword('Password123!');
    } else if (selectedRole === 'instructor') {
      setEmail('dr.ali@learnnov.com');
      setPassword('Password123!');
    } else {
      setEmail('sara.admin@learnnov.com');
      setPassword('Password123!');
    }
  };

  const calculatePasswordStrength = (pass: string) => {
    if (pass.length === 0) return 0;
    let score = 0;
    if (pass.length >= 8) score += 30;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const handleSendOtp = async () => {
    if (!fullName.trim() || !email || !email.includes('@') || password.length < 6 || password !== confirmPassword) {
      setError(language === 'ar' ? 'يرجى تعبئة كافة الحقول بشكل صحيح أولاً' : 'Please fill all fields correctly first');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email, password, role })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء إرسال البريد');
      }

      setOtpSent(true);
      setSuccess(data.message + (data.previewUrl ? ` (Preview: ${data.previewUrl})` : ''));
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء العملية');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!otpSent) {
      setError(language === 'ar' ? 'يرجى طلب رمز التفعيل أولاً بالنقر على الزر' : 'Please request OTP first by clicking the button');
      setLoading(false);
      return;
    }

    if (!otpInput.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال رمز التحقق (OTP)' : 'Please enter verification code (OTP)');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpInput.trim() })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'رمز التحقق غير صحيح');
      }


      login(data.user.role, data.user.name, data.user.avatar, data.user.email);

      setSuccess(language === 'ar' ? 'تم التحقق من البريد وإنشاء الحساب بنجاح!' : 'Email verified and account created successfully!');
      setTimeout(() => {
        if (data.user.role === 'admin') router.push('/admin');
        else if (data.user.role === 'instructor') router.push('/instructor');
        else router.push('/');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء عملية التحقق');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginEmail = email || (role === 'student' ? 'student.demo@learnnov.com' : role === 'instructor' ? 'dr.ali@learnnov.com' : 'sara.admin@learnnov.com');
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: password || 'Password123!' })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }


      login(data.user.role, data.user.name, data.user.avatar, data.user.email);

      if (data.user.role === 'admin') {
        router.push('/admin');
      } else if (data.user.role === 'instructor') {
        router.push('/instructor');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSso = async () => {
    const ssoEmail = role === 'admin' ? 'admin.workspace@learnnov.com' : role === 'instructor' ? 'instructor.workspace@learnnov.com' : 'user.workspace@learnnov.com';
    const ssoName = 'حساب Google Workspace المؤسسي';
    
    // Call our new SSO endpoint which bypasses OTP
    const res = await fetch('/api/auth/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: ssoName, email: ssoEmail, role: role })
    });
    const data = await res.json();
    
    if (res.ok) {
      login(data.user.role, data.user.name, data.user.avatar, data.user.email);
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else if (data.user.role === 'instructor') {
        router.push('/instructor');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <main className="login-container" dir={isRtl ? "rtl" : "ltr"}>
      {/* Floating Language Switcher */}
      <div className="login-lang-switch">
        <button 
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} 
          className="lang-btn"
        >
          {t('langSwitchLabel')}
        </button>
      </div>

      <div className="glass-panel login-card" style={{ maxWidth: '520px' }}>
        <div className="logo-section" style={{ marginBottom: '1.5rem' }}>
          <img src="/logo.png" alt="logo" style={{ height: '80px', width: 'auto', marginBottom: '10px' }} />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{language === 'ar' ? 'منصة ليرنوف التعليمية الذكية' : 'LearnNov Smart Academic Platform'}</h1>
          <p>{language === 'ar' ? 'نظام التسجيل الاحترافي بالبريد الإلكتروني ودعم إدارة الصلاحيات' : 'Professional Email Authentication & RBAC Permission Engine'}</p>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.35rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            style={{
              padding: '0.65rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: mode === 'login' ? 'var(--accent)' : 'transparent',
              color: '#FFF',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🔑 {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            style={{
              padding: '0.65rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: mode === 'register' ? 'var(--accent-secondary)' : 'transparent',
              color: '#FFF',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            📝 {language === 'ar' ? 'إنشاء حساب بالبريد' : 'Register Email'}
          </button>
        </div>

        {/* Role Selector */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t('chooseRole')}</label>
          <div className="role-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div 
              className={`role-option ${role === 'student' ? 'active' : ''}`}
              onClick={() => handleQuickRoleSelect('student')}
              style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}
            >
              <div className="role-icon">👨‍🎓</div>
              <div className="role-label" style={{ fontSize: '0.8rem' }}>{t('studentAccount')}</div>
            </div>
            <div 
              className={`role-option ${role === 'instructor' ? 'active' : ''}`}
              onClick={() => handleQuickRoleSelect('instructor')}
              style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}
            >
              <div className="role-icon">👨‍🏫</div>
              <div className="role-label" style={{ fontSize: '0.8rem' }}>{t('instructorAccount')}</div>
            </div>
            <div 
              className={`role-option ${role === 'admin' ? 'active' : ''}`}
              onClick={() => handleQuickRoleSelect('admin')}
              style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}
            >
              <div className="role-icon">👑</div>
              <div className="role-label" style={{ fontSize: '0.8rem' }}>{language === 'ar' ? 'حساب مدير' : 'Admin'}</div>
            </div>
          </div>
        </div>

        {/* MODE 1: LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني الرسمي' : 'Official Email Address'}</label>
              <input 
                type="email" 
                id="email"
                placeholder="example@learnnov.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('password')}</label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message" style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.85rem' }}>⚠️ {error}</div>}

            <button type="submit" className="submit-btn" disabled={loading} style={{ background: 'linear-gradient(135deg, var(--accent), #06B6D4)', padding: '0.85rem', fontWeight: 800 }}>
              {loading ? <div className="btn-spinner"></div> : t('secureLogin')}
            </button>

            <button 
              type="button" 
              onClick={handleGoogleSso}
              style={{ 
                backgroundColor: '#FFFFFF', 
                color: '#3c4043', 
                border: '1px solid #dadce0', 
                padding: '0.75rem', 
                borderRadius: '12px', 
                fontWeight: 700, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                fontSize: '0.9rem'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              {language === 'ar' ? 'الدخول السريع بحساب Google Workspace' : 'Sign in with Google Workspace'}
            </button>
          </form>
        )}

        {/* MODE 2: EMAIL REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label htmlFor="reg-name">{language === 'ar' ? 'الاسم الكامل الثلاثي' : 'Full Name'}</label>
              <input 
                type="text" 
                id="reg-name"
                placeholder={language === 'ar' ? 'مثال: عبد العزيز بن خالد' : 'John Doe'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">{language === 'ar' ? 'البريد الإلكتروني' : 'Official Email Address'}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="email" 
                  id="reg-email"
                  placeholder="your.name@learnnov.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1 }}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{ background: '#3B82F6', color: '#FFF', border: 'none', padding: '0 0.85rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  📩 {language === 'ar' ? 'إرسال OTP' : 'Send OTP'}
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="form-group">
                <label style={{ color: '#10B981', fontSize: '0.8rem' }}>🔑 {language === 'ar' ? 'أدخل رمز التفعيل OTP المرسل لإيميلك' : 'Enter OTP Verification Code'}</label>
                <input 
                  type="text" 
                  placeholder="123456"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 800 }}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reg-password">{language === 'ar' ? 'كلمة المرور' : 'Password'}</label>
              <input 
                type="password" 
                id="reg-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Password strength meter */}
              {password.length > 0 && (
                <div style={{ marginTop: '0.3rem' }}>
                  <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${calculatePasswordStrength(password)}%`,
                      backgroundColor: calculatePasswordStrength(password) > 70 ? '#10B981' : calculatePasswordStrength(password) > 40 ? '#F59E0B' : '#EF4444',
                      transition: 'all 0.3s'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                    {language === 'ar' ? 'قوة كلمة المرور: ' : 'Strength: '}
                    {calculatePasswordStrength(password) > 70 ? 'قوية جداً 🛡️' : calculatePasswordStrength(password) > 40 ? 'متوسطة ⚠️' : 'ضعيفة ❌'}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm-password">{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
              <input 
                type="password" 
                id="reg-confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message" style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.85rem' }}>⚠️ {error}</div>}
            {success && <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.85rem' }}>✅ {success}</div>}

            <button type="submit" className="submit-btn" disabled={loading} style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', padding: '0.85rem', fontWeight: 800 }}>
              {loading ? <div className="btn-spinner"></div> : (language === 'ar' ? 'إنشاء وتوثيق الحساب بالبريد' : 'Register & Verify Email')}
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>{t('loginFooter')}</p>
        </div>
      </div>

      <style jsx global>{`
        .login-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--bg-color);
          position: relative;
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(14, 165, 233, 0.08), transparent 30%),
            radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.08), transparent 30%);
        }
        .login-lang-switch {
          position: absolute;
          top: 2rem;
          right: 2rem;
          z-index: 10;
        }
        .lang-btn {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.7);
          color: var(--text-color);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .lang-btn:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: var(--accent);
        }
        .login-card {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          padding: 3rem 2.5rem;
          animation: fadeInUp 0.8s ease-out;
        }
        .logo-section {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .logo-badge {
          width: 70px;
          height: 70px;
          border-radius: 20px;
          background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin: 0 auto 1rem;
          box-shadow: 0 0 20px var(--accent-glow);
        }
        .logo-section h1 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .logo-section p {
          color: #64748b;
          font-size: 0.95rem;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-weight: 500;
          font-size: 0.95rem;
          color: #475569;
        }
        .form-group input {
          padding: 0.9rem 1.25rem;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.85);
          color: var(--text-color);
          font-size: 1rem;
          outline: none;
          font-family: inherit;
          transition: all 0.3s;
        }
        .form-group input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 10px var(--accent-glow);
        }
        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 0.25rem;
        }
        .role-option {
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.4);
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        .role-option:hover {
          background: rgba(255, 255, 255, 0.8);
          border-color: var(--accent);
        }
        .role-option.active {
          background: rgba(14, 165, 233, 0.08);
          border-color: var(--accent);
          box-shadow: 0 0 10px var(--accent-glow);
        }
        .role-icon {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        .role-label {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-color);
        }
        .submit-btn {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
          color: white;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.3s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .submit-btn:hover {
          opacity: 0.95;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px var(--accent-glow);
        }
        .submit-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-left-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .login-footer {
          text-align: center;
          margin-top: 2rem;
          color: #64748b;
          font-size: 0.8rem;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
