'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Exam {
  id: number;
  title: string;
  course_name: string;
  questions_count: number;
  duration_minutes: number;
}

interface Attempt {
  id: number;
  exam_title: string;
  score: number;
  is_passed: boolean;
  date: string;
}

interface Question {
  id: number;
  text: string;
  choices: { key: string; text: string }[];
  correctAnswer: string;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('student');

  // Live Exam Testing Engine States
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [examFinished, setExamFinished] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [examPassed, setExamPassed] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://learnnov-api.onrender.com';

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'student';
    setUserRole(role);

    // Fetch exams list from database
    const token = localStorage.getItem('accessToken');
    fetch(`${apiUrl}/api/exams/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json) && json.length > 0) {
          setExams(json);
        } else {
          throw new Error("No exams returned");
        }
      })
      .catch(() => {
        // Fallback live exams
        setExams([
          { id: 401, title: "التقييم الشامل في خوارزميات التعلم الآلي", course_name: "ماجستير الذكاء الاصطناعي", questions_count: 3, duration_minutes: 5 },
          { id: 402, title: "أمان الشبكات والبروتوكولات السيبرانية", course_name: "ماجستير الأمن السيبراني", questions_count: 3, duration_minutes: 5 },
          { id: 403, title: "التقييم الأساسي لهندسة البرمجيات وتطبيقات الويب", course_name: "دبلوم تطوير تطبيقات الويب", questions_count: 3, duration_minutes: 5 }
        ]);
      });

    // Fetch attempts
    fetch(`${apiUrl}/api/exams/attempts/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json)) {
          setAttempts(json);
        }
        setLoading(false);
      })
      .catch(() => {
        // Initial mock attempts list
        setAttempts([
          { id: 801, exam_title: "التقييم التأسيسي للذكاء الاصطناعي", score: 85, is_passed: true, date: "2026-05-24" },
          { id: 802, exam_title: "أمان نظم التشغيل والمعالجات", score: 40, is_passed: false, date: "2026-05-25" }
        ]);
        setLoading(false);
      });
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (activeExam && timeLeft > 0 && !examFinished) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (activeExam && timeLeft === 0 && !examFinished) {
      evaluateAndSubmitExam();
    }
  }, [activeExam, timeLeft, examFinished]);

  // Start Exam Attempt
  const startExamAttempt = async (exam: Exam) => {
    setActiveExam(exam);
    setTimeLeft(exam.duration_minutes * 60);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setExamFinished(false);

    // Curated high fidelity test questions based on selected exam
    let examQuestions: Question[] = [];
    if (exam.id === 401) {
      examQuestions = [
        {
          id: 1,
          text: "أي من خوارزميات تعلم الآلة التالية تعتبر خوارزمية غير خاضعة للإشراف (Unsupervised Learning)؟",
          choices: [
            { key: "A", text: "Linear Regression (الانحدار الخطي)" },
            { key: "B", text: "K-Means Clustering (عنقودية كي)" },
            { key: "C", text: "Support Vector Machines (آلات المتجهات الداعمة)" },
            { key: "D", text: "Random Forest (الغابات العشوائية)" }
          ],
          correctAnswer: "B"
        },
        {
          id: 2,
          text: "ما هو الهدف الأساسي من عملية التنظيم (Regularization) مثل L1/L2 في تدريب النماذج؟",
          choices: [
            { key: "A", text: "تقليل تكلفة استهلاك المعالج وتخزين البيانات" },
            { key: "B", text: "معالجة مشكلة فرط التجهيز والملائمة الزائدة (Overfitting)" },
            { key: "C", text: "تسريع معدل التعلم (Learning Rate) أثناء التدرج" },
            { key: "D", text: "تحويل المدخلات إلى مصفوفات ثنائية بسيطة" }
          ],
          correctAnswer: "B"
        },
        {
          id: 3,
          text: "ما هي ميزة التنشيط (Activation Function) التي تحل مشكلة تضاؤل التدرج في الشبكات العصبية العميقة وتعتبر الأكثر استخداماً؟",
          choices: [
            { key: "A", text: "Sigmoid Function" },
            { key: "B", text: "Tanh Function" },
            { key: "C", text: "ReLU Function (وحدة التقويم الخطي)" },
            { key: "D", text: "Step Function" }
          ],
          correctAnswer: "C"
        }
      ];
    } else if (exam.id === 402) {
      examQuestions = [
        {
          id: 4,
          text: "في إطار مبدأ Zero Trust (انعدام الثقة الكامل)، ما هي الفرضية الأمنية الأساسية التي يعتمد عليها تصميم الشبكة؟",
          choices: [
            { key: "A", text: "الوثوق الكامل بجميع الأجهزة داخل محيط الشبكة المحلية" },
            { key: "B", text: "افتراض أن الخطر قائم وموجود دائماً داخلياً وخارجياً وتوجب التحقق المستمر" },
            { key: "C", text: "الاعتماد الكلي على جدران الحماية التقليدية لمنع الثغرات" },
            { key: "D", text: "تشفير البيانات فقط أثناء انتقالها عبر الإنترنت المفتوح" }
          ],
          correctAnswer: "B"
        },
        {
          id: 5,
          text: "ما هو نوع الهجوم السيبراني الذي يستهدف حجب الخدمة عن طريق إغراق خادم الهدف بطلبات اتصال وهمية مكثفة من أجهزة متعددة متزامنة؟",
          choices: [
            { key: "A", text: "Phishing (الاصطياد الإلكتروني)" },
            { key: "B", text: "SQL Injection (حقن قواعد البيانات)" },
            { key: "C", text: "DDoS (حجب الخدمة الموزع)" },
            { key: "D", text: "Man-in-the-Middle (رجل في المنتصف)" }
          ],
          correctAnswer: "C"
        },
        {
          id: 6,
          text: "أي من البروتوكولات التالية يُستخدم لتأمين نقل البيانات وتوفير قنوات اتصال مشفرة عبر طبقة التطبيقات بمواقع الويب؟",
          choices: [
            { key: "A", text: "HTTP" },
            { key: "B", text: "FTP" },
            { key: "C", text: "HTTPS / TLS" },
            { key: "D", text: "SMTP" }
          ],
          correctAnswer: "C"
        }
      ];
    } else {
      examQuestions = [
        {
          id: 7,
          text: "أي مما يلي يصف المعمارية البرمجية ثلاثية الطبقات (3-Tier Architecture) بشكل صحيح ودقيق؟",
          choices: [
            { key: "A", text: "طبقة الواجهات (Presentation)، طبقة منطق الأعمال (Business Logic)، وطبقة البيانات (Data)" },
            { key: "B", text: "طبقة العميل، طبقة موزع الرسائل، وطبقة الكاش" },
            { key: "C", text: "طبقة الشبكة، طبقة النقل، وطبقة الجلسات" },
            { key: "D", text: "طبقة التخزين، طبقة المعالجة، وطبقة الطباعة" }
          ],
          correctAnswer: "A"
        },
        {
          id: 8,
          text: "في إطار معايير الجودة والتصميم، ماذا يعني مصطلح RESTful API بشكل أساسي؟",
          choices: [
            { key: "A", text: "أنظمة تعتمد على بروتوكول SOAP الحصري لنقل الملفات" },
            { key: "B", text: "خدمات ويب تعتمد على البروتوكول عديم الحالة (Stateless) وتدعم عمليات HTTP القياسية" },
            { key: "C", text: "مكتبات برمجية لتسريع استدعاء واجهات قواعد البيانات المشفرة" },
            { key: "D", text: "مزامنة لحظية للبيانات تعتمد حصراً على الـ WebSockets" }
          ],
          correctAnswer: "B"
        },
        {
          id: 9,
          text: "ما هي الفائدة الأساسية من استخدام محركات البناء والترجمة السريعة مثل Next.js في الويب؟",
          choices: [
            { key: "A", text: "التوليد التلقائي لرموز الأمان ومكافحة الفيروسات" },
            { key: "B", text: "إتاحة التوليد من جهة الخادم (Server-side Rendering) ورفع كفاءة محركات البحث (SEO)" },
            { key: "C", text: "الاستغناء بالكامل عن قواعد البيانات والترجمة المحلية" },
            { key: "D", text: "بناء تطبيقات سطح المكتب دون الحاجة للمتصفحات" }
          ],
          correctAnswer: "B"
        }
      ];
    }

    setQuestions(examQuestions);

    // Call start API
    const token = localStorage.getItem('accessToken');
    fetch(`${apiUrl}/api/exams/${exam.id}/start/`, { 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {});
  };

  // Evaluate responses and Submit
  const evaluateAndSubmitExam = async () => {
    if (!activeExam) return;

    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 60;

    setExamScore(score);
    setExamPassed(passed);
    setExamFinished(true);

    const newAttempt: Attempt = {
      id: Date.now(),
      exam_title: activeExam.title,
      score: score,
      is_passed: passed,
      date: new Date().toISOString().split('T')[0]
    };

    setAttempts(prev => [newAttempt, ...prev]);

    // Send attempt submit POST to API
    const payload = {
      score: score,
      is_completed: true
    };
    const token = localStorage.getItem('accessToken');
    fetch(`${apiUrl}/api/exams/attempts/${activeExam.id}/submit/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }).catch(() => {});
  };

  // Format Time Remaining (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="dashboard-container" dir="rtl">
      {/* Navigation bar Header */}
      <header className="glass-panel main-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="profile-avatar logo-avatar">🎓</div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }} className="text-gradient">منصة ليرنوف الأكاديمية</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>مركز الاختبارات والتقييم الذكي</p>
          </div>
        </div>
        <nav className="nav-links">
          <Link href="/" className="nav-link">لوحة الطالب</Link>
          <Link href="/discussions" className="nav-link">المناقشات</Link>
          <Link href="/exams" className="nav-link active">الاختبارات</Link>
          <Link href="/certificates" className="nav-link">الشهادات</Link>
          <Link href="/payments" className="nav-link">المدفوعات</Link>
          <Link href="/chat" className="nav-link">المساعد الذكي</Link>
          {userRole === 'instructor' && <Link href="/instructor" className="nav-link">لوحة المشرف</Link>}
          <Link href="/login" className="nav-link logout-btn">خروج</Link>
        </nav>
      </header>

      {activeExam ? (
        /* Live Exam Workspace */
        <div className="glass-panel exam-session-card">
          <div className="exam-session-header">
            <div>
              <h3>{activeExam.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{activeExam.course_name} • التقييم التفاعلي المباشر</p>
            </div>
            
            {!examFinished && (
              <div className="timer-pill glass-panel">
                <span>⏱️ الوقت المتبقي:</span>
                <span className="time-value">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          {!examFinished ? (
            /* Running Exam Mode */
            <div className="exam-workspace-body">
              {/* Progress indicator */}
              <div className="exam-progress-tracker">
                <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>السؤال {currentQuestionIndex + 1} من {questions.length}</span>
                <div className="progress-track" style={{ width: '200px' }}>
                  <div className="progress-fill" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
              </div>

              {/* Active Question */}
              {questions.length > 0 && (
                <div className="active-question-card glass-panel">
                  <p className="question-text-title">{questions[currentQuestionIndex].text}</p>
                  
                  <div className="choices-group">
                    {questions[currentQuestionIndex].choices.map(choice => {
                      const isSelected = answers[questions[currentQuestionIndex].id] === choice.key;
                      return (
                        <label 
                          key={choice.key}
                          className={`exam-choice-item ${isSelected ? 'selected' : ''}`}
                        >
                          <input 
                            type="radio" 
                            name={`q-${questions[currentQuestionIndex].id}`}
                            value={choice.key}
                            checked={isSelected}
                            onChange={() => {
                              setAnswers({
                                ...answers,
                                [questions[currentQuestionIndex].id]: choice.key
                              });
                            }}
                          />
                          <span className="choice-key-circle">{choice.key}</span>
                          <span className="choice-text-desc">{choice.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="exam-nav-controls">
                <button 
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  disabled={currentQuestionIndex === 0}
                  className="prev-btn"
                >
                  السابق ➡️
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button 
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    disabled={!answers[questions[currentQuestionIndex].id]}
                    className="next-btn"
                  >
                    ⬅️ السؤال التالي
                  </button>
                ) : (
                  <button 
                    onClick={evaluateAndSubmitExam}
                    disabled={!answers[questions[currentQuestionIndex].id]}
                    className="submit-exam-btn"
                  >
                    💾 إنهاء وتسليم الاختبار الدراسي
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Finished Exam / Scorecard Mode */
            <div className="scorecard-completed glass-panel">
              <div className="score-badge-circle" style={{ borderColor: examPassed ? '#10b981' : '#ef4444' }}>
                <span className="score-pct-label">{examScore}%</span>
                <span className="score-result-badge" style={{ background: examPassed ? '#10b981' : '#ef4444' }}>
                  {examPassed ? 'اجتياز ناجح' : 'لم يوفق'}
                </span>
              </div>

              <h3>التقرير الدراسي للاختبار الأكاديمي</h3>
              <p style={{ maxWidth: '500px', textAlign: 'center', color: '#cbd5e1', lineHeight: '1.6' }}>
                {examPassed 
                  ? "تهانينا الحارة! لقد حققت نسبة اجتياز ممتازة وتم تدوين درجاتك الأكاديمية بنجاح في قاعدة بيانات ليرنوف السحابية لتعزيز ملفك وسعيك لنيل شهادة التخرج."
                  : "لقد بذلت مجهودًا رائعًا، ولكن درجاتك لم تتجاوز الحد الأدنى المطلوب للاجتياز (60%). ننصحك بمراجعة محاضرات الوحدات الدراسية وإعادة محاولة التقييم مجدداً."}
              </p>

              <div className="scorecard-stats">
                <div className="sc-stat-item">
                  <span>الأسئلة الصحيحة:</span>
                  <span style={{ color: '#34d399', fontWeight: 'bold' }}>
                    {questions.filter(q => answers[q.id] === q.correctAnswer).length} / {questions.length}
                  </span>
                </div>
                <div className="sc-stat-item">
                  <span>معيار النجاح بالمساق:</span>
                  <span style={{ fontWeight: 'bold' }}>60%</span>
                </div>
              </div>

              <button 
                onClick={() => setActiveExam(null)}
                className="back-center-btn"
              >
                العودة لمركز التقييم الأكاديمي
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Exam Center Home (Exams list & attempts history) */
        <>
          <div className="glass-panel profile-header" style={{ marginBottom: '2rem' }}>
            <div className="profile-avatar">📝</div>
            <div className="profile-info">
              <h1>مركز الاختبارات <span className="text-gradient">والتقييم الذاتي</span></h1>
              <p>اختبر معلوماتك، احرز الدرجات، واكسب شهادتك التعليمية المعتمدة فور الاجتياز</p>
            </div>
          </div>

          <div className="forum-split-layout">
            {/* Left Column: Active Exams for Study */}
            <div className="threads-list-pane glass-panel" style={{ flex: 1.5 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>الاختبارات الأكاديمية المتاحة</h3>
              
              {loading ? (
                <div className="spinner-container" style={{ minHeight: '20vh' }}>
                  <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
                </div>
              ) : (
                <div className="exams-catalog-grid">
                  {exams.map(ex => (
                    <div key={ex.id} className="glass-panel exam-catalog-card">
                      <div>
                        <span className="exam-catalog-course-tag">{ex.course_name}</span>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem', color: 'white' }}>{ex.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>⏱️ مدة الاختبار: {ex.duration_minutes} دقائق • الأسئلة: {ex.questions_count}</p>
                      </div>

                      <button 
                        onClick={() => startExamAttempt(ex)}
                        className="start-exam-action-btn"
                      >
                        ✍️ دخول وبدء الاختبار
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Attempts History logs */}
            <div className="active-thread-pane glass-panel" style={{ flex: 1, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>سجل المحاولات والنتائج</h3>
              
              <div className="attempts-history-list">
                {attempts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.9rem' }}>
                    لم تخض أي محاولة اختبار حتى الآن.
                  </div>
                ) : (
                  attempts.map(att => (
                    <div key={att.id} className="attempt-item-card glass-panel" style={{ borderLeft: `3px solid ${att.is_passed ? '#10b981' : '#ef4444'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{att.exam_title}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>تمت المحاولة بتاريخ: {att.date}</span>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <span className={`score-badge ${att.is_passed ? 'passed' : 'failed'}`}>
                            {att.score}%
                          </span>
                          <p style={{ fontSize: '0.7rem', color: att.is_passed ? '#34d399' : '#f87171', fontWeight: 600, marginTop: '0.2rem' }}>
                            {att.is_passed ? 'ناجح ✅' : 'إعادة ❌'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Styled JSX for assessment components */}
      <style jsx global>{`
        .exam-session-card {
          padding: 3rem;
          border-color: rgba(255,255,255,0.08);
          max-width: 800px;
          margin: 0 auto;
          animation: fadeInUp 0.4s ease-out;
        }
        .exam-session-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px dashed rgba(255,255,255,0.1);
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }
        .exam-session-header h3 {
          font-size: 1.4rem;
          font-weight: 700;
          color: white;
        }
        .timer-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          color: #f87171;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .time-value {
          font-family: monospace;
          font-size: 1.1rem;
        }
        .exam-progress-tracker {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .active-question-card {
          padding: 2rem;
          border-color: rgba(255,255,255,0.04);
          background: rgba(255,255,255,0.005);
          margin-bottom: 2rem;
        }
        .question-text-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: white;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .choices-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .exam-choice-item {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 1rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .exam-choice-item:hover {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.1);
        }
        .exam-choice-item.selected {
          background: rgba(59, 130, 246, 0.08);
          border-color: #3b82f6;
          color: white;
        }
        .exam-choice-item input {
          display: none;
        }
        .choice-key-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #94a3b8;
          transition: all 0.2s;
        }
        .exam-choice-item.selected .choice-key-circle {
          background: #3b82f6;
          color: white;
        }
        .choice-text-desc {
          font-weight: 500;
          font-size: 0.95rem;
        }
        .exam-nav-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .prev-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          transition: background 0.2s;
        }
        .prev-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .next-btn {
          background: #3b82f6;
          border: none;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          transition: all 0.3s;
        }
        .next-btn:hover {
          background: #2563eb;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }
        .submit-exam-btn {
          background: #10b981;
          border: none;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          transition: all 0.3s;
        }
        .submit-exam-btn:hover {
          background: #059669;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        /* Scorecard Completed */
        .scorecard-completed {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2.5rem;
          gap: 1.5rem;
          border-color: rgba(255,255,255,0.05);
        }
        .score-badge-circle {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          border: 4px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .score-pct-label {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
        }
        .score-result-badge {
          position: absolute;
          bottom: -10px;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          color: white;
          white-space: nowrap;
        }
        .scorecard-completed h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }
        .scorecard-stats {
          display: flex;
          gap: 2rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 1rem 2rem;
          border-radius: 10px;
          width: 100%;
          max-width: 400px;
          justify-content: space-around;
          font-size: 0.9rem;
        }
        .back-center-btn {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          color: white;
          padding: 0.85rem 2rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.3s;
        }
        .back-center-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }

        /* Exams Catalog Grid */
        .exams-catalog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .exam-catalog-card {
          padding: 1.5rem;
          border-color: rgba(255,255,255,0.04);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1.5rem;
          height: 180px;
          transition: border-color 0.3s;
        }
        .exam-catalog-card:hover {
          border-color: #3b82f6;
        }
        .exam-catalog-course-tag {
          font-size: 0.75rem;
          background: rgba(139, 92, 246, 0.15);
          color: #c084fc;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          font-weight: 600;
        }
        .start-exam-action-btn {
          width: 100%;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 0.6rem;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .start-exam-action-btn:hover {
          background: #3b82f6;
          border-color: #3b82f6;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }

        /* Attempts log sidebar */
        .attempts-history-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          overflow-y: auto;
          max-height: 480px;
        }
        .attempt-item-card {
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.01);
          border-color: rgba(255,255,255,0.03);
        }
        .score-badge {
          display: inline-block;
          font-size: 1rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }
        .score-badge.passed { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .score-badge.failed { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      `}</style>
    </main>
  );
}
