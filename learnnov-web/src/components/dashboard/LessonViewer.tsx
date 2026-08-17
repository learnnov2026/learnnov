'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { PeerReviewPanel } from './PeerReviewPanel';

interface SyllabusLesson {
  id: number;
  title: string;
  lesson_type: 'video' | 'pdf' | 'text' | 'quiz' | 'peer_assignment';
  content?: string;
  duration_minutes: number;
  order: number;
  is_preview: boolean;
}

interface AcademicProgram {
  id: number;
  title: string;
  title_en: string;
  slug: string;
}

interface LessonViewerProps {
  selectedLesson: SyllabusLesson;
  completedLessons: number[];
  setCompletedLessons: (lessons: number[]) => void;
  videoPlaying: boolean;
  setVideoPlaying: (playing: boolean) => void;
  videoProgress: number;
  setVideoProgress: (progress: number) => void;
  quizAnswer: string;
  setQuizAnswer: (ans: string) => void;
  quizChecked: boolean;
  setQuizChecked: (checked: boolean) => void;
  quizIsCorrect: boolean | null;
  checkQuizAnswer: () => void;
  studyingProgram: AcademicProgram;
  
  // Peer review sub-component props
  peerStatus: any;
  peerSubmissionText: string;
  setPeerSubmissionText: (val: string) => void;
  peerSubmissionLoading: boolean;
  submitPeerAssignment: () => Promise<void>;
  peerReviewTarget: any;
  setPeerReviewTarget: (val: any) => void;
  peerReviewLoading: boolean;
  fetchRandomPeerSubmission: () => Promise<void>;
  peerReviewScore: number;
  setPeerReviewScore: (val: number) => void;
  peerReviewFeedback: string;
  setPeerReviewFeedback: (val: string) => void;
  peerReviewSubmitting: boolean;
  submitPeerReview: () => Promise<void>;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  selectedLesson,
  completedLessons,
  setCompletedLessons,
  videoPlaying,
  setVideoPlaying,
  videoProgress,
  setVideoProgress,
  quizAnswer,
  setQuizAnswer,
  quizChecked,
  setQuizChecked,
  quizIsCorrect,
  checkQuizAnswer,
  studyingProgram,
  
