'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface SyllabusLesson {
  id: number;
  title: string;
  lesson_type: 'video' | 'pdf' | 'text' | 'quiz' | 'peer_assignment';
  duration_minutes: number;
  order: number;
  is_preview: boolean;
  is_locked?: boolean;
}

interface SyllabusModule {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: SyllabusLesson[];
}

interface SyllabusSidebarProps {
  syllabusModules: SyllabusModule[];
  completedLessons: number[];
  selectedLesson: SyllabusLesson | null;
  onSelectLesson: (lesson: SyllabusLesson) => void;
  loadingSyllabus: boolean;
}

export const SyllabusSidebar: React.FC<SyllabusSidebarProps> = ({
  syllabusModules,
  completedLessons,
  selectedLesson,
  onSelectLesson,
  loadingSyllabus,
}) => {
  const { language } = useLanguage();

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'pdf':
        return '📄';
      case 'text':
        return '📝';
      case 'quiz':
        return '❓';
      case 'peer_assignment':
        return '👥';
      default:
        return '📖';
    }
  };

  const translateSyllabusText = (text: string) => {
    if (!text) return '';
    if (language === 'en') {
      // Basic mappings for mock translations
      if (text.includes('الذكاء الاصطناعي')) return 'Artificial Intelligence Intro';
      if (text.includes('مقدمة في')) return 'Introduction to Course';
      if (text.includes('أساسيات')) return 'Foundations and Basics';
      if (text.includes('اختبار')) return 'Conceptual Evaluation Quiz';
      if (text.includes('واجب')) return 'Practical Peer Assignment';
      if (text.includes('تطبيق عملي')) return 'Practical Implementation Guide';
      if (text.includes('الأمن السيبراني')) return 'Introduction to Cybersecurity';
      if (text.includes('نظام التشفير')) return 'Cryptography & Encryption standards';
      if (text.includes('تطوير تطبيقات')) return 'Software Engineering Fundamentals';
    }
    return text;
  };

  return (
    <aside className="syllabus-sidebar-panel glass-panel">
      <h3 className="sidebar-title">
        {language === 'ar' ? '📋 خطة دراسة المقررات' : '📋 Course Learning Syllabus'}
      </h3>
      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>
        {language === 'ar'
          ? 'اضغط على الدرس لتفعيله فورياً ومشاهدته'
          : 'Click any module lesson to unlock interactive display'}
      </p>

      {loadingSyllabus ? (
        <div className="spinner-container" style={{ minHeight: '150px' }}>
          <div className="spinner" style={{ width: '25px', height: '25px' }}></div>
        </div>
      ) : syllabusModules.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>
          {language === 'ar' ? 'لا توجد وحدات دراسية لهذا المقرر بعد.' : 'No modules defined for this course.'}
        </div>
      ) : (
        <div className="modules-accordion">
          {syllabusModules.map((mod) => (
            <div key={mod.id} className="module-item-accordion">
              <div className="module-header-accordion">
                <span className="mod-number">#{mod.order}</span>
                <div>
                  <h4 className="mod-title">{translateSyllabusText(mod.title)}</h4>
                  <p className="mod-desc">{translateSyllabusText(mod.description)}</p>
                </div>
              </div>

              <div className="lessons-container-accordion">
                {mod.lessons.map((les) => {
                  const isSelected = selectedLesson?.id === les.id;
                  const isCompleted = completedLessons.includes(les.id);
                  return (
                    <div
                      key={les.id}
                      onClick={() => onSelectLesson(les)}
                      className={`lesson-row-accordion ${isSelected ? 'active' : ''} ${
                        isCompleted ? 'completed' : ''
                      }`}
                    >
                      <div className="lesson-left-acc">
                        <span className="lesson-type-icon">{getLessonTypeIcon(les.lesson_type)}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="lesson-row-title">{translateSyllabusText(les.title)}</span>
                          <span className="lesson-row-meta">
                            {language === 'ar'
                              ? `⏱️ ${les.duration_minutes} دقيقة`
                              : `⏱️ ${les.duration_minutes} Mins`}
                          </span>
                        </div>
                      </div>

                      <span className="lesson-check-status-badge">
                        {isCompleted ? '✅' : '⏳'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
