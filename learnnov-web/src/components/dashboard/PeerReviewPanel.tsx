'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface PeerStatus {
  is_completed: boolean;
  has_submitted: boolean;
  reviews_given_count: number;
  reviews_received_count: number;
  average_score: number | null;
  submission_text: string | null;
}

interface PeerReviewTarget {
  id: number;
  student_username: string;
  submission_text: string;
}

interface PeerReviewPanelProps {
  peerStatus: PeerStatus | null;
  peerSubmissionText: string;
  setPeerSubmissionText: (val: string) => void;
  peerSubmissionLoading: boolean;
  submitPeerAssignment: () => Promise<void>;
  peerReviewTarget: PeerReviewTarget | null;
  setPeerReviewTarget: (val: PeerReviewTarget | null) => void;
  peerReviewLoading: boolean;
  fetchRandomPeerSubmission: () => Promise<void>;
  peerReviewScore: number;
  setPeerReviewScore: (val: number) => void;
  peerReviewFeedback: string;
  setPeerReviewFeedback: (val: string) => void;
  peerReviewSubmitting: boolean;
  submitPeerReview: () => Promise<void>;
}

export const PeerReviewPanel: React.FC<PeerReviewPanelProps> = ({
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

  return (
    <div
      className="peer-assignment-workspace glass-panel"
      style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      {/* 1. Status Section */}
      <div
        className="peer-status-banner"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>
            {language === 'ar' ? '📊 حالة إكمال المهمة' : '📊 Assignment Progress'}
          </h4>
          <span
            style={{
              background: peerStatus?.is_completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: peerStatus?.is_completed ? '#10b981' : '#f59e0b',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            {peerStatus?.is_completed
              ? language === 'ar'
                ? '✅ مكتملة'
                : '✅ Completed'
              : language === 'ar'
              ? '⏳ قيد الإنجاز'
              : '⏳ In Progress'}
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
          {language === 'ar'
            ? 'لإكمال هذا الدرس بنجاح، يجب عليك تسليم إجابتك الخاصة وتقييم 3 واجبات على الأقل من زملائك.'
            : 'To complete this lesson, you must submit your own work and evaluate at least 3 submissions from peers.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
              {language === 'ar' ? 'حالة تسليمك' : 'Your Submission'}
            </div>
            <div style={{ fontWeight: 600, color: peerStatus?.has_submitted ? '#10b981' : '#ef4444', fontSize: '0.9rem' }}>
              {peerStatus?.has_submitted
                ? language === 'ar'
                  ? 'تم التسليم بنجاح'
                  : 'Submitted Successfully'
                : language === 'ar'
                ? 'لم يتم التسليم بعد'
                : 'Not Submitted Yet'}
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
              {language === 'ar' ? 'التقييمات التي قدمتها للزملاء' : 'Peer Reviews Given'}
            </div>
            <div
              style={{
                fontWeight: 600,
                color: peerStatus && peerStatus.reviews_given_count >= 3 ? '#10b981' : '#fff',
                fontSize: '1.1rem',
              }}
            >
              {peerStatus?.reviews_given_count || 0} / 3
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
              {language === 'ar' ? 'التقييمات المستلمة من زملائك' : 'Reviews Received'}
            </div>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.1rem' }}>{peerStatus?.reviews_received_count || 0}</div>
          </div>
          {peerStatus && peerStatus.reviews_received_count > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                {language === 'ar' ? 'متوسط درجتك' : 'Average Grade'}
              </div>
              <div style={{ fontWeight: 600, color: '#fbbf24', fontSize: '1.1rem' }}>
                {peerStatus?.average_score?.toFixed(1) || '-'} / 5.0
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Submission Box */}
      {!peerStatus?.has_submitted ? (
        <div className="peer-submission-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ margin: 0, color: '#fff', fontWeight: 600 }}>
            {language === 'ar' ? '✍️ اكتب وحمل إجابة الواجب الخاص بك' : '✍️ Write & Submit Your Assignment'}
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            {language === 'ar'
              ? 'يرجى تقديم رد متكامل يغطي محاور دراسة الحالة المطلوبة في هذا الدرس. سيقوم زملائك في الكورس بتقييمك بناءً على معايير الجودة والأداء.'
              : 'Please provide a comprehensive response covering the case study prompt. Your peers will grade you based on depth and clarity.'}
          </p>
          <textarea
            value={peerSubmissionText}
            onChange={(e) => setPeerSubmissionText(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'اكتب إجابتك هنا بالتفصيل (الحد الأدنى 50 حرفاً)...'
                : 'Write your answer here in detail (Min 50 characters)...'
            }
            disabled={peerSubmissionLoading}
            style={{
              width: '100%',
              minHeight: '150px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '1rem',
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <button
            onClick={submitPeerAssignment}
            disabled={peerSubmissionLoading || peerSubmissionText.trim().length < 20}
            className="complete-article-btn"
            style={{
              alignSelf: 'flex-start',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
              opacity: peerSubmissionLoading || peerSubmissionText.trim().length < 20 ? 0.6 : 1,
            }}
          >
            {peerSubmissionLoading
              ? language === 'ar'
                ? '⏳ جاري تسليم إجابتك...'
                : '⏳ Submitting work...'
              : language === 'ar'
              ? '🚀 تسليم الواجب للتقييم'
              : '🚀 Submit Assignment'}
          </button>
        </div>
      ) : (
        <div
          className="peer-submission-submitted"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            background: 'rgba(16,185,129,0.02)',
            border: '1px solid rgba(16,185,129,0.1)',
            borderRadius: '12px',
            padding: '1.25rem',
          }}
        >
          <h4 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <span>✔</span>{' '}
            {language === 'ar' ? 'لقد قمت بتسليم الواجب الخاص بك' : 'You have submitted your assignment'}
          </h4>
          <div
            style={{
              background: 'rgba(0,0,0,0.15)',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#cbd5e1',
              whiteSpace: 'pre-wrap',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            {peerStatus?.submission_text}
          </div>
        </div>
      )}

      {/* 3. Review Peers Section */}
      {peerStatus?.has_submitted && (
        <div
          className="peer-grading-section"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <h4 style={{ margin: 0, color: '#fff', fontWeight: 600 }}>
            {language === 'ar' ? '👥 قيم واجبات زملائك الطلاب' : '👥 Evaluate Peer Submissions'}
          </h4>

          {!peerReviewTarget ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                {language === 'ar'
                  ? 'اضغط على الزر أدناه للحصول على واجب عشوائي قدمه أحد زملائك في الكورس لتقوم بمراجعته وإعطائه التغذية الراجعة.'
                  : 'Click below to load a random submission from a peer, read it, and provide constructive feedback.'}
              </p>
              <button
                onClick={fetchRandomPeerSubmission}
                disabled={peerReviewLoading}
                className="complete-article-btn"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                }}
              >
                {peerReviewLoading
                  ? language === 'ar'
                    ? '⏳ جاري البحث...'
                    : '⏳ Searching...'
                  : language === 'ar'
                  ? '🔍 جلب واجب زميل عشوائي للتقييم'
                  : '🔍 Fetch Random Peer Submission'}
              </button>
            </div>
          ) : (
            <div
              className="peer-review-card"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                  {language === 'ar'
                    ? `واجب الطالب: ${peerReviewTarget.student_username}`
                    : `Student: ${peerReviewTarget.student_username}`}
                </span>
                <button
                  onClick={() => setPeerReviewTarget(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {language === 'ar' ? 'إلغاء ✖' : 'Cancel ✖'}
                </button>
              </div>

              <div
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#cbd5e1',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {peerReviewTarget.submission_text}
              </div>

              {/* Review Form */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderTop: '1px dashed rgba(255,255,255,0.06)',
                  paddingTop: '1rem',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: '#94a3b8',
                      marginBottom: '0.5rem',
                      fontWeight: 500,
                    }}
                  >
                    {language === 'ar' ? 'الدرجة المستحقة (من 1 إلى 5):' : 'Score (from 1 to 5):'}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPeerReviewScore(s)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: peerReviewScore === s ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                          background: peerReviewScore === s ? 'rgba(14,165,233,0.15)' : 'rgba(0,0,0,0.2)',
                          color: peerReviewScore === s ? 'var(--accent)' : '#94a3b8',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {s} ⭐
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: '#94a3b8',
                      marginBottom: '0.5rem',
                      fontWeight: 500,
                    }}
                  >
                    {language === 'ar' ? 'التغذية الراجعة والملاحظات البناءة:' : 'Constructive Feedback & Notes:'}
                  </label>
                  <textarea
                    value={peerReviewFeedback}
                    onChange={(e) => setPeerReviewFeedback(e.target.value)}
                    placeholder={
                      language === 'ar'
                        ? 'اكتب ملاحظاتك لمساعدة زميلك على التحسن والتعلم...'
                        : 'Write notes to help your peer improve...'
                    }
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: '#fff',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <button
                  onClick={submitPeerReview}
                  disabled={peerReviewSubmitting || !peerReviewFeedback.trim()}
                  className="complete-article-btn"
                  style={{
                    alignSelf: 'flex-start',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                    opacity: peerReviewSubmitting || !peerReviewFeedback.trim() ? 0.6 : 1,
                  }}
                >
                  {peerReviewSubmitting
                    ? language === 'ar'
                      ? '⏳ جاري الإرسال...'
                      : '⏳ Submitting...'
                    : language === 'ar'
                    ? '✔ تقديم التقييم والدرجة'
                    : '✔ Submit Score & Feedback'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
