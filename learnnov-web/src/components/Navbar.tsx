'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  LayoutDashboard, 
  GraduationCap, 
  BookOpen, 
  Video, 
  FolderOpen, 
  Code, 
  FileText,
  Briefcase,
  Award,
  CreditCard,
  MonitorPlay,
  Compass,
  MessageCircle,
  MessageSquare,
  Bot,
  LifeBuoy,
  UserCircle,
  User,
  Bell,
  BarChart3,
  Trophy,
  Settings,
  Presentation,
  ChevronDown,
  LogOut,
  Globe,
  LogIn,
  UserPlus
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { isLoggedIn, userRole, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // If on login page, or inside admin/instructor dashboards (which have their own dedicated sidebars), don't show the global navbar
  if (pathname === '/login' || pathname.startsWith('/admin') || pathname.startsWith('/instructor')) {
    return null;
  }

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  // Nav items when logged in
  const loggedInNavGroups = [
    {
      title: t('navDashboard'),
      icon: <LayoutDashboard size={18} />,
      isSingle: true,
      href: '/'
    },
    {
      title: language === 'ar' ? 'التعلم' : 'Learning',
      icon: <GraduationCap size={18} />,
      items: [
        { name: t('navSpecializations'), href: '/specializations', icon: <BookOpen size={16} />, desc: language === 'ar' ? 'استكشف مسارات التعلم' : 'Explore paths' },
        { name: language === 'ar' ? 'الفصول المباشرة' : 'Live Classes', href: '/live', icon: <Video size={16} />, desc: language === 'ar' ? 'جلسات تفاعلية حية' : 'Interactive sessions' },
        { name: language === 'ar' ? 'المشاريع والواجبات' : 'Projects & Assignments', href: '/assignments', icon: <FolderOpen size={16} />, desc: language === 'ar' ? 'تطبيقات عملية' : 'Practical tasks' },
        { name: language === 'ar' ? 'المختبرات البرمجية' : 'Interactive Labs', href: '/labs', icon: <Code size={16} />, desc: language === 'ar' ? 'تدريب عملي على الكود' : 'Hands-on coding' },
        { name: t('navExams'), href: '/exams', icon: <FileText size={16} />, desc: language === 'ar' ? 'اختبارات التقييم' : 'Assessment tests' },
      ]
    },
    {
      title: language === 'ar' ? 'الخدمات' : 'Services',
      icon: <Briefcase size={18} />,
      items: [
        { name: t('navCertificates'), href: '/certificates', icon: <Award size={16} />, desc: language === 'ar' ? 'شهادات الإنجاز' : 'Achievement certs' },
        { name: t('navPayments'), href: '/payments', icon: <CreditCard size={16} />, desc: language === 'ar' ? 'إدارة الاشتراكات' : 'Manage subscriptions' },
        { name: language === 'ar' ? 'مساحة العمل' : 'Workspace', href: '/workspace', icon: <MonitorPlay size={16} />, desc: language === 'ar' ? 'يوتيوب و أدوات جوجل' : 'YouTube & Google' },
        { name: language === 'ar' ? 'التوجيه المهني' : 'Career Guidance', href: '/career', icon: <Compass size={16} />, desc: language === 'ar' ? 'مساعدة في بناء مسارك' : 'Build your path' },
      ]
    },
    {
      title: language === 'ar' ? 'التواصل' : 'Connect',
      icon: <MessageCircle size={18} />,
      items: [
        { name: t('navDiscussions'), href: '/discussions', icon: <MessageSquare size={16} />, desc: language === 'ar' ? 'مجتمع المتعلمين' : 'Learners community' },
        { name: t('navChat'), href: '/chat', icon: <Bot size={16} />, desc: language === 'ar' ? 'المساعد الذكي' : 'AI Assistant' },
        { name: language === 'ar' ? 'مركز الدعم' : 'Help Center', href: '/support', icon: <LifeBuoy size={16} />, desc: language === 'ar' ? 'نحن هنا لمساعدتك' : 'We are here to help' },
      ]
    },
    {
      title: language === 'ar' ? 'حسابي' : 'My Account',
      icon: <UserCircle size={18} />,
      items: [
        { name: language === 'ar' ? 'الملف الشخصي' : 'Profile', href: '/profile', icon: <User size={16} />, desc: language === 'ar' ? 'تعديل بياناتك' : 'Edit your data' },
        { name: language === 'ar' ? 'الإشعارات' : 'Notifications', href: '/notifications', icon: <Bell size={16} />, desc: language === 'ar' ? 'التنبيهات والرسائل' : 'Alerts & messages' },
        { name: language === 'ar' ? 'تحليلات الأداء' : 'Analytics', href: '/analytics', icon: <BarChart3 size={16} />, desc: language === 'ar' ? 'متابعة تقدمك' : 'Track progress' },
        { name: language === 'ar' ? 'لوحة المتفوقين' : 'Leaderboard', href: '/leaderboard', icon: <Trophy size={16} />, desc: language === 'ar' ? 'قائمة الأوائل' : 'Top students' },
        ...(userRole === 'admin' ? [{ name: language === 'ar' ? 'لوحة التحكم' : 'Admin Panel', href: '/admin', icon: <Settings size={16} />, desc: language === 'ar' ? 'إدارة المنصة' : 'Platform management' }] : []),
        ...(userRole === 'instructor' ? [{ name: t('navInstructor'), href: '/instructor', icon: <Presentation size={16} />, desc: language === 'ar' ? 'لوحة المعلم' : 'Instructor dashboard' }] : [])
      ]
    }
  ];

  // Nav items when public / visitor
  const publicNavGroups = [
    {
      title: language === 'ar' ? 'الرئيسية' : 'Home',
      icon: <LayoutDashboard size={18} />,
      isSingle: true,
      href: '/'
    },
    {
      title: language === 'ar' ? 'المسارات والتخصصات' : 'Specializations',
      icon: <BookOpen size={18} />,
      isSingle: true,
      href: '/specializations'
    },
    {
      title: language === 'ar' ? 'الشهادات المعتمدة' : 'Certificates',
      icon: <Award size={18} />,
      isSingle: true,
      href: '/certificates'
    },
    {
      title: language === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard',
      icon: <Trophy size={18} />,
      isSingle: true,
      href: '/leaderboard'
    },
    {
      title: language === 'ar' ? 'الفصول المباشرة' : 'Live Classes',
      icon: <Video size={18} />,
      isSingle: true,
      href: '/live'
    },
    {
      title: language === 'ar' ? 'مركز الدعم' : 'Support',
      icon: <LifeBuoy size={18} />,
      isSingle: true,
      href: '/support'
    }
  ];

  const navGroups = isLoggedIn ? loggedInNavGroups : publicNavGroups;

  let timeoutId: NodeJS.Timeout;

  const handleMouseEnter = (title: string) => {
    clearTimeout(timeoutId);
    setActiveDropdown(title);
  };

  const handleMouseLeave = () => {
    timeoutId = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  return (
    <header className="premium-navbar glass-panel">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="nav-brand">
          <Link href="/" className="logo-link">
            <div className="logo-icon-wrapper">
              <img src="/logo.png" alt="Learnnov Logo" />
            </div>
            <div className="logo-text">
              <h2 className="text-gradient">{t('platformTitle')}</h2>
              <p>{t('platformSubtitle')}</p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul className="nav-list">
            {navGroups.map((group: any, index: number) => {
              if (group.isSingle) {
                const isActive = pathname === group.href;
                return (
                  <li key={`nav-group-${index}`} className="nav-item">
                    <Link href={group.href!} className={`nav-link ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon">{group.icon}</span>
                      <span className="nav-text">{group.title}</span>
                    </Link>
                  </li>
                );
              }

              const isActive = group.items?.some((item: any) => pathname === item.href);
              const isDropdownOpen = activeDropdown === group.title;

              return (
                <li 
                  key={`nav-group-${index}`} 
                  className="nav-item has-dropdown"
                  onMouseEnter={() => handleMouseEnter(group.title)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className={`nav-link ${isActive || isDropdownOpen ? 'active' : ''}`}>
                    <span className="nav-icon">{group.icon}</span>
                    <span className="nav-text">{group.title}</span>
                    <ChevronDown size={14} className={`dropdown-chevron ${isDropdownOpen ? 'rotated' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="dropdown-mega-menu">
                      <div className="dropdown-content">
                        {group.items?.map((item: any, idx: number) => (
                          <Link
                            key={`dropdown-item-${idx}`}
                            href={item.href}
                            className={`dropdown-mega-item ${pathname === item.href ? 'active' : ''}`}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <div className="item-icon">{item.icon}</div>
                            <div className="item-details">
                              <span className="item-title">{item.name}</span>
                              {item.desc && <span className="item-desc">{item.desc}</span>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Action Buttons */}
        <div className="nav-actions">
          <button 
            onClick={toggleLanguage} 
            className="action-btn lang-btn" 
            title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
          >
            <Globe size={18} />
            <span className="btn-text">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {isLoggedIn ? (
            <button 
              onClick={logout} 
              className="action-btn logout-btn" 
              title={t('logout')}
            >
              <LogOut size={18} />
              <span className="btn-text">{t('logout')}</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link 
                href="/login" 
                className="action-btn login-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.2)', color: '#FFF', padding: '0.5rem 1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}
              >
                <LogIn size={16} />
                <span>{language === 'ar' ? 'دخول' : 'Login'}</span>
              </Link>
              <Link 
                href="/login" 
                className="action-btn register-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#2563eb', color: '#FFF', padding: '0.5rem 1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}
              >
                <UserPlus size={16} />
                <span>{language === 'ar' ? 'انضم الآن' : 'Join'}</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className={`mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <span className="hamburger-line line-1"></span>
            <span className="hamburger-line line-2"></span>
            <span className="hamburger-line line-3"></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-content">
          {navGroups.map((group: any, index: number) => {
            if (group.isSingle) {
              return (
                <Link
                  key={`mob-group-${index}`}
                  href={group.href!}
                  className={`mobile-menu-item ${pathname === group.href ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mob-icon">{group.icon}</span>
                  {group.title}
                </Link>
              );
            }

            return (
              <div key={`mob-group-${index}`} className="mobile-menu-group">
                <div className="mobile-group-header">
                  <span className="mob-icon">{group.icon}</span>
                  {group.title}
                </div>
                <div className="mobile-sub-items">
                  {group.items?.map((item: any, idx: number) => (
                    <Link
                      key={`mob-item-${idx}`}
                      href={item.href}
                      className={`mobile-sub-item ${pathname === item.href ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="mob-sub-icon">{item.icon}</span>
                      <div className="mob-sub-text">
                        <span className="title">{item.name}</span>
                        {item.desc && <span className="desc">{item.desc}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoped CSS for Premium Navbar */}
      <style jsx>{`
        .premium-navbar {
          position: sticky;
          top: 1rem;
          z-index: 1000;
          width: calc(100% - 2rem);
          max-width: 1280px;
          margin: 1rem auto 2rem auto;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          box-shadow: 0 10px 40px -10px rgba(16, 185, 129, 0.3);
          padding: 0.5rem 0;
          transition: all 0.3s ease;
        }

        .navbar-container {
          width: 100%;
          padding: 0 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        /* Brand / Logo */
        .nav-brand {
          flex-shrink: 0;
          min-width: max-content;
        }
        .logo-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }
        .logo-icon-wrapper {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(99, 102, 241, 0.1));
          border-radius: 12px;
          border: 1px solid rgba(14, 165, 233, 0.2);
          overflow: hidden;
          flex-shrink: 0;
        }
        .logo-icon-wrapper img {
          width: 32px;
          height: auto;
        }
        .logo-text h2 {
          font-size: 1.15rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          white-space: nowrap;
          color: #ffffff;
        }
        .logo-text p {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        /* Desktop Nav */
        .desktop-nav {
          flex-grow: 1;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .nav-list {
          display: flex;
          list-style: none;
          padding: 0;
          margin: 0;
          gap: 0.5rem;
          align-items: center;
        }
        .nav-item {
          position: relative;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 0.9rem;
          border-radius: 12px;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 700;
          text-decoration: none;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          font-family: inherit;
        }
        .nav-link:hover, .nav-link.active {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.2);
        }
        .nav-icon {
          display: flex;
          align-items: center;
          color: #ffffff;
          transition: color 0.2s ease;
        }
        .nav-link:hover .nav-icon, .nav-link.active .nav-icon {
          color: #ffffff;
        }
        .dropdown-chevron {
          transition: transform 0.2s ease;
          opacity: 0.7;
          margin-right: -2px;
        }
        .dropdown-chevron.rotated {
          transform: rotate(180deg);
        }

        /* Dropdown Mega Menu */
        .dropdown-mega-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 280px;
          background: #ffffff;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.15);
          padding: 0.75rem;
          z-index: 100;
          animation: dropdownFade 0.2s ease-out;
        }
        [dir="ltr"] .dropdown-mega-menu {
          right: auto;
          left: 0;
        }
        @keyframes dropdownFade {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dropdown-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .dropdown-mega-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.85rem;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .dropdown-mega-item:hover {
          background: #f1f5f9;
        }
        .dropdown-mega-item.active {
          background: rgba(37, 99, 235, 0.1);
        }
        .dropdown-mega-item .item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #f8fafc;
          color: #2563eb;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .dropdown-mega-item:hover .item-icon {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }
        .dropdown-mega-item.active .item-icon {
          background: #2563eb;
          color: #ffffff;
        }
        .item-details {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .item-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
        }
        .item-desc {
          font-size: 0.7rem;
          color: #64748b;
        }

        /* Action Buttons */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          height: 38px;
          padding: 0 0.85rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fee2e2;
        }

        /* Mobile Toggle */
        .mobile-toggle {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          padding: 0;
          gap: 4px;
        }
        .hamburger-line {
          width: 18px;
          height: 2px;
          background-color: #ffffff;
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        .mobile-toggle.active .line-1 {
          transform: translateY(6px) rotate(45deg);
        }
        .mobile-toggle.active .line-2 {
          opacity: 0;
        }
        .mobile-toggle.active .line-3 {
          transform: translateY(-6px) rotate(-45deg);
        }

        /* Mobile Drawer */
        .mobile-drawer {
          display: none;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .desktop-nav {
            display: none;
          }
          .mobile-toggle {
            display: flex;
          }
          .mobile-drawer {
            display: block;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 0.5rem;
            background: #ffffff;
            backdrop-filter: blur(24px);
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .mobile-drawer.open {
            max-height: 80vh;
            overflow-y: auto;
          }
          .mobile-drawer-content {
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .mobile-menu-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: 12px;
            color: #0f172a;
            font-weight: 700;
            text-decoration: none;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
          }
          .mobile-menu-item.active {
            background: rgba(37, 99, 235, 0.1);
            color: #2563eb;
            border-color: #2563eb;
          }
          .mobile-menu-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .mobile-group-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            font-weight: 800;
            color: #64748b;
            padding: 0 0.5rem;
          }
          .mobile-sub-items {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          }
          .mobile-sub-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem 0.85rem;
            border-radius: 10px;
            color: #0f172a;
            text-decoration: none;
            transition: background 0.2s;
          }
          .mobile-sub-item:hover, .mobile-sub-item.active {
            background: #f1f5f9;
          }
          .mob-sub-icon {
            color: #2563eb;
          }
          .mob-sub-text .title {
            display: block;
            font-size: 0.85rem;
            font-weight: 700;
          }
          .mob-sub-text .desc {
            display: block;
            font-size: 0.7rem;
            color: #64748b;
          }
        }
      `}</style>
    </header>
  );
};
