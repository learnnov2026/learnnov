'use client';
import { useEffect, useState } from 'react';

interface StudentData {
  active_applications: number;
  total_applications: number;
  referral_code: string;
  referral_points: number;
  exams_passed: number;
  certificates_earned: number;
  discussions_started: number;
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate slight network delay for dramatic UI spinner entrance
    setTimeout(() => {
      fetch('http://localhost:8000/api/programs/student-summary/')
        .then(res => res.json())
        .then((json) => {
          setData(json);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return <div style={{textAlign: 'center', marginTop: '100px'}}>فشل تحميل البيانات</div>;
  }

  return (
    <main className="dashboard-container" dir="rtl">
      <div className="glass-panel profile-header">
        <div className="profile-avatar">أ</div>
        <div className="profile-info">
          <h1>مرحباً بك، <span className="text-gradient">طالب ليرنوف المتميز</span></h1>
          <p>لوحة التحكم الأكاديمية الخاصة بك</p>
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem', fontWeight: 600 }}>إحصائياتك الأكاديمية</h2>
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-value">{data.certificates_earned}</div>
          <div className="stat-label">الشهادات المكتسبة</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{data.exams_passed}</div>
          <div className="stat-label">الاختبارات المجتازة</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{data.active_applications}</div>
          <div className="stat-label">البرامج النشطة</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-value">{data.discussions_started}</div>
          <div className="stat-label">النقاشات المطروحة</div>
        </div>
        
        <div className="glass-panel stat-card">
          <div className="stat-icon">🌟</div>
          <div className="stat-value">{data.referral_points}</div>
          <div className="stat-label">نقاط المكافآت (رمز: {data.referral_code})</div>
        </div>
      </div>
    </main>
  );
}
