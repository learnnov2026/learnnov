'use client';

import React from 'react';
import { LessonViewer } from './LessonViewer';
import { SyllabusSidebar } from './SyllabusSidebar';
import { AICoachPanel } from './AICoachPanel';

interface SyllabusLesson {
  id: number;
  title: string;
  lesson_type: 'video' | 'pdf' | 'text' | 'quiz' | 'peer_assignment';
  content?: string;
  duration_minutes: number;
  order: number;
  is_preview: boolean;
}

interface SyllabusModule {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: SyllabusLesson[];
}

interface AcademicProgram {
  id: number;
  title: string;
  title_en: string;
  slug: string;
}

interface SyllabusDrawerProps {
  studyingProgram: AcademicProgram;
  language: string;
  syllabusModules: SyllabusModule[];
  completedLessons: number[];
  setCompletedLessons: React.Dispatch<React.SetStateAction<number[]>>;
  showSyllabusDrawer: boolean;
  setShowSyllabusDrawer: (show: boolean) => void;
  loadingSyllabus: boolean;
  selectedLesson: SyllabusLesson | null;
  setSelectedLesson: (lesson: SyllabusLesson | null) => void;
  videoPlaying: boolean;
  setVideoPlaying: (playing: boolean) => void;
  videoProgress: number;
  setVideoProgress: React.Dispatch<React.SetStateAction<number>>;
  quizAnswer: string;
  setQuizAnswer: (ans: string) => void;
  quizChecked: boolean;
  setQuizChecked: (chk: boolean) => void;
  quizIsCorrect: boolean | null;
  setQuizIsCorrect: (correct: boolean | null) => void;
  checkQuizAnswer: () => void;
  sidebarTab: 'syllabus' | 'ai_coach';
  setSidebarTab: (tab: 'syllabus' | 'ai_coach') => void;
  aiCoachMessages: any[];
  setAiCoachMessages: React.Dispatch<React.SetStateAction<any[]>>;
  aiCoachInput: string;
  setAiCoachInput: (input: string) => void;
  aiCoachTyping: boolean;
  sendAiCoachMessage: () => void;
  aiCoachEndRef: React.RefObject<HTMLDivElement | null>;
  peerStatus: any;
  peerSubmissionText: string;
  setPeerSubmissionText: (txt: string) => void;
  peerSubmissionLoading: boolean;
  submitPeerAssignment: () => Promise<void>;
  peerReviewTarget: any;
  setPeerReviewTarget: (target: any) => void;
  peerReviewLoading: boolean;
  fetchRandomPeerSubmission: () => Promise<void>;
  peerReviewScore: number;
  setPeerReviewScore: (score: number) => void;
  peerReviewFeedback: string;
  setPeerReviewFeedback: (feedback: string) => void;
  peerReviewSubmitting: boolean;
  submitPeerReview: () => Promise<void>;
}

