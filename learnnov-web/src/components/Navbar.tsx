'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { isLoggedIn, userRole, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If not logged in or on login page, don't show the navigation bar
  if (!isLoggedIn || pathname === '/login') {
    return null;
  }

  const navLinks = [
    { name: t('navDashboard'), href: '/' },
    { name: t('navSpecializations'), href: '/specializations' },
    { name: t('navDiscussions'), href: '/discussions' },
    { name: t('navExams'), href: '/exams' },
    { name: t('navCertificates'), href: '/certificates' },
    { name: t('navPayments'), href: '/payments' },
    { name: t('navChat'), href: '/chat' },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="glass-panel main-header-shared">
      <div className="header-brand">
        <div className="profile-avatar logo-avatar-shared">🎓</div>
        <div>
          <h2 className="header-title-shared text-gradient">{t('platformTitle')}</h2>
          <p className="header-subtitle-shared">{t('platformSubtitle')}</p>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="desktop-nav">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link-shared ${isActive ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          );
        })}
        {userRole === 'instructor' && (
          <Link
            href="/instructor"
            className={`nav-link-shared ${pathname === '/instructor' ? 'active' : ''}`}
          >
            {t('navInstructor')}
          </Link>
        )}
        <button onClick={toggleLanguage} className="nav-link-shared lang-switch-btn-shared">
          {t('langSwitchLabel')}
        </button>
        <button onClick={logout} className="nav-link-shared logout-btn-shared">
          {t('logout')}
        </button>
      </nav>

      {/* Mobile Hamburger Button */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle Menu"
      >
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
      </button>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'show' : ''}`}>
        <nav className="mobile-nav-links">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            );
          })}
          {userRole === 'instructor' && (
            <Link
              href="/instructor"
              className={`mobile-nav-link ${pathname === '/instructor' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('navInstructor')}
            </Link>
          )}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              toggleLanguage();
            }}
            className="mobile-nav-link mobile-lang-switch-btn"
          >
            {t('langSwitchLabel')}
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="mobile-nav-link mobile-logout-btn"
          >
            {t('logout')}
          </button>
        </nav>
      </div>

      <style jsx global>{`
        .main-header-shared {
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.7);
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .logo-avatar-shared {
          width: 40px;
          height: 40px;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(14, 165, 233, 0.05);
          border: 1px solid rgba(14, 165, 233, 0.15);
        }
        .header-title-shared {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0;
        }
        .header-subtitle-shared {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }
        .desktop-nav {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .nav-link-shared {
          color: #64748b;
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          font-size: 0.95rem;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .nav-link-shared:hover, .nav-link-shared.active {
          color: var(--accent);
          background: rgba(14, 165, 233, 0.08);
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.1);
        }
        .lang-switch-btn-shared {
          color: var(--accent) !important;
          background: rgba(14, 165, 233, 0.06) !important;
        }
        .lang-switch-btn-shared:hover {
          background: rgba(14, 165, 233, 0.12) !important;
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.15) !important;
        }
        .logout-btn-shared {
          color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.06) !important;
        }
        .logout-btn-shared:hover {
          background: rgba(239, 68, 68, 0.15) !important;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.15) !important;
        }

        /* Mobile Styles */
        .mobile-menu-toggle {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 24px;
          height: 18px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 1001;
        }
        .hamburger-bar {
          width: 100%;
          height: 2px;
          background-color: #64748b;
          transition: all 0.3s ease;
        }
        .hamburger-bar.open:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
        }
        .hamburger-bar.open:nth-child(2) {
          opacity: 0;
        }
        .hamburger-bar.open:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg);
        }

        .mobile-nav-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(20px);
          z-index: 999;
          transform: translateY(-100%);
          transition: transform 0.4s ease-in-out;
        }
        .mobile-nav-overlay.show {
          transform: translateY(0);
        }
        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 1.5rem;
          padding: 2rem;
        }
        .mobile-nav-link {
          color: #475569;
          text-decoration: none;
          font-size: 1.3rem;
          font-weight: 600;
          transition: color 0.3s;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          color: var(--accent);
        }
        .mobile-lang-switch-btn {
          color: var(--accent) !important;
          margin-top: 1rem;
        }
        .mobile-logout-btn {
          color: #ef4444 !important;
          margin-top: 1rem;
        }

        @media (max-width: 1024px) {
          .desktop-nav {
            display: none;
          }
          .mobile-menu-toggle {
            display: flex;
          }
          .mobile-nav-overlay {
            display: block;
          }
        }
      `}</style>
    </header>
  );
};