  peerStatus,
  peerSubmissionText,
  setPeerSubmissionText,
  peerSubmissionLoading,
  submitPeerAssignment,
  peerReviewTarget,
  setPeerReviewTarget,
  peerReviewLoading,
  fetchRandomPeerSubmission,
  peerReviewScore,
  setPeerReviewScore,
  peerReviewFeedback,
  setPeerReviewFeedback,
  peerReviewSubmitting,
  submitPeerReview,
}) => {
  const { language } = useLanguage();

  const translateSyllabusText = (text: string) => {
    if (!text) return '';
    if (language === 'en') {
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
    <div className="lesson-display-workspace">
      <div className="lesson-workspace-header">
        <span className={`lesson-type-badge ${selectedLesson.lesson_type}`}>
          {selectedLesson.lesson_type === 'video' && (language === 'ar' ? '🎥 محاضرة فيديو' : '🎥 Video Lecture')}
          {selectedLesson.lesson_type === 'text' && (language === 'ar' ? '📝 مقال دراسي' : '📝 Study Article')}
          {selectedLesson.lesson_type === 'quiz' && (language === 'ar' ? '❓ اختبار قصير' : '❓ Short Quiz')}
          {selectedLesson.lesson_type === 'pdf' && (language === 'ar' ? '📄 مستند دراسي' : '📄 Study Document')}
          {selectedLesson.lesson_type === 'peer_assignment' && (language === 'ar' ? '👥 تقييم الزملاء' : '👥 Peer Review')}
        </span>
        <h3>{translateSyllabusText(selectedLesson.title)}</h3>
        <span className="lesson-duration">
          {language === 'ar'
            ? `⏱️ مدة التفاعل: ${selectedLesson.duration_minutes} دقائق`
            : `⏱️ Interaction: ${selectedLesson.duration_minutes} Mins`}
        </span>
      </div>

      {/* Lesson Content Renderers */}
      <div className="lesson-visualizer-body">
        {/* Video Player Visualizer */}
        {selectedLesson.lesson_type === 'video' && (
          <div className="interactive-video-player glass-panel" style={{ padding: '1rem', borderRadius: '16px' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', background: '#000', marginBottom: '1rem' }}>
              <iframe
                src={`https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0`}
                title={selectedLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0.5rem 0' }}>
              <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>
                ● {language === 'ar' ? 'بث مباشر عالي الدقة عبر YouTube' : '● Live HD Stream via YouTube'}
              </span>
              <a
                href={`https://classroom.google.com/share?url=${encodeURIComponent(`https://learnnov-web.vercel.app`)}&title=${encodeURIComponent(selectedLesson.title)}`}
                target="_blank"
                rel="noreferrer"
                style={{ background: '#4285F4', color: '#FFF', padding: '0.4rem 0.8rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                🏫 {language === 'ar' ? 'مشاركة في Google Classroom' : 'Share to Google Classroom'}
              </a>
            </div>
            {videoProgress >= 100 && (
              <div className="video-completed-banner">
                {language === 'ar' ? '🎉 تم حضور المحاضرة بالكامل وتسجيل تقدمك!' : '🎉 Lecture watched completely and progress saved!'}
              </div>
            )}
          </div>
        )}

        {/* Text Article Visualizer */}
        {selectedLesson.lesson_type === 'text' && (
          <div className="text-lesson-article glass-panel">
            <div className="article-prose">
              <p>
                {selectedLesson.content
                  ? translateSyllabusText(selectedLesson.content)
                  : language === 'ar'
                  ? 'يحتوي هذا الدرس على المادة العلمية التأسيسية للمقرر. يُنصح بمذاكرة المفاهيم ومراجعتها عدة مرات لاستيعاب تطبيقاتها العملية.'
                  : 'This lesson contains the foundational course concepts. It is recommended to study and review them multiple times.'}
              </p>
              <p style={{ marginTop: '1.5rem' }}>
                {language === 'ar'
                  ? 'يعتبر هذا الدرس ركيزة أساسية للدخول في تفاصيل ورش العمل والتدريبات التطبيقية المتقدمة التي تليها، لذا احرص على تدوين ملاحظاتك.'
                  : 'This lesson is a key pillar for entering the details of advanced practical workshops that follow, so make sure to take notes.'}
              </p>
            </div>

            <div className="article-actions">
              {completedLessons.includes(selectedLesson.id) ? (
                <div className="article-completed-status">
                  {language === 'ar' ? '☑️ تم إكمال قراءة وفهم الدرس' : '☑️ Completed read and understood'}
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!completedLessons.includes(selectedLesson.id)) {
                      setCompletedLessons([...completedLessons, selectedLesson.id]);
                    }
                  }}
                  className="complete-article-btn"
                >
                  {language === 'ar' ? '☑️ أكملت قراءة وفهم المحاضرة' : '☑️ I read and understood the lecture'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quiz Visualizer */}
        {selectedLesson.lesson_type === 'quiz' && (
          <div className="interactive-quiz-workspace glass-panel">
            <div className="quiz-question-container">
              <span className="quiz-badge">{language === 'ar' ? 'السؤال الأول والأهم' : 'First & Most Important Question'}</span>
              <p className="question-text">
                {language === 'ar'
                  ? 'ما هي القيمة المحورية التي يضيفها التخصص الأكاديمي والمقرر الجاري دراسته للتطبيقات التقنية الحديثة؟'
                  : 'What is the core value that the academic specialization and this course add to modern technical applications?'}
              </p>

              <div className="choices-list">
                <label className={`choice-item ${quizAnswer === 'wrong1' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="quiz-choice"
                    value="wrong1"
                    checked={quizAnswer === 'wrong1'}
                    onChange={(e) => {
                      setQuizAnswer(e.target.value);
                      setQuizChecked(false);
                    }}
                    disabled={quizChecked && quizIsCorrect === true}
                  />
                  <span>
                    {language === 'ar'
                      ? 'أ) يهدف فقط للاستعراض النظري دون مساهمة عملية في المشاريع السحابية.'
                      : 'A) It only aims for theoretical review without practical contribution to cloud projects.'}
                  </span>
                </label>

                <label className={`choice-item ${quizAnswer === 'correct' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="quiz-choice"
                    value="correct"
                    checked={quizAnswer === 'correct'}
                    onChange={(e) => {
                      setQuizAnswer(e.target.value);
                      setQuizChecked(false);
                    }}
                    disabled={quizChecked && quizIsCorrect === true}
                  />
                  <span>
                    {language === 'ar'
                      ? 'ب) يمكن من بناء أنظمة مرنة وحلول تطبيقية معالجة للبيانات تحل مشكلات واقعية. (الإجابة الأصح)'
                      : 'B) Enables building resilient systems and data-processing applied solutions that solve real-world problems. (Correct)'}
                  </span>
                </label>

                <label className={`choice-item ${quizAnswer === 'wrong2' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="quiz-choice"
                    value="wrong2"
                    checked={quizAnswer === 'wrong2'}
                    onChange={(e) => {
                      setQuizAnswer(e.target.value);
                      setQuizChecked(false);
                    }}
                    disabled={quizChecked && quizIsCorrect === true}
                  />
                  <span>
                    {language === 'ar'
                      ? 'ج) يقتصر تطبيقه على الهواة ولا يصلح للمؤسسات الكبرى والشركاء الأكاديميين.'
                      : 'C) Its application is limited to amateurs and is not suitable for large enterprises and academic partners.'}
                  </span>
                </label>
              </div>

              <div className="quiz-action-bar">
                {quizChecked ? (
                  quizIsCorrect ? (
                    <div className="quiz-feedback success">
                      {language === 'ar'
                        ? '🎉 إجابة صحيحة نموذجية! لقد تم احتساب تقدمك واجتيازك بنجاح!'
                        : '🎉 Correct model answer! Your progress and completion have been successfully saved!'}
                    </div>
                  ) : (
                    <div className="quiz-feedback failure">
                      {language === 'ar'
                        ? '❌ إجابة غير دقيقة. يرجى مراجعة الدرس التأسيسي السابق والمحاولة مجدداً.'
                        : '❌ Incorrect answer. Please review the previous foundational lesson and try again.'}
                    </div>
                  )
                ) : null}

                {!quizChecked && quizAnswer && (
                  <button onClick={checkQuizAnswer} className="check-quiz-btn">
                    {language === 'ar' ? 'تحقق من صحة الإجابة 🔍' : 'Verify Answer 🔍'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PDF Document Visualizer */}
        {selectedLesson.lesson_type === 'pdf' && (
          <div className="pdf-lesson-viewer glass-panel">
            <div className="pdf-mock-frame">
              <span className="pdf-icon-huge">📄</span>
              <h4>{language === 'ar' ? 'الدليل التعليمي والحقيبة الدراسية الكاملة' : 'Complete Study Packet & Guide'}</h4>
              <p>
                {language === 'ar'
                  ? 'يحتوي هذا المستند على الملخص الأكاديمي، أسئلة المراجعة، ومراجع إضافية موثقة ومعتمدة.'
                  : 'This document contains the academic summary, review questions, and additional certified references.'}
              </p>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert(language === 'ar' ? 'جاري تحميل الملف التعليمي PDF إلى جهازك...' : 'Downloading the study PDF onto your device...');
                  if (!completedLessons.includes(selectedLesson.id)) {
                    setCompletedLessons([...completedLessons, selectedLesson.id]);
                  }
                }}
                className="pdf-download-action-btn"
              >
                {language === 'ar' ? '📥 تحميل الكتيب الدراسي الفوري (PDF)' : '📥 Download Study Guide (PDF)'}
              </a>
            </div>
          </div>
        )}

        {/* Peer Assignment Visualizer */}
        {selectedLesson.lesson_type === 'peer_assignment' && (
          <PeerReviewPanel
            peerStatus={peerStatus}
            peerSubmissionText={peerSubmissionText}
            setPeerSubmissionText={setPeerSubmissionText}
            peerSubmissionLoading={peerSubmissionLoading}
            submitPeerAssignment={submitPeerAssignment}
            peerReviewTarget={peerReviewTarget}
            setPeerReviewTarget={setPeerReviewTarget}
            peerReviewLoading={peerReviewLoading}
            fetchRandomPeerSubmission={fetchRandomPeerSubmission}
            peerReviewScore={peerReviewScore}
            setPeerReviewScore={setPeerReviewScore}
            peerReviewFeedback={peerReviewFeedback}
            setPeerReviewFeedback={setPeerReviewFeedback}
            peerReviewSubmitting={peerReviewSubmitting}
            submitPeerReview={submitPeerReview}
          />
        )}
      </div>
    </div>
  );
};
