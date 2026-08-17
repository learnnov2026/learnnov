'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function CareerGuidancePage() {
  const { language, isRtl } = useLanguage();
  const [selectedTrack, setSelectedTrack] = useState<'ai' | 'cyber' | 'web'>('ai');
  const [studentSkills, setStudentSkills] = useState<string[]>(['Python', 'Prompt Engineering', 'Next.js']);
  const [newSkill, setNewSkill] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    // Fetch real user certificates and populate skills automatically
    fetch('/api/certificates/my')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.certificates)) {
          const autoSkills = new Set(studentSkills);
          data.certificates.forEach((c: any) => {
            const title = (c.courseTitle || '').toLowerCase();
            if (title.includes('ذكاء') || title.includes('ai') || title.includes('أوامر')) {
              autoSkills.add('Python');
              autoSkills.add('Prompt Engineering');
              autoSkills.add('LangChain');
            }
            if (title.includes('أمن') || title.includes('cyber') || title.includes('اختراق')) {
              autoSkills.add('Network Security');
              autoSkills.add('OWASP Top 10');
            }
            if (title.includes('next') || title.includes('web') || title.includes('ويب')) {
              autoSkills.add('Next.js');
              autoSkills.add('React');
              autoSkills.add('TypeScript');
            }
          });
          setStudentSkills(Array.from(autoSkills));
        }
      })
      .catch(() => {});
  }, []);

  const tracks = {
    ai: {
      title: language === 'ar' ? 'مهندس ذكاء اصطناعي وتطبيقات توليدية (AI Engineer)' : 'Generative AI & LLM Engineer',
      salary: language === 'ar' ? '18,000 - 32,000 ر.س / شهرياً' : '18,000 - 32,000 SAR / Month',
      demand: 'مرتفع جداً 🔥',
      description: language === 'ar' ? 'تصميم وتطوير النماذج التوليدية، تقنيات RAG، وربط الوكلاء الذكيين بالمنظومات المؤسسية.' : 'Build generative models, RAG pipelines, and agentic workflows for enterprise solutions.',
      keySkills: ['Python', 'PyTorch', 'Prompt Engineering', 'LangChain', 'Vector DBs', 'RAG Architecture'],
      recommendedCourses: ['احتراف هندسة الأوامر والذكاء الاصطناعي', 'بناء وكلاء الذكاء الاصطناعي المستقلين']
    },
    cyber: {
      title: language === 'ar' ? 'مهندس أمن سيبراني واختبار اختراق (Cybersecurity Specialist)' : 'Cybersecurity & Ethical Hacker',
      salary: language === 'ar' ? '16,000 - 28,000 ر.س / شهرياً' : '16,000 - 28,000 SAR / Month',
      demand: 'طلب عالي جداً 🛡️',
      description: language === 'ar' ? 'حماية البنى التحتية، فحص الثغرات الأمنية، واختبار اختراق الشبكات والأنظمة السحابية.' : 'Protect enterprise infrastructure, execute penetration tests, and secure cloud environments.',
      keySkills: ['Network Security', 'Penetration Testing', 'OWASP Top 10', 'Wireshark', 'Metasploit', 'SOC Monitoring'],
      recommendedCourses: ['أساسيات الأمن السيبراني واختبار الاختراق الأخلاقي', 'أمان الشبكات والبروتوكولات']
    },
    web: {
      title: language === 'ar' ? 'مطور تطبيقات ويب متقدمة (Fullstack Next.js Engineer)' : 'Fullstack Web Engineer',
      salary: language === 'ar' ? '15,000 - 25,000 ر.س / شهرياً' : '15,000 - 25,000 SAR / Month',
      demand: 'نمو مستمر 🚀',
      description: language === 'ar' ? 'بناء واجهات برمجية فائقة السرعة مع React 19 و Next.js ورابط قواعد البيانات السحابية.' : 'Develop high-performance web applications using React 19, Next.js, and cloud backend databases.',
      keySkills: ['TypeScript', 'React', 'Next.js', 'TailwindCSS', 'Node.js', 'PostgreSQL'],
      recommendedCourses: ['بناء تطبيقات الويب الفائقة السرعة بـ Next.js', 'تصميم قواعد البيانات SQL']
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !studentSkills.includes(newSkill.trim())) {
      setStudentSkills([...studentSkills, newSkill.trim()]);
      setNewSkill('');
      setToastMsg(language === 'ar' ? 'تم إضافة المهارة بنجاح إلى ملفك المهني!' : 'Skill added to career profile!');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const currentTrack = tracks[selectedTrack];

  // Mathematical & Logical Matching Calculation
  const matchedSkills = currentTrack.keySkills.filter(s =>
    studentSkills.some(st => st.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(st.toLowerCase()))
  );
  const matchPercentage = currentTrack.keySkills.length > 0
    ? Math.round((matchedSkills.length / currentTrack.keySkills.length) * 100)
    : 0;

  return (
    <main className="dashboard-container" dir={isRtl ? 'rtl' : 'ltr'} style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Cairo, sans-serif' }}>
      
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', backgroundColor: '#ffffff', border: '1px solid #10B981', borderLeft: '5px solid #10B981', color: '#0f172a', padding: '0.85rem 1.25rem', borderRadius: '12px', zIndex: 9999, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          ✅ {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #2563eb, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '2rem', flexShrink: 0 }}>
          💼
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            {language === 'ar' ? 'مرشد ليرنوف المهني والتوجيه الأكاديمي' : 'LearnNov AI Career Pathfinder'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.4rem 0 0 0' }}>
            {language === 'ar' 
              ? 'تحليل المهارات المكتسبة من شهاداتك ومطابقتها حسابياً مع متطلبات سوق العمل التقني' 
              : 'Match your earned skills with job market demands and technical career paths'}
          </p>
        </div>
      </div>

      {/* Track Switcher */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedTrack('ai')}
          style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: selectedTrack === 'ai' ? '2px solid #2563eb' : '1px solid #e2e8f0', background: selectedTrack === 'ai' ? 'rgba(37,99,235,0.08)' : '#ffffff', color: '#0f172a', fontWeight: 800, cursor: 'pointer', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }}
        >
          🤖 {language === 'ar' ? 'مسار الذكاء الاصطناعي (AI)' : 'AI Engineering Track'}
        </button>
        <button
          onClick={() => setSelectedTrack('cyber')}
          style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: selectedTrack === 'cyber' ? '2px solid #10B981' : '1px solid #e2e8f0', background: selectedTrack === 'cyber' ? 'rgba(16,185,129,0.08)' : '#ffffff', color: '#0f172a', fontWeight: 800, cursor: 'pointer', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }}
        >
          🛡️ {language === 'ar' ? 'مسار الأمن السيبراني (Cyber)' : 'Cybersecurity Track'}
        </button>
        <button
          onClick={() => setSelectedTrack('web')}
          style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: selectedTrack === 'web' ? '2px solid #3B82F6' : '1px solid #e2e8f0', background: selectedTrack === 'web' ? 'rgba(59,130,246,0.08)' : '#ffffff', color: '#0f172a', fontWeight: 800, cursor: 'pointer', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }}
        >
          🌐 {language === 'ar' ? 'مسار هندسة البرمجيات (Web)' : 'Fullstack Web Track'}
        </button>
      </div>

      {/* Selected Track Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Main Career Analysis Panel */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{currentTrack.title}</h2>
            <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800, border: '1px solid #a7f3d0' }}>
              {currentTrack.demand}
            </span>
          </div>
          
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{currentTrack.description}</p>
          
          <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>متوسط الدخل التقديري في المملكة:</span>
            <strong style={{ color: '#10B981', fontSize: '1.1rem' }}>{currentTrack.salary}</strong>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>المهارات الأساسية المطلوبة في هذا المسار:</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {currentTrack.keySkills.map(skill => {
              const isMatched = studentSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase()));
              return (
                <span key={skill} style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, backgroundColor: isMatched ? '#ecfdf5' : '#f1f5f9', color: isMatched ? '#059669' : '#64748b', border: isMatched ? '1px solid #a7f3d0' : '1px solid #e2e8f0' }}>
                  {isMatched ? '✓' : '○'} {skill}
                </span>
              );
            })}
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>البرامج والدورات المقترحة لسد الفجوة المهارية:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentTrack.recommendedCourses.map(course => (
              <div key={course} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 700 }}>📖 {course}</span>
                <Link href="/specializations" style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>
                  استعراض الدورة ←
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Match Gauge & Skill Add */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Match Score Card */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>نسبة الجاهزية والتطابق المهني</span>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: matchPercentage >= 70 ? '#10B981' : matchPercentage >= 40 ? '#f59e0b' : '#3b82f6', margin: '0.5rem 0' }}>
              {matchPercentage}%
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.75rem' }}>
              <div style={{ width: `${matchPercentage}%`, height: '100%', backgroundColor: matchPercentage >= 70 ? '#10B981' : matchPercentage >= 40 ? '#f59e0b' : '#3b82f6', transition: 'width 0.5s ease' }}></div>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              مطابقة {matchedSkills.length} من أصل {currentTrack.keySkills.length} مهارات
            </span>
          </div>

          {/* Add Skills Widget */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>⚡ مهاراتك المكتسبة:</h3>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {studentSkills.map(sk => (
                <span key={sk} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {sk}
                </span>
              ))}
            </div>
            <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="أضف مهارة جديدة..."
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '0.85rem' }}
              />
              <button type="submit" style={{ backgroundColor: '#2563eb', color: '#FFF', border: 'none', padding: '0.55rem 0.9rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                +
              </button>
            </form>
          </div>

        </div>

      </div>

    </main>
  );
}
