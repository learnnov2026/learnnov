'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [username, setUsername] = useState('student_demo');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role === 'student') {
      setUsername('student_demo');
    } else {
      setUsername('dr_ali_albarrak');
    }
  }, [role]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      // Set session variables in localStorage for persistence
      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', role === 'student' ? 'طالب ليرنوف المتميز' : 'د. علي البراك');
      localStorage.setItem('userAvatar', role === 'student' ? 'أ' : 'د');
      localStorage.setItem('isLoggedIn', 'true');

      setLoading(false);
      if (role === 'student') {
        router.push('/');
      } else {
        router.push('/instructor');
      }
    }, 1000);
  };

  return (
    <main className="login-container" dir="rtl">
      <div className="glass-panel login-card">
        <div className="logo-section">
          <div className="logo-badge">🎓</div>
          <h1>منصة <span className="text-gradient">ليرنوف الأكاديمية</span></h1>
          <p>بوابة الدخول الموحدة للأنظمة السحابية</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>اختر نوع الحساب البرمجي</label>
            <div className="role-selector">
              <div 
                className={`role-option ${role === 'student' ? 'active' : ''}`}
                onClick={() => setRole('student')}
              >
                <div className="role-icon">👨‍🎓</div>
                <div className="role-label">حساب طالب</div>
              </div>
              <div 
                className={`role-option ${role === 'instructor' ? 'active' : ''}`}
                onClick={() => setRole('instructor')}
              >
                <div className="role-icon">👨‍🏫</div>
                <div className="role-label">حساب مشرف</div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">اسم المستخدم</label>
            <input 
              type="text" 
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
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
            {loading ? <div className="btn-spinner"></div> : 'تسجيل الدخول الآمن'}
          </button>
        </form>

        <div className="login-footer">
          <p>منصة ليرنوف - نظام سحابي متصل بالكامل بقاعدة البيانات السحابية الحية</p>
        </div>
      </div>

      <style jsx global>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #0b0f19;
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1), transparent 30%),
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.1), transparent 30%);
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
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin: 0 auto 1rem;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        .logo-section h1 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .logo-section p {
          color: #94a3b8;
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
          color: #e2e8f0;
        }
        .form-group input {
          padding: 0.9rem 1.25rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(0, 0, 0, 0.3);
          color: white;
          font-size: 1rem;
          outline: none;
          font-family: inherit;
          transition: all 0.3s;
        }
        .form-group input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.25);
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
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        .role-option:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .role-option.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: #3b82f6;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
        }
        .role-icon {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        .role-label {
          font-weight: 600;
          font-size: 0.95rem;
          color: #fff;
        }
        .submit-btn {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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
          box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
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
