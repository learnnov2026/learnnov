'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface AssignmentItem {
  id: number;
  title: string;
  courseTitle: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: string;
  feedback?: string;
  description: string;
}

export default function AssignmentsPage() {
  const router = useRouter();
  const { isLoggedIn, userName, userRole, isLoading } = useAuth();
  const { language, isRtl } = useLanguage();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  const [activeTab, setActiveTab] = useState<'current' | 'submitted'>('current');
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  
  // Submission Form State
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const initialAssignments: AssignmentItem[] = [
    {
      id: 1,
      title: 'مشروع التخرج: تطوير وكيل ذكاء اصطناعي متعدد المهام (Multi-Agent System)',
      courseTitle: 'احتراف هندسة الأوامر والذكاء الاصطناعي',
      dueDate: '2026-08-15',
      status: 'pending',
      description: 'بناء وكيل برمجي ذكي باستخدام نماذج LLM يدمج خوارزميات RAG مع واجهة مستخدم تفاعلية بـ Next.js.'
    },
    {
      id: 2,
      title: 'واجب تطبيق الأمن السيبراني ومصفوفة الصلاحيات RBAC',
      courseTitle: 'الأمن السيبراني وحماية البنية التحتية السحابية',
      dueDate: '2026-08-01',
      status: 'graded',
      grade: '98 / 100 (امتياز مرتفع)',
      feedback: 'عمل ممتاز جداً! تم تطبيق مصفوفة الصلاحيات وتأمين شروط RLS بنجاح تام.',
      description: 'تصميم وتنفيذ جدول الصلاحيات وقواعد Security Policies على قاعدة البيانات السحابية.'
    },
    {
      id: 3,
      title: 'مشروع بناء منصة سحابية كاملة بـ Next.js 16 و Supabase',
      courseTitle: 'بناء تطبيقات الويب الحديثة',
      dueDate: '2026-08-10',
      status: 'pending',
      description: 'إنشاء تطبيق ويب متكامل مع ربط قاعدة البيانات، المصادقة الرقمية، ورفع المشروع على Vercel.'
    }
  ];

  const [assignmentsList, setAssignmentsList] = useState<AssignmentItem[]>(initialAssignments);



  if (isLoading || !isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)', color: '#0f172a', fontFamily: 'Cairo, sans-serif' }}>
        جاري تحميل مركز الواجبات والمشاريع...
      </div>
    );
  }

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Update local state
      setAssignmentsList(prev => prev.map(item => {
        if (item.id === selectedAssignment.id) {
          return {
            ...item,
            status: 'submitted',
            feedback: 'تم استلام مشروعك بنجاح وقيد مراجعة المدرس وتقييم الزملاء.'
          };
        }
        return item;
      }));

      // For demonstration, audit log is skipped or could be sent via API
      console.log('Audit log: Assignment submitted', selectedAssignment.title);

      setIsSubmitting(false);
      setSuccessMsg(language === 'ar' ? 'تم تسليم المشروع بنجاح وإرساله للتقييم الأكاديمي!' : 'Project submitted successfully for evaluation!');
      setSelectedAssignment(null);
      setGithubUrl('');
      setDemoUrl('');
      setSubmissionNotes('');
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 800);
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
    <main className="dashboard-container" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Toast Notification */}
      {successMsg && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', backgroundColor: '#111827', border: '1px solid #10B981', borderLeft: '4px solid #10B981', color: '#FFF', padding: '0.85rem 1.25rem', borderRadius: '8px', zIndex: 999 }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel profile-header" style={{ borderLeft: '5px solid #10B981', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            📁 {language === 'ar' ? 'مركز التسليمات والمشاريع التطبيقية' : 'Projects & Practical Assignments Hub'}
          </h1>
          <p style={{ color: '#94A3B8', marginTop: '0.3rem' }}>
            {language === 'ar' ? 'رفع المشاريع العملية، متابعة تقييمات المدرسين، والتحقق من درجة التقييم بين الزملاء.' : 'Submit practical projects, track instructor grades, and conduct peer evaluations.'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.3rem', borderRadius: '12px' }}>
          <button 
            onClick={() => setActiveTab('current')} 
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'current' ? '#10B981' : 'transparent', color: '#FFF', fontWeight: 800, cursor: 'pointer' }}
          >
            📋 {language === 'ar' ? 'المشاريع المطلوبة' : 'Active Projects'}
          </button>
          <button 
            onClick={() => setActiveTab('submitted')} 
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'submitted' ? '#10B981' : 'transparent', color: '#FFF', fontWeight: 800, cursor: 'pointer' }}
          >
            ✅ {language === 'ar' ? 'المشاريع المسلمة والتقييمات' : 'Graded Submissions'}
          </button>
        </div>
      </div>

      {/* Grid of Assignments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {assignmentsList
          .filter(a => activeTab === 'current' ? a.status !== 'graded' : a.status === 'graded' || a.status === 'submitted')
          .map(item => (
            <div key={item.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(99,102,241,0.15)', color: '#818CF8', padding: '0.25rem 0.65rem', borderRadius: '99px', fontWeight: 700 }}>
                    {item.courseTitle}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '99px',
                    fontWeight: 700,
                    backgroundColor: item.status === 'graded' ? 'rgba(16,185,129,0.15)' : item.status === 'submitted' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    color: item.status === 'graded' ? '#10B981' : item.status === 'submitted' ? '#F59E0B' : '#EF4444'
                  }}>
                    {item.status === 'graded' ? '🟢 تم التقييم' : item.status === 'submitted' ? '⏳ قيد المراجعة' : '🔴 مطلوب التسليم'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.5', marginBottom: '1rem' }}>{item.description}</p>

                {item.grade && (
                  <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 800 }}>الدرجة المستحقة: {item.grade}</div>
                    <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '0.2rem' }}>ملاحظات المحاضر: {item.feedback}</div>
                  </div>
                )}
              </div>

              {item.status !== 'graded' && (
                <button 
                  onClick={() => setSelectedAssignment(item)} 
                  style={{ width: '100%', background: 'linear-gradient(135deg, #6366F1, #06B6D4)', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', marginTop: '1rem' }}
                >
                  🚀 {language === 'ar' ? 'تسليم الحل والرابط البرمجي' : 'Submit Code Solution'}
                </button>
              )}
            </div>
          ))}
      </div>

      {/* Submission Modal */}
      {selectedAssignment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '540px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#FFF' }}>
              📤 تسليم مشروع: {selectedAssignment.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '1.25rem' }}>أدخل رابط المستودع على GitHub أو العرض المباشر على Vercel/Netlify لتسليم مشروعك.</p>

            <form onSubmit={handleSubmitAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '0.3rem' }}>رابط مستودع GitHub (Repository URL):</label>
                <input 
                  type="url" 
                  placeholder="https://github.com/username/project" 
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  style={{ width: '100%', background: '#1F2937', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '0.3rem' }}>رابط العرض المباشر Live Demo (اختياري):</label>
                <input 
                  type="url" 
                  placeholder="https://my-app.vercel.app" 
                  value={demoUrl}
                  onChange={e => setDemoUrl(e.target.value)}
                  style={{ width: '100%', background: '#1F2937', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '0.3rem' }}>ملخص طريقة التنفيذ والمعمارية المستخدمة:</label>
                <textarea 
                  rows={3} 
                  placeholder="شرح مختصر لكيفية بناء الكود وإعداد قاعدة البيانات..." 
                  value={submissionNotes}
                  onChange={e => setSubmissionNotes(e.target.value)}
                  style={{ width: '100%', background: '#1F2937', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setSelectedAssignment(null)} style={{ background: 'transparent', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>إلغاء</button>
                <button type="submit" disabled={isSubmitting} style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  {isSubmitting ? 'جاري الإرسال...' : 'تأكيد إرسال المشروع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
