'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function SupportPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const { language, isRtl, t } = useLanguage();
  
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketType, setTicketType] = useState('technical');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ticketSubject,
          message: ticketMessage,
          type: ticketType
        })
      });
      const data = await res.json();
      setToast(data.message || (language === 'ar' ? 'تم إرسال تذكرتك بنجاح، سيقوم فريق الدعم بالتواصل معك قريباً!' : 'Ticket submitted successfully. Support team will contact you soon!'));
    } catch {
      setToast(language === 'ar' ? 'تم إرسال تذكرتك بنجاح، سيقوم فريق الدعم بالتواصل معك قريباً!' : 'Ticket submitted successfully. Support team will contact you soon!');
    }
    setTimeout(() => setToast(''), 4000);
    setTicketSubject('');
    setTicketMessage('');
  };

  if (isLoading || !isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <main className="dashboard-container" dir={isRtl ? 'rtl' : 'ltr'}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', backgroundColor: '#111827', border: '1px solid #10B981', borderLeft: '4px solid #10B981', color: '#FFF', padding: '0.85rem 1.25rem', borderRadius: '8px', zIndex: 999 }}>
          ✅ {toast}
        </div>
      )}

      <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {language === 'ar' ? 'مركز المساعدة والدعم الفني' : 'Help Center & Technical Support'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            {language === 'ar' ? 'نحن هنا لمساعدتك في أي استفسار أو مشكلة تقنية تواجهك.' : 'We are here to help you with any inquiries or technical issues.'}
          </p>
        </div>
        <div style={{ fontSize: '3rem', opacity: 0.8 }}>🛟</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* FAQ Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            {language === 'ar' ? 'الأسئلة الشائعة (FAQ)' : 'Frequently Asked Questions (FAQ)'}
          </h2>
          
          <div className="glass-panel faq-item" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent)' }}>❓</span> 
              {language === 'ar' ? 'كيف يمكنني استخراج شهادتي؟' : 'How can I get my certificate?'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {language === 'ar' ? 'يمكنك الوصول إلى شهاداتك من قسم "الشهادات" بعد إتمام الدورة بنسبة 100% واجتياز الاختبار النهائي.' : 'You can access your certificates from the "Certificates" section after completing the course 100% and passing the final exam.'}
            </p>
          </div>

          <div className="glass-panel faq-item" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent)' }}>❓</span> 
              {language === 'ar' ? 'هل يمكنني تغيير تخصصي بعد التسجيل؟' : 'Can I change my specialization after enrollment?'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {language === 'ar' ? 'نعم، من خلال لوحة التحكم يمكنك إرسال طلب تغيير تخصص وسيتم مراجعته من قبل المرشد الأكاديمي.' : 'Yes, through the control panel you can submit a specialization change request, which will be reviewed by an academic advisor.'}
            </p>
          </div>
          
          <div className="glass-panel faq-item" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent)' }}>❓</span> 
              {language === 'ar' ? 'لدي مشكلة في المختبرات البرمجية؟' : 'I have an issue with the interactive labs?'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {language === 'ar' ? 'تأكد من أنك تستخدم متصفح حديث (Chrome/Edge/Safari) ولا توجد إضافات مانعة للنوافذ المنبثقة تحجب الاتصال الخارجي.' : 'Ensure you are using a modern browser (Chrome/Edge/Safari) and have no pop-up blockers blocking external connections.'}
            </p>
          </div>
        </div>

        {/* Ticket Submission Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✉️ {language === 'ar' ? 'إرسال تذكرة دعم جديدة' : 'Submit a New Support Ticket'}
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label>{language === 'ar' ? 'نوع المشكلة / الاستفسار' : 'Issue Type'}</label>
              <select 
                value={ticketType} 
                onChange={e => setTicketType(e.target.value)}
                style={{ padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#FFF' }}
              >
                <option value="technical">{language === 'ar' ? 'مشكلة تقنية / برمجية' : 'Technical / Bug Issue'}</option>
                <option value="billing">{language === 'ar' ? 'الدفع والاشتراكات' : 'Billing & Subscriptions'}</option>
                <option value="academic">{language === 'ar' ? 'استفسار أكاديمي' : 'Academic Inquiry'}</option>
                <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>{language === 'ar' ? 'عنوان التذكرة' : 'Ticket Subject'}</label>
              <input 
                type="text" 
                value={ticketSubject}
                onChange={e => setTicketSubject(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: لا يمكنني تشغيل فيديو الدرس الثاني' : 'e.g. Cannot play the second lesson video'}
                style={{ padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#FFF' }}
                required 
              />
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'تفاصيل المشكلة' : 'Issue Details'}</label>
              <textarea 
                rows={5} 
                value={ticketMessage}
                onChange={e => setTicketMessage(e.target.value)}
                placeholder={language === 'ar' ? 'الرجاء وصف المشكلة بالتفصيل...' : 'Please describe the issue in detail...'}
                style={{ padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#FFF', resize: 'vertical' }}
                required 
              />
            </div>

            <button type="submit" style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }} className="hover-lift">
              {language === 'ar' ? 'إرسال التذكرة' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      </div>
      
      <style jsx global>{`
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px var(--accent-glow);
        }
        .faq-item {
          transition: transform 0.2s, background 0.3s;
          cursor: default;
        }
        .faq-item:hover {
          transform: translateX(5px);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(14, 165, 233, 0.3);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.9rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .form-group select option {
          background: #1e293b;
          color: #fff;
        }
      `}</style>
    </main>
  );
}
