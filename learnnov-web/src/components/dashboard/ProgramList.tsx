'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface AcademicProgram {
  id: number;
  title: string;
  title_en: string;
  slug: string;
  provider_name: string;
  provider_logo: string | null;
  field_name: string;
  degree_level: string;
  degree_level_display: string;
  study_mode: string;
  study_mode_display: string;
  language: string;
  duration_months: number;
  tuition_fee: string | number;
  currency: string;
  scholarship_available: boolean;
  is_open: boolean;
  description?: string;
}

interface ProgramListProps {
  filteredCourses: AcademicProgram[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedDegree: string;
  setSelectedDegree: (deg: string) => void;
  coursesLoading: boolean;
  coursesError: boolean;
  financialAids: any[];
  getEnrollmentRecord: (courseId: number) => any;
  getProviderName: (name: string) => string;
  getFieldName: (name: string) => string;
  openStudySyllabus: (course: AcademicProgram) => void;
  onEnrollClick: (course: AcademicProgram) => void;
}

export const ProgramList: React.FC<ProgramListProps> = ({
  filteredCourses,
  searchQuery,
  setSearchQuery,
  selectedDegree,
  setSelectedDegree,
  coursesLoading,
  coursesError,
  financialAids,
  getEnrollmentRecord,
  getProviderName,
  getFieldName,
  openStudySyllabus,
  onEnrollClick,
}) => {
  const { language, t, isRtl } = useLanguage();

  return (
    <section style={{ marginTop: '3.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <h2 className="section-title" style={{ margin: 0 }}>
          {language === 'ar'
            ? 'تصفح المقررات والبرامج الأكاديمية الحية'
            : 'Browse Live Academic Programs & Courses'}
        </h2>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            flex: 1,
            justifyContent: isRtl ? 'flex-end' : 'flex-start',
          }}
        >
          {/* Search Input */}
          <div className="search-wrapper">
            <input
              type="text"
              placeholder={
                language === 'ar'
                  ? '🔍 ابحث عن تخصص، جهة مانحة أو مقرر...'
                  : '🔍 Search for program, provider or course...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Level Filters */}
          <div className="glass-panel filters-container">
            <button
              onClick={() => setSelectedDegree('all')}
              className={`filter-btn ${selectedDegree === 'all' ? 'active' : ''}`}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setSelectedDegree('master')}
              className={`filter-btn ${selectedDegree === 'master' ? 'active' : ''}`}
            >
              {language === 'ar' ? 'ماجستير' : 'Master'}
            </button>
            <button
              onClick={() => setSelectedDegree('diploma')}
              className={`filter-btn ${selectedDegree === 'diploma' ? 'active' : ''}`}
            >
              {language === 'ar' ? 'دبلوم' : 'Diploma'}
            </button>
          </div>
        </div>
      </div>

      {/* Courses Catalog Grid */}
      {coursesLoading ? (
        <div className="spinner-container" style={{ minHeight: '20vh' }}>
          <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
        </div>
      ) : coursesError ? (
        <div
          className="glass-panel"
          style={{
            padding: '3rem',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171',
          }}
        >
          ⚠️{' '}
          {language === 'ar'
            ? 'فشل الاتصال بالخادم السحابي. يرجى التأكد من تشغيل السيرفر الخلفي وتغذية قاعدة البيانات.'
            : 'Cloud connection failed. Please ensure the backend server is running and seeded.'}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          {language === 'ar'
            ? 'لا توجد برامج تطابق معايير البحث الحالية في قاعدة البيانات.'
            : 'No programs matching the search criteria found in the database.'}
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map((course) => {
            const enrollRec = getEnrollmentRecord(course.id);
            const hasEnrolled = enrollRec && ['accepted', 'approved', 'enrolled', 'completed'].includes(enrollRec.status);
            const hasSubmitted = enrollRec && ['submitted', 'under_review', 'waitlisted'].includes(enrollRec.status);
            const hasRejected = enrollRec && enrollRec.status === 'rejected';

            return (
              <div
                key={course.id}
                className="glass-panel course-card"
                style={{
                  borderLeft: isRtl ? '2px solid rgba(255, 255, 255, 0.05)' : 'none',
                  borderRight: !isRtl ? '2px solid rgba(255, 255, 255, 0.05)' : 'none',
                }}
              >
                <div className="course-badge-container">
                  <span className="badge level">
                    {language === 'en'
                      ? course.degree_level === 'master'
                        ? 'Master'
                        : 'Diploma'
                      : course.degree_level_display}
                  </span>
                  <span className="badge mode">
                    {language === 'en'
                      ? course.study_mode === 'online'
                        ? 'Online'
                        : 'On-campus'
                      : course.study_mode_display}
                  </span>
                </div>

                <h3 className="course-title-text">
                  {language === 'en' && course.title_en ? course.title_en : course.title}
                </h3>
                <p className="course-en-title">{language === 'ar' ? course.title_en : course.title}</p>

                <div className="course-meta">
                  <div className="meta-item">
                    <span className="meta-icon">🏫</span>
                    <span>{getProviderName(course.provider_name)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">🏷️</span>
                    <span>{getFieldName(course.field_name)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span>
                      {language === 'ar' ? `المدة: ${course.duration_months} أشهر` : `Duration: ${course.duration_months} Months`}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">🌐</span>
                    <span>
                      {language === 'ar'
                        ? `اللغة: ${course.language === 'ar' ? 'العربية' : 'الإنجليزية'}`
                        : `Language: ${course.language === 'ar' ? 'Arabic' : 'English'}`}
                    </span>
                  </div>
                  <div className="meta-item cost">
                    <span className="meta-icon">💵</span>
                    <span>
                      {language === 'ar'
                        ? `الرسوم: ${course.tuition_fee} ${course.currency || 'SAR'}`
                        : `Tuition: ${course.tuition_fee} ${course.currency || 'SAR'}`}
                    </span>
                  </div>
                </div>

                {course.description && (
                  <p className="course-desc-preview">{t(course.slug + '-desc') || course.description}</p>
                )}

                <div className="course-actions">
                  {hasEnrolled ? (
                    <>
                      <span className="enroll-status-badge">
                        {language === 'ar' ? 'ملتحق بنجاح ✅' : 'Enrolled Successfully ✅'}
                      </span>
                      <button onClick={() => openStudySyllabus(course)} className="study-btn primary-glow-btn">
                        {language === 'ar' ? '📖 بدء الدراسة والتفاعل' : '📖 Start Study & Interact'}
                      </button>
                    </>
                  ) : hasSubmitted ? (
                    <>
                      <span className="enroll-status-badge" style={{ color: '#fbbf24' }}>
                        {language === 'ar' ? 'قيد المراجعة والقبول ⏳' : 'Under Review & Approval ⏳'}
                      </span>
                      <button
                        disabled
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', cursor: 'not-allowed' }}
                        className="study-btn"
                      >
                        {language === 'ar' ? '⌛ طلبك قيد المعاينة الإدارية' : '⌛ Your application is under admin review'}
                      </button>
                    </>
                  ) : hasRejected ? (
                    <>
                      <span className="enroll-status-badge" style={{ color: '#f87171' }}>
                        {language === 'ar' ? 'طلب الالتحاق مرفوض ❌' : 'Application Rejected ❌'}
                      </span>
                      <button
                        onClick={() => onEnrollClick(course)}
                        className="enroll-action-btn"
                        style={{ background: '#ef4444' }}
                      >
                        {language === 'ar' ? '✍️ إعادة المحاولة والتقديم مجدداً' : '✍️ Retry & Apply Again'}
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                      <button onClick={() => onEnrollClick(course)} className="enroll-action-btn">
                        {language === 'ar' ? '✍️ الالتحاق وتعبئة الطلب' : '✍️ Apply & Enroll'}
                      </button>
                      {financialAids.some((aid) => aid.program === course.id && aid.status === 'pending') ? (
                        <span style={{ color: '#fbbf24', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>
                          ⏳ {language === 'ar' ? 'طلب الدعم المالي قيد المراجعة' : 'Financial Aid Request Under Review'}
                        </span>
                      ) : Number(course.tuition_fee) > 0 ? (
                        <Link
                          href={`/financial-aid/apply/${course.id}`}
                          style={{
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(212, 175, 55, 0.1)',
                            color: '#d4af37',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            fontSize: '0.85rem',
                            padding: '0.5rem',
                            marginTop: '0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          🤝 {language === 'ar' ? 'طلب دعم مالي' : 'Request Financial Aid'}
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