export const SyllabusDrawer: React.FC<SyllabusDrawerProps> = ({
  studyingProgram,
  language,
  syllabusModules,
  completedLessons,
  setCompletedLessons,
  setShowSyllabusDrawer,
  loadingSyllabus,
  selectedLesson,
  setSelectedLesson,
  videoPlaying,
  setVideoPlaying,
  videoProgress,
  setVideoProgress,
  quizAnswer,
  setQuizAnswer,
  quizChecked,
  setQuizChecked,
  quizIsCorrect,
  setQuizIsCorrect,
  checkQuizAnswer,
  sidebarTab,
  setSidebarTab,
  aiCoachMessages,
  setAiCoachMessages,
  aiCoachInput,
  setAiCoachInput,
  aiCoachTyping,
  sendAiCoachMessage,
  aiCoachEndRef,
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
  const totalLessons = syllabusModules.reduce((acc, m) => acc + m.lessons.length, 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

  return (
    <div className="syllabus-backdrop">
      <div className="glass-panel syllabus-drawer">
        {/* Drawer Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>📖</span>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }} className="text-gradient">
                {language === 'en' && studyingProgram.title_en ? studyingProgram.title_en : studyingProgram.title}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {language === 'ar' ? 'المحاضرات التفاعلية والتقدم المنجز' : 'Interactive lectures & completed progress'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Progress bar */}
            <div className="progress-container-hdr">
              <div className="progress-bar-label">{language === 'ar' ? 'التقدم الكلي للمقرر:' : 'Total Course Progress:'}</div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="progress-percentage-hdr">{progressPercent}%</span>
            </div>

            <button
              onClick={() => setShowSyllabusDrawer(false)}
              className="close-drawer-btn"
            >
              {language === 'ar' ? 'إغلاق ❌' : 'Close ❌'}
            </button>
          </div>
        </div>

        {/* Drawer main split screen layout */}
        <div className="drawer-content-split">
          {/* Left Side: Active Lesson Display Panel */}
          <div className="active-lesson-viewer glass-panel">
            {loadingSyllabus ? (
              <div className="spinner-container">
                <div className="spinner"></div>
              </div>
            ) : !selectedLesson ? (
              <div className="welcome-study-screen">
                <div className="welcome-study-icon">🚀</div>
                <h3>{language === 'ar' ? 'مرحباً بك في الصف الدراسي التفاعلي!' : 'Welcome to the classroom!'}</h3>
                <p>
                  {language === 'ar'
                    ? 'الرجاء اختيار أحد الدروس أو الاختبارات القصيرة من القائمة الجانبية للبدء في تلقي المادة العلمية واحتساب تقدمك الأكاديمي.'
                    : 'Please select a lesson or quiz from the sidebar to begin learning and track your academic progress.'}
                </p>

                <div className="study-guideline-grid">
                  <div className="guide-card">
                    <span>🎥</span>
                    <h4>{language === 'ar' ? 'شاهد الفيديوهات التفاعلية' : 'Watch Videos'}</h4>
                    <p>{language === 'ar' ? 'شاهد المحاضرات كاملة ليتم احتساب الدرس كدرس مكتمل تلقائياً.' : 'Watch lectures fully to mark lesson completed.'}</p>
                  </div>
                  <div className="guide-card">
                    <span>📝</span>
                    <h4>{language === 'ar' ? 'اقرأ المقالات المنهجية' : 'Read Articles'}</h4>
                    <p>{language === 'ar' ? 'تصفح الدليل الأكاديمي واضغط علامة الاكتمال بعد الفهم.' : 'Read concepts and mark completed.'}</p>
                  </div>
                  <div className="guide-card">
                    <span>❓</span>
                    <h4>{language === 'ar' ? 'أجب عن الاختبارات القصيرة' : 'Complete Quizzes'}</h4>
                    <p>{language === 'ar' ? 'اختبر مخرجات التعليم واحصل على العلامة الكاملة مباشرة.' : 'Test outputs and get marks.'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <LessonViewer
                selectedLesson={selectedLesson}
                completedLessons={completedLessons}
                setCompletedLessons={setCompletedLessons}
                videoPlaying={videoPlaying}
                setVideoPlaying={setVideoPlaying}
                videoProgress={videoProgress}
                setVideoProgress={setVideoProgress}
                quizAnswer={quizAnswer}
                setQuizAnswer={setQuizAnswer}
                quizChecked={quizChecked}
                setQuizChecked={setQuizChecked}
                quizIsCorrect={quizIsCorrect}
                checkQuizAnswer={checkQuizAnswer}
                studyingProgram={studyingProgram}
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

          {/* Right Side: Tabbed Syllabus Sidebar & AI Coach */}
          <div className="syllabus-tree-sidebar glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setSidebarTab('syllabus')}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: sidebarTab === 'syllabus' ? 'var(--accent)' : '#64748b',
                  borderBottom: sidebarTab === 'syllabus' ? '2px solid var(--accent)' : 'none',
                  fontWeight: 600,
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {language === 'ar' ? '📋 خطة المنهج' : '📋 Curriculum'}
              </button>
              <button
                onClick={() => setSidebarTab('ai_coach')}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: sidebarTab === 'ai_coach' ? 'var(--accent)' : '#64748b',
                  borderBottom: sidebarTab === 'ai_coach' ? '2px solid var(--accent)' : 'none',
                  fontWeight: 600,
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {language === 'ar' ? '🤖 المساعد الذكي' : '🤖 AI Coach'}
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {sidebarTab === 'syllabus' ? (
                <SyllabusSidebar
                  syllabusModules={syllabusModules}
                  completedLessons={completedLessons}
                  selectedLesson={selectedLesson}
                  onSelectLesson={(less) => {
                    setSelectedLesson(less);
                    setVideoPlaying(false);
                    setVideoProgress(0);
                    setQuizAnswer('');
                    setQuizChecked(false);
                    setQuizIsCorrect(null);
                    setAiCoachMessages([
                      {
                        id: 'welcome',
                        role: 'assistant',
                        content: language === 'ar'
                          ? `مرحباً بك! أنا مساعد ليرنوف الأكاديمي السياقي. سأساعدك في فهم درس "**${less.title}**". كيف يمكنني مساعدتك اليوم؟`
                          : `Welcome! I am your contextual AI Coach for "**${less.title}**". How can I help you today?`
                      }
                    ]);
                  }}
                  loadingSyllabus={loadingSyllabus}
                />
              ) : (
                <AICoachPanel
                  selectedLesson={selectedLesson}
                  aiCoachMessages={aiCoachMessages}
                  aiCoachInput={aiCoachInput}
                  setAiCoachInput={setAiCoachInput}
                  aiCoachTyping={aiCoachTyping}
                  sendAiCoachMessage={sendAiCoachMessage}
                  aiCoachEndRef={aiCoachEndRef}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
