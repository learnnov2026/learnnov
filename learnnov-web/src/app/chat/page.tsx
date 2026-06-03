'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function renderMessageContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      const lang = match ? match[1] : '';
      const code = match ? match[2] : part.slice(3, -3);

      return (
        <div key={index} style={{ 
          background: 'rgba(0,0,0,0.6)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '8px', 
          margin: '0.75rem 0', 
          overflow: 'hidden',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          textAlign: 'left'
        }} dir="ltr">
          {lang && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '0.35rem 1rem', 
              fontSize: '0.75rem', 
              color: '#94a3b8', 
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}>
              {lang}
            </div>
          )}
          <pre style={{ 
            padding: '1rem', 
            margin: 0, 
            overflowX: 'auto',
            whiteSpace: 'pre',
            color: '#a7f3d0'
          }}>
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    } else {
      const inlineParts = part.split(/(`[^`]+`)/g);
      
      return (
        <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
          {inlineParts.map((subPart, subIdx) => {
            if (subPart.startsWith('`') && subPart.endsWith('`')) {
              return (
                <code key={subIdx} style={{ 
                  background: 'rgba(255,255,255,0.12)', 
                  color: '#f43f5e', 
                  padding: '0.2rem 0.4rem', 
                  borderRadius: '4px', 
                  fontSize: '0.9em',
                  fontFamily: 'monospace'
                }}>
                  {subPart.slice(1, -1)}
                </code>
              );
            } else {
              const boldParts = subPart.split(/(\*\*[^*]+\*\*)/g);
              return boldParts.map((bPart, bIdx) => {
                if (bPart.startsWith('**') && bPart.endsWith('**')) {
                  return <strong key={bIdx} style={{ color: '#fff', fontWeight: 'bold' }}>{bPart.slice(2, -2)}</strong>;
                }
                
                const italicParts = bPart.split(/(\*[^*]+\*)/g);
                return italicParts.map((iPart, iIdx) => {
                  if (iPart.startsWith('*') && iPart.endsWith('*')) {
                    return <em key={iIdx} style={{ fontStyle: 'italic', color: '#cbd5e1' }}>{iPart.slice(1, -1)}</em>;
                  }
                  return iPart;
                });
              });
            }
          })}
        </span>
      );
    }
  });
}

export default function ChatbotPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check Authentication
    const token = localStorage.getItem('accessToken');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!token || !isLoggedIn) {
      router.push('/login');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://learnnov-api.onrender.com';
    // Fetch message history from database
    fetch(`${apiUrl}/api/ai/chat/history/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Could not load history");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data.map((msg: any, idx: number) => ({
            id: `hist-${idx}`,
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })));
        } else {
          setMessages([
            { id: 'welcome', role: 'assistant', content: 'أهلاً بك! أنا مساعد ليرنوف الأكاديمي. كيف يمكنني مساعدتك في دراستك اليوم؟' }
          ]);
        }
      })
      .catch(() => {
        setMessages([
          { id: 'welcome', role: 'assistant', content: 'أهلاً بك! أنا مساعد ليرنوف الأكاديمي. كيف يمكنني مساعدتك في دراستك اليوم؟' }
        ]);
      });
  }, [router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://learnnov-api.onrender.com';
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${apiUrl}/api/ai/chat/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg.content })
      });
      const data = await res.json();
      
      const assistantMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.reply || data.error 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'عذراً، حدث خطأ في الاتصال بالخادم.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="dashboard-container" dir="rtl" style={{ height: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '2rem' }}>
      {/* Navigation bar Header */}
      <header className="glass-panel main-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="profile-avatar logo-avatar" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>🎓</div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }} className="text-gradient">منصة ليرنوف الأكاديمية</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>المساعد التعليمي الذكي</p>
          </div>
        </div>
        <nav className="nav-links">
          <Link href="/" className="nav-link">لوحة الطالب</Link>
          <Link href="/discussions" className="nav-link">المناقشات</Link>
          <Link href="/exams" className="nav-link">الاختبارات</Link>
          <Link href="/certificates" className="nav-link">الشهادات</Link>
          <Link href="/payments" className="nav-link">المدفوعات</Link>
          <Link href="/chat" className="nav-link active">المساعد الذكي</Link>
          <Link href="/login" className="nav-link logout-btn">خروج</Link>
        </nav>
      </header>

      <div className="glass-panel profile-header" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
        <div className="profile-avatar" style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}>🤖</div>
        <div className="profile-info">
          <h1 style={{ fontSize: '1.8rem' }}>المساعد <span className="text-gradient">الأكاديمي الذكي</span></h1>
          <p style={{ fontSize: '0.9rem' }}>متصل - مدعوم بـ OpenAI</p>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-start' : 'flex-end',
              backgroundColor: msg.role === 'user' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid',
              borderColor: msg.role === 'user' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)',
              padding: '1rem 1.5rem',
              borderRadius: '16px',
              borderBottomRightRadius: msg.role === 'user' ? '0' : '16px',
              borderBottomLeftRadius: msg.role === 'assistant' ? '0' : '16px',
              maxWidth: '80%',
              lineHeight: 1.6
            }}>
              {renderMessageContent(msg.content)}
            </div>
          ))}
          {isTyping && (
            <div style={{ 
              alignSelf: 'flex-end', 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1rem 1.5rem', 
              borderRadius: '16px', 
              borderBottomLeftRadius: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span className="dot" style={{ animationDelay: '0s' }}></span>
              <span className="dot" style={{ animationDelay: '0.2s' }}></span>
              <span className="dot" style={{ animationDelay: '0.4s' }}></span>
            </div>
          )}
          <div ref={endRef} />
        </div>
        
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.2)' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="اسأل المساعد الأكاديمي..."
            style={{ 
              flex: 1, 
              padding: '1rem 1.5rem', 
              borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.2)', 
              background: 'rgba(0,0,0,0.5)', 
              color: 'white',
              fontSize: '1rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button 
            onClick={sendMessage}
            disabled={isTyping}
            style={{
              padding: '0 2rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
              color: 'white',
              fontWeight: 'bold',
              cursor: isTyping ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontFamily: 'inherit',
              transition: 'opacity 0.3s'
            }}
          >
            إرسال
          </button>
        </div>
      </div>

      <style jsx global>{`
        .main-header {
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nav-links {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }
        .nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.3s;
        }
        .nav-link:hover, .nav-link.active {
          color: #fff;
          background: rgba(59, 130, 246, 0.15);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
        }
        .logo-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logout-btn {
          color: #f87171 !important;
          background: rgba(239, 68, 68, 0.08) !important;
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2) !important;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.2) !important;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .dot {
          width: 8px;
          height: 8px;
          background-color: #3b82f6;
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.2s infinite ease-in-out;
        }
      `}</style>
    </main>
  );
}
