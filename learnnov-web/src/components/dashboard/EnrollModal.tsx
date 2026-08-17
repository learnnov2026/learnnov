'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface AcademicProgram {
  id: number;
  title: string;
  title_en: string;
  slug: string;
  provider_name: string;
}

interface EnrollModalProps {
  enrollingProgram: AcademicProgram;
  onClose: () => void;
  onSubmit: (formData: {
    fullName: string;
    email: string;
    phone: string;
    highestQualification: string;
    graduationYear: number;
    gpa: string;
    experienceYears: number;
    personalStatement: string;
  }) => Promise<void>;
  isEnrolling: boolean;
  enrollSuccess: string | null;
  enrollError: string | null;
}

export const EnrollModal: React.FC<EnrollModalProps> = ({
  enrollingProgram,
  onClose,
  onSubmit,
  isEnrolling,
  enrollSuccess,
  enrollError,
}) => {
  const { language, t } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [highestQualification, setHighestQualification] = useState('high_school');
  const [graduationYear, setGraduationYear] = useState<number>(new Date().getFullYear());
  const [gpa, setGpa] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [personalStatement, setPersonalStatement] = useState('');

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      fullName,
      email,
      phone,
      highestQualification,
      graduationYear,
      gpa,
      experienceYears,
      personalStatement,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-panel modal-card" style={{ maxWidth: '600px', width: '100%', padding: '2.5rem' }}>
        <h2 className="text-gradient modal-header-text">
          {language === 'ar' ? 'استمارة الالتحاق ببرنامج' : 'Program Enrollment Form'}
        </h2>
        <h4 style={{ color: 'var(--text-color)', fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          {language === 'en' && enrollingProgram.title_en ? enrollingProgram.title_en : enrollingProgram.title}
        </h4>

        <form onSubmit={handleSubmitForm} className="enroll-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>{language === 'ar' ? 'الاسم الكامل (ثنائي على الأقل)' : 'Full Name (at least first & last)'}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder={language === 'ar' ? 'مثال: أحمد الدوسري' : 'e.g. Ahmed Al-Dossari'}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ahmed@example.com"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>{language === 'ar' ? 'رقم الهاتف الجوال' : 'Phone Number'}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="05xxxxxxx"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>{language === 'ar' ? 'أعلى مؤهل علمي حاصل عليه' : 'Highest Qualification'}</label>
              <select value={highestQualification} onChange={(e) => setHighestQualification(e.target.value)}>
                <option value="high_school">{language === 'ar' ? 'ثانوية عامة' : 'High School'}</option>
                <option value="diploma">{language === 'ar' ? 'دبلوم' : 'Diploma'}</option>
                <option value="bachelor">{language === 'ar' ? 'بكالوريوس' : 'Bachelor'}</option>
                <option value="master">{language === 'ar' ? 'ماجستير' : 'Master'}</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>{language === 'ar' ? 'سنة التخرج' : 'Graduation Year'}</label>
              <input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>{language === 'ar' ? 'المعدل التراكمي (GPA)' : 'GPA'}</label>
              <input
                type="text"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                required
                placeholder="e.g. 4.80 or 3.80"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>{language === 'ar' ? 'سنوات الخبرة المهنية' : 'Years of Experience'}</label>
              <input
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'الخطة الشخصية والدافع للالتحاق' : 'Personal Statement & Motivation'}</label>
            <textarea
              value={personalStatement}
              onChange={(e) => setPersonalStatement(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'اكتب أسباب التحاقك بالبرنامج وأهدافك المهنية المستقبلية...'
                  : 'Describe your motivation for applying and future career goals...'
              }
              rows={3}
              required
            />
          </div>

          {enrollSuccess && <div className="success-msg-box">{enrollSuccess}</div>}
          {enrollError && <div className="error-msg-box">{enrollError}</div>}

          <div className="form-actions-row">
            <button type="submit" disabled={isEnrolling} className="confirm-btn">
              {isEnrolling
                ? language === 'ar'
                  ? 'جاري توثيق طلب الالتحاق...'
                  : 'Submitting enrollment...'
                : language === 'ar'
                ? '💾 تأكيد وتفعيل الدراسة الفورية'
                : '💾 Confirm & Unlock Study'}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
