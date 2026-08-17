'use client';

import React, { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface SyllabusLesson {
  id: number;
  title: string;
  lesson_type: 'video' | 'pdf' | 'text' | 'quiz' | 'peer_assignment';
}

interface AICoachPanelProps {
  selectedLesson: SyllabusLesson | null;
  aiCoachMessages: any[];
  aiCoachInput: string;
  setAiCoachInput: (val: string) => void;
  aiCoachTyping: boolean;
  sendAiCoachMessage: () => void;
  aiCoachEndRef: React.RefObject<HTMLDivElement | null>;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({
  selectedLesson,
  aiCoachMessages,
  aiCoachInput,
  setAiCoachInput,
  aiCoachTyping,
  sendAiCoachMessage,
  aiCoachEndRef,
}) => {
  const { language } = useLanguage();

  useEffect(() => {
    aiCoachEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiCoachMessages, aiCoachTyping, aiCoachEndRef]);

  function renderMessageContent(content: string) {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
        const lang = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);

        return (
          <div
            key={index}
            style={{
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              margin: '0.75rem 0',
              overflow: 'hidden',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              textAlign: 'left',
            }}
            dir="ltr"
          >
            {lang && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                }}
              >
                {lang}
              </div>
            )}
            <pre
              style={{
                padding: '0.75rem',
                margin: 0,
                overflowX: 'auto',
                whiteSpace: 'pre',
                color: '#a7f3d0',
              }}
            >
              <code>{code.trim()}</code>
            </pre>
          </div>
        );
      } else {
        const inlineParts = part.split(/(\`[^\`]+\`)/g);

        return (
          <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
            {inlineParts.map((subPart, subIdx) => {
              if (subPart.startsWith('`') && subPart.endsWith('`')) {
                return (
                  <code
                    key={subIdx}
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      color: '#f43f5e',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '4px',
                      fontSize: '0.95em',
                      fontFamily: 'monospace',
                    }}
                  >
                    {subPart.slice(1, -1)}
                  </code>
                );
              } else {
                const boldParts = subPart.split(/(\*\*?[^*]+\*\*?)/g);
                return boldParts.map((bPart, bIdx) => {
                  if (bPart.startsWith('**') && bPart.endsWith('**')) {
                    return (
                      <strong key={bIdx} style={{ color: '#fff', fontWeight: 'bold' }}>
                        {bPart.slice(2, -2)}
                      </strong>
                    );
                  }
                  if (bPart.startsWith('*') && bPart.endsWith('*')) {
                    return (
                      <em key={bIdx} style={{ fontStyle: 'italic', color: '#cbd5e1' }}>
                        {bPart.slice(1, -1)}
                      </em>
                    );
                  }
                  return bPart;
                });
              }
            })}
          </span>
        );
      }
    });
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🤖</span>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-color)' }}>
            {language === 'ar' ? 'المساعد الذكي السياقي' : 'Contextual AI Assistant'}
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: '0.7rem',
              color: '#94a3b8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '180px',
            }}
          >
            {selectedLesson
              ? language === 'ar'
                ? `سياق الدرس: ${selectedLesson.title}`
                : `Lesson: ${selectedLesson.title}`
              : language === 'ar'
              ? 'طرح الأسئلة حول هذا البرنامج الأكاديمي'
              : 'Ask questions about this program'}
          </p>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.03)',
          marginBottom: '0.75rem',
        }}
      >
        {aiCoachMessages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-start' : 'flex-end',
              backgroundColor: msg.role === 'user' ? 'rgba(170, 124, 17, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              border: '1px solid',
              borderColor: msg.role === 'user' ? 'rgba(170, 124, 17, 0.3)' : 'rgba(255, 255, 255, 0.05)',
              padding: '0.6rem 0.85rem',
              borderRadius: '12px',
              maxWidth: '85%',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              color: '#f8fafc',
            }}
          >
            {renderMessageContent(msg.content)}
          </div>
        ))}
        {aiCoachTyping && (
          <div
            style={{
              alignSelf: 'flex-end',
              backgroundColor: 'rgba(255,255,255,0.05)',
              padding: '0.6rem 0.85rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              color: '#94a3b8',
            }}
          >
            {language === 'ar' ? 'المساعد يكتب الآن... ✍️' : 'Coach is typing... ✍️'}
          </div>
        )}
        <div ref={aiCoachEndRef} />
      </div>

      {/* Chat Input form */}
      <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.5rem' }}>
        <input
          type="text"
          value={aiCoachInput}
          onChange={(e) => setAiCoachInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendAiCoachMessage();
          }}
          placeholder={language === 'ar' ? 'اسأل المساعد عن الدرس...' : 'Ask the coach about this lesson...'}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            fontSize: '0.8rem',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'white',
          }}
        />
        <button
          onClick={sendAiCoachMessage}
          className="verify-action-btn"
          style={{
            padding: '0.5rem 0.85rem',
            width: 'auto',
            background: 'linear-gradient(135deg, #aa7c11 0%, #d4af37 100%)',
            borderRadius: '8px',
            cursor: 'pointer',
            margin: 0,
            fontSize: '0.8rem',
          }}
        >
          {language === 'ar' ? 'إرسال' : 'Send'}
        </button>
      </div>
    </div>
  );
};
