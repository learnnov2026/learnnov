'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [username, setUsername] = useState('student_demo');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://learnnov-api.onrender.com';
      const res = await fetch(`${apiUrl}/api/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        throw new Error(t('loginError'));
      }

      const data = await res.json();
      login(
        data.access,
        data.refresh,
        role,
        role === 'student' 
          ? (language === 'ar' ? 'طالب ليرنوف المتميز' : 'Distinguished LearnNov Student') 
          : 'د. علي البراك',
        role === 'student' ? 'أ' : 'د'
      );

      if (role === 'student') {
        router.push('/');
      } else {
        router.push('/instructor');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || t('serverError'));
    } finally {
      setLoading(false);
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

      <div className="glass-panel login-card">
        <div className="logo-section">
          <div className="logo-badge">🎓</div>
          <h1>{t('loginTitle')}</h1>
          <p>{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>{t('chooseRole')}</label>
            <div className="role-selector">
              <div 
                className={`role-option ${role === 'student' ? 'active' : ''}`}
                onClick={() => {
                  setRole('student');
                  setUsername('student_demo');
                }}
              >
                <div className="role-icon">👨‍🎓</div>
                <div className="role-label">{t('studentAccount')}</div>
              </div>
              <div 
                className={`role-option ${role === 'instructor' ? 'active' : ''}`}
                onClick={() => {
                  setRole('instructor');
                  setUsername('dr_ali');
                }}
              >
                <div className="role-icon">👨‍🏫</div>
                <div className="role-label">{t('instructorAccount')}</div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">{t('username')}</label>
            <input 
              type="text" 
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <div className="btn-spinner"></div> : t('secureLogin')}
          </button>
        </form>

        <div className="login-footer">
          <p>{t('loginFooter')}</p>
        </div>
      </div>

      <style jsx global>{`
        .login-container {
          min-height: 100vh;
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
