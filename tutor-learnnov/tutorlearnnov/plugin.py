"""
tutor-learnnov — Tutor plugin for the LearnNov Arabic eLearning Platform.

Bundles:
  - university_ads        (ad banners for partner universities)
  - learnnov_payments     (Stripe + HyperPay checkout)
  - learnnov_certificates (Arabic certificates with QR verification)
  - academic_programs     (program catalog, applications, providers)
  - program_ads           (targeted ad system with Redis caching)
"""
from __future__ import annotations

import os
from tutor import hooks

# ── Plugin identity ──────────────────────────────────────────────────────────
hooks.Filters.APP_PUBLIC_HOSTS.add_item(("lms", "{{ LMS_HOST }}"))

# ── Configuration defaults ────────────────────────────────────────────────────
hooks.Filters.CONFIG_DEFAULTS.add_items([
    ("LEARNNOV_PLATFORM_NAME",       "LearnNov"),
    ("LEARNNOV_PLATFORM_NAME_AR",    "لِيرن نوف"),
    ("LEARNNOV_SITE_URL",            "https://kaif.services"),
    ("LEARNNOV_STRIPE_SECRET_KEY",   ""),
    ("LEARNNOV_STRIPE_PUB_KEY",      ""),
    ("LEARNNOV_STRIPE_WEBHOOK_SECRET", ""),
    ("LEARNNOV_HYPERPAY_ACCESS_TOKEN",    ""),
    ("LEARNNOV_HYPERPAY_ENTITY_ID_VISA",  ""),
    ("LEARNNOV_HYPERPAY_ENTITY_ID_MADA",  ""),
    ("LEARNNOV_HYPERPAY_BASE_URL",        "https://eu-prod.oppwa.com"),
    ("LEARNNOV_TWITTER",   "@LearnNov"),
    ("LEARNNOV_FACEBOOK",  "https://www.facebook.com/LearnNov"),
    ("LEARNNOV_PRIMARY_COLOR", "#0f766e"), # Teal-700
    ("LEARNNOV_FAVICON_URL", "https://kaif.services/static/images/favicon.ico"),
    
    # ── SMS Settings (Unifonic / Generic) ──
    ("LEARNNOV_SMS_SENDER_ID", "LearnNov"),
    ("LEARNNOV_SMS_API_KEY",   ""),
    ("LEARNNOV_SMS_BASE_URL",  "https://api.unifonic.com/rest/"),
    
    # ── Support Settings ──
    ("LEARNNOV_SUPPORT_WHATSAPP", "+966500000000"),
    ("LEARNNOV_SUPPORT_EMAIL",    "support@learnnov.com"),
    
    # ── AI Tutor Settings ──
    ("LEARNNOV_OPENAI_API_KEY",   ""),
    
    # ── Marketing & Tracking ──
    ("LEARNNOV_GA4_ID",           ""),
    ("LEARNNOV_FB_PIXEL_ID",      ""),
])

# ── MFE Branding & Config ────────────────────────────────────────────────────
try:
    from tutormfe.hooks import Filters as MfeFilters
    MfeFilters.MFE_APP_CONFIG.add_items([
        ("authn", {
            "LOGO_URL": "{{ LEARNNOV_SITE_URL }}/static/images/logo.png",
            "FAVICON_URL": "{{ LEARNNOV_FAVICON_URL }}",
            "SITE_NAME": "{{ LEARNNOV_PLATFORM_NAME }}",
            "PRIMARY_COLOR": "{{ LEARNNOV_PRIMARY_COLOR }}",
            "HELP_LINK": "{{ LEARNNOV_SITE_URL }}/support",
            "TERMS_OF_SERVICE_LINK": "{{ LEARNNOV_SITE_URL }}/terms",
            "PRIVACY_POLICY_LINK": "{{ LEARNNOV_SITE_URL }}/privacy",
        }),
        ("profile", {
            "LOGO_URL": "{{ LEARNNOV_SITE_URL }}/static/images/logo.png",
            "SITE_NAME": "{{ LEARNNOV_PLATFORM_NAME }}",
            "SUPPORT_URL": "{{ LEARNNOV_SITE_URL }}/support",
        }),
        ("learning", {
            "LOGO_URL": "{{ LEARNNOV_SITE_URL }}/static/images/logo.png",
            "SITE_NAME": "{{ LEARNNOV_PLATFORM_NAME }}",
            "HELP_LINK": "{{ LEARNNOV_SITE_URL }}/support",
        }),
    ])
except ImportError:
    pass

# ── LMS Python settings (production) ────────────────────────────────────────
hooks.Filters.ENV_PATCHES.add_item((
    "openedx-lms-production-settings",
    """
# ── LearnNov branding ────────────────────────────────
PLATFORM_NAME             = "{{ LEARNNOV_PLATFORM_NAME }}"
PLATFORM_TWITTER_ACCOUNT  = "{{ LEARNNOV_TWITTER }}"
PLATFORM_FACEBOOK_ACCOUNT = "{{ LEARNNOV_FACEBOOK }}"
PLATFORM_COPYRIGHT        = "© {org_name}. جميع الحقوق محفوظة."
PLATFORM_ORG_LINK_URL     = "{{ LEARNNOV_SITE_URL }}"
PLATFORM_ORG_LINK_TEXT    = "LearnNov"

# ── Assets & Logos ───────────────────────────────────
LOGO_URL                  = "{{ LEARNNOV_SITE_URL }}/static/images/logo.png"
FAVICON_PATH              = "{{ LEARNNOV_FAVICON_URL }}"

# ── Payment gateways ─────────────────────────────────
LEARNNOV_STRIPE_SECRET_KEY        = "{{ LEARNNOV_STRIPE_SECRET_KEY }}"
LEARNNOV_STRIPE_PUBLISHABLE_KEY   = "{{ LEARNNOV_STRIPE_PUB_KEY }}"
LEARNNOV_STRIPE_WEBHOOK_SECRET    = "{{ LEARNNOV_STRIPE_WEBHOOK_SECRET }}"
LEARNNOV_HYPERPAY_ACCESS_TOKEN    = "{{ LEARNNOV_HYPERPAY_ACCESS_TOKEN }}"
LEARNNOV_HYPERPAY_ENTITY_ID_VISA  = "{{ LEARNNOV_HYPERPAY_ENTITY_ID_VISA }}"
LEARNNOV_HYPERPAY_ENTITY_ID_MADA  = "{{ LEARNNOV_HYPERPAY_ENTITY_ID_MADA }}"
LEARNNOV_HYPERPAY_BASE_URL        = "{{ LEARNNOV_HYPERPAY_BASE_URL }}"
LEARNNOV_SITE_URL                 = "{{ LEARNNOV_SITE_URL }}"

# ── Language selector ────────────────────────────────
FEATURES.update({
    "SHOW_HEADER_LANGUAGE_SELECTOR": True,
    "SHOW_FOOTER_LANGUAGE_SELECTOR": True,
    "CERTIFICATES_HTML_VIEW": True,
})

# ── SMS Config ───────────────────────────────────────
LEARNNOV_SMS_SENDER_ID = "{{ LEARNNOV_SMS_SENDER_ID }}"
LEARNNOV_SMS_API_KEY   = "{{ LEARNNOV_SMS_API_KEY }}"
LEARNNOV_SMS_BASE_URL  = "{{ LEARNNOV_SMS_BASE_URL }}"

# ── AI Tutor Config ──────────────────────────────────
LEARNNOV_OPENAI_API_KEY = "{{ LEARNNOV_OPENAI_API_KEY }}"

# ── Global Name Unification ──────────────────────────
SITE_NAME                 = "{{ LEARNNOV_PLATFORM_NAME }}"
STUDIO_NAME               = "LearnNov Studio"
PLATFORM_NAME             = "{{ LEARNNOV_PLATFORM_NAME }}"
EMAIL_SITE_DESIGNATION    = "{{ LEARNNOV_PLATFORM_NAME }}"
REGISTRATION_SIDEBAR_TEXT = "سجل الآن في ليرن نوف وابدأ رحلتك التعليمية."
FOOTER_ORGANIZATION_ID    = "learnnov"

# تخصيص لوحة الإدارة
from django.contrib import admin
admin.site.site_header = "إدارة منصة LearnNov"
admin.site.site_title  = "LearnNov Admin"
admin.site.index_title = "مرحباً بك في لوحة تحكم LearnNov"

# إخفاء شعار Open edX من التذييل
FEATURES.update({
    "SHOW_FOOTER_OPENEDX_LOGO": False,
})

# روابط السياسات الموحدة
MARKETING_SITE_ROOT = "{{ LEARNNOV_SITE_URL }}"
TOS_URL             = "{{ LEARNNOV_SITE_URL }}/terms"
PRIVACY_URL         = "{{ LEARNNOV_SITE_URL }}/privacy"
ABOUT_URL           = "{{ LEARNNOV_SITE_URL }}/about"
CONTACT_URL         = "{{ LEARNNOV_SITE_URL }}/contact"
HELP_TOKENS_BOOKS_URL = "{{ LEARNNOV_SITE_URL }}/support"

# ── Global Security Hardening ────────────────────────
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY' # منع وضع المنصة داخل iframe لحمايتها من الـ Clickjacking
"""
))

# ── LMS common settings (dev) ────────────────────────────────────────────────
hooks.Filters.ENV_PATCHES.add_item((
    "openedx-lms-common-settings",
    """
INSTALLED_APPS += [
    "lms.djangoapps.university_ads.apps.UniversityAdsConfig",
    "lms.djangoapps.learnnov_payments.apps.LearnNovPaymentsConfig",
    "lms.djangoapps.learnnov_certificates.apps.LearnNovCertificatesConfig",
    "lms.djangoapps.academic_programs.apps.AcademicProgramsConfig",
    "lms.djangoapps.program_ads.apps.ProgramAdsConfig",
    "lms.djangoapps.learnnov_marketing.apps.LearnNovMarketingConfig",
    "lms.djangoapps.learnnov_exams.apps.LearnNovExamsConfig",
    "lms.djangoapps.learnnov_mobile_api.apps.LearnnovMobileApiConfig",
    "lms.djangoapps.learnnov_ai_tutor.apps.LearnnovAiTutorConfig",
    "lms.djangoapps.learnnov_b2b.apps.LearnnovB2bConfig",
    "lms.djangoapps.learnnov_gamification.apps.LearnnovGamificationConfig",
]

MIDDLEWARE += [
    "lms.djangoapps.academic_programs.middleware.ReferralMiddleware",
    "lms.djangoapps.learnnov_gamification.middleware.GamificationActivityMiddleware",
]
"""
))

# ── Install Python packages inside container ─────────────────────────────────
hooks.Filters.ENV_PATCHES.add_item((
    "openedx-dockerfile-post-python-requirements",
    """
RUN pip install stripe "qrcode[pil]" Pillow requests djangorestframework django-crum openai --no-cache-dir
"""
))

# ── LMS urls.py patch ────────────────────────────────────────────────────────
hooks.Filters.ENV_PATCHES.add_item((
    "lms-urls",
    """
# LearnNov custom URLs
from django.urls import path, include
urlpatterns += [
    path("api/university_ads/",     include("lms.djangoapps.university_ads.urls",         namespace="university_ads")),
    path("payments/",               include("lms.djangoapps.learnnov_payments.urls",       namespace="learnnov_payments")),
    path("certificates/",           include("lms.djangoapps.learnnov_certificates.urls",   namespace="learnnov_certificates")),
    path("api/programs/",           include("lms.djangoapps.academic_programs.urls",       namespace="academic_programs")),
    path("api/ads/",                include("lms.djangoapps.program_ads.urls",             namespace="program_ads")),
    path("api/exams/",              include("lms.djangoapps.learnnov_exams.urls",          namespace="learnnov_exams")),
    path("api/mobile/v1/",          include("lms.djangoapps.learnnov_mobile_api.urls",     namespace="learnnov_mobile_api")),
    path("api/ai_tutor/",           include("lms.djangoapps.learnnov_ai_tutor.urls",       namespace="learnnov_ai_tutor")),
    path("api/b2b/",                include("lms.djangoapps.learnnov_b2b.urls",            namespace="learnnov_b2b")),
    path("api/gamification/",       include("lms.djangoapps.learnnov_gamification.urls",   namespace="learnnov_gamification")),
    path("",                        include("lms.djangoapps.learnnov_marketing.urls",      namespace="learnnov_marketing")),
]

# استخدام صفحة 404 المخصصة لـ LearnNov
handler404 = "lms.djangoapps.learnnov_marketing.views.handler404"
"""
))

# ── Studio (CMS) Branding ────────────────────────────────────────────────────
hooks.Filters.ENV_PATCHES.add_item((
    "openedx-cms-production-settings",
    """
PLATFORM_NAME = "LearnNov Studio"
STUDIO_NAME   = "LearnNov Studio"
LOGO_URL      = "{{ LEARNNOV_SITE_URL }}/static/images/logo.png"
"""
))

# ── LMS Footer Support Widget ────────────────────────────────────────────────
hooks.Filters.ENV_PATCHES.add_item((
    "lms-footer",
    """
<div id="learnnov-floating-widgets" style="position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px;">
    <button id="learnnov-theme-toggle" style="background:#1e293b; color:white; border:none; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); transition:transform 0.3s; cursor:pointer;" title="تغيير المظهر">
        <i class="fa fa-moon-o" id="theme-toggle-icon" style="font-size:26px;"></i>
    </button>
    <a href="https://wa.me/{{ LEARNNOV_SUPPORT_WHATSAPP }}" target="_blank" style="background:#25d366; color:white; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); transition:transform 0.3s; text-decoration:none;">
        <i class="fa fa-whatsapp" style="font-size:30px;"></i>
    </a>
</div>
<style>
    #learnnov-floating-widgets a:hover, #learnnov-floating-widgets button:hover { transform: scale(1.1); }
</style>
<script>
document.addEventListener("DOMContentLoaded", function() {
    const toggleBtn = document.getElementById('learnnov-theme-toggle');
    const icon = document.getElementById('theme-toggle-icon');
    
    function updateIcon(theme) {
        if(theme === 'dark') {
            icon.className = 'fa fa-sun-o';
            toggleBtn.style.background = '#f8fafc';
            toggleBtn.style.color = '#0f172a';
        } else {
            icon.className = 'fa fa-moon-o';
            toggleBtn.style.background = '#1e293b';
            toggleBtn.style.color = 'white';
        }
    }
    
    const currentTheme = localStorage.getItem('learnnov-theme') || 'light';
    updateIcon(currentTheme);
    
    toggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme') || 'light';
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('learnnov-theme', newTheme);
        updateIcon(newTheme);
    });
});
</script>
"""
))

# ── LMS Header Branding Patch ────────────────────────────────────────────────
hooks.Filters.ENV_PATCHES.add_item((
    "lms-header",
    """
<!-- ── SEO & OpenGraph Tags ── -->
<meta name="description" content="منصة {{ LEARNNOV_PLATFORM_NAME }} - منصة تعليمية إلكترونية رائدة للبرامج الأكاديمية والمهنية.">
<meta property="og:title" content="{{ LEARNNOV_PLATFORM_NAME }}">
<meta property="og:description" content="اكتشف مسارك المهني مع أفضل الدورات المعتمدة على منصة {{ LEARNNOV_PLATFORM_NAME }}.">
<meta property="og:image" content="{{ LEARNNOV_SITE_URL }}/static/images/logo.png">
<meta property="og:url" content="{{ LEARNNOV_SITE_URL }}">
<meta name="twitter:card" content="summary_large_image">

<!-- ── Google Analytics (GA4) ── -->
{% if LEARNNOV_GA4_ID %}
<script async src="https://www.googletagmanager.com/gtag/js?id={{ LEARNNOV_GA4_ID }}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '{{ LEARNNOV_GA4_ID }}');
</script>
{% endif %}

<!-- ── Facebook Pixel ── -->
{% if LEARNNOV_FB_PIXEL_ID %}
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '{{ LEARNNOV_FB_PIXEL_ID }}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id={{ LEARNNOV_FB_PIXEL_ID }}&ev=PageView&noscript=1"/></noscript>
{% endif %}

<script>
    (function() {
        var savedTheme = localStorage.getItem('learnnov-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    })();
</script>
<style>
/* ── Theme Variables ── */
:root {
    --bg-main: #f8fafc;
    --bg-card: #ffffff;
    --text-main: #334155;
    --text-heading: #1e293b;
    --border-color: #e2e8f0;
    --input-bg: #f8fafc;
    --btn-primary: {{ LEARNNOV_PRIMARY_COLOR }};
    --btn-primary-hover: #115e59;
    --header-bg: #ffffff;
    --footer-bg: #f8fafc;
    --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    --glass-blur: none;
}
[data-theme="dark"] {
    --bg-main: #0f172a;
    --bg-card: rgba(15, 23, 42, 0.90);
    --text-main: #f1f5f9;
    --text-heading: #ffffff;
    --border-color: #475569;
    --input-bg: #1e293b;
    --btn-primary: #2dd4bf; /* Brighter teal for dark mode */
    --btn-primary-hover: #14b8a6;
    --header-bg: #0f172a;
    --footer-bg: #020617;
    --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    --glass-blur: blur(16px);
}

/* ── Typography & Readability ── */
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');

body, h1, h2, h3, h4, h5, p, span, div, a, button, input, select, textarea, .btn {
    font-family: 'Tajawal', sans-serif !important;
}

body {
    background-color: var(--bg-main) !important;
    transition: background-color 0.3s ease, color 0.3s ease;
}

body, p, span {
    font-size: 16px !important;
    line-height: 1.8 !important;
    color: var(--text-main) !important;
}

h1, h2, h3, h4, h5 {
    color: var(--text-heading) !important;
    font-weight: 700 !important;
    line-height: 1.4 !important;
    margin-bottom: 15px !important;
}

/* ── Links & Buttons ── */
a {
    color: var(--btn-primary) !important;
    text-decoration: none !important;
    transition: color 0.3s ease !important;
}
a:hover {
    color: var(--btn-primary-hover) !important;
}

.btn, .btn-brand, button, .action-primary, .button {
    border-radius: 8px !important;
    background-color: var(--btn-primary) !important;
    color: #ffffff !important;
    border: none !important;
    padding: 10px 24px !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
}

.btn:hover, button:hover, .action-primary:hover, .button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
    background-color: var(--btn-primary-hover) !important;
}

/* ── Forms & Inputs ── */
input[type="text"], input[type="email"], input[type="password"], select, textarea, .form-control {
    background-color: var(--input-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 8px !important;
    padding: 12px 16px !important;
    font-size: 15px !important;
    color: var(--text-main) !important;
    transition: all 0.3s ease !important;
}
input[type="text"]:focus, input[type="email"]:focus, input[type="password"]:focus, select:focus, textarea:focus, .form-control:focus {
    background-color: var(--bg-card) !important;
    border-color: var(--btn-primary) !important;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15) !important;
    outline: none !important;
}

/* ── Cards & Containers (Glassmorphism) ── */
.course-card, .card, .course, .dashboard-item, .wrapper-course-material, .outline-item, .accordion-panel, .chapter, .section, .learnnov-dashboard-widget > div {
    background: var(--bg-card) !important;
    backdrop-filter: var(--glass-blur) !important;
    -webkit-backdrop-filter: var(--glass-blur) !important;
    border-radius: 12px !important;
    overflow: hidden !important;
    border: 1px solid var(--border-color) !important;
    box-shadow: var(--card-shadow) !important;
    transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease, border-color 0.3s ease !important;
}

.course-card:hover, .course:hover {
    transform: translateY(-5px) !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1) !important;
    border-color: var(--btn-primary) !important;
}

/* ── Course Outline & Accordions ── */
.accordion-trigger, .chapter-title {
    background: transparent !important;
    border-bottom: 1px solid var(--border-color) !important;
    padding: 15px 20px !important;
    color: var(--text-heading) !important;
    font-weight: 700 !important;
    transition: background 0.2s ease !important;
}
.accordion-trigger:hover, .chapter-title:hover {
    background: rgba(0,0,0,0.05) !important;
}
[data-theme="dark"] .accordion-trigger:hover, [data-theme="dark"] .chapter-title:hover {
    background: rgba(255,255,255,0.05) !important;
}

/* ── Progress Bars & Navigation ── */
.progress-bar, .sequence-nav, .sequence-list-wrapper {
    border-radius: 8px !important;
    background: var(--input-bg) !important;
}
.progress-bar .progress-fill {
    background-color: var(--btn-primary) !important;
    border-radius: 8px !important;
}

/* ── Circular Progress Rings (Custom JS Injection) ── */
.circular-progress-container {
    position: relative;
    width: 60px;
    height: 60px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.circular-progress-svg {
    transform: rotate(-90deg);
    width: 100%;
    height: 100%;
}
.circular-progress-bg {
    fill: none;
    stroke: var(--input-bg);
    stroke-width: 4;
}
.circular-progress-fill {
    fill: none;
    stroke: var(--btn-primary);
    stroke-width: 4;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s ease-in-out;
}
.circular-progress-text {
    position: absolute;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main);
    font-family: 'Tajawal', sans-serif;
}

/* ── Header & Footer Overrides ── */
header.global-header {
    border-bottom: 1px solid var(--border-color) !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
    background: var(--header-bg) !important;
}
.global-header .nav-links a {
    font-size: 16px !important;
    font-weight: 500 !important;
    color: var(--text-main) !important;
}
.global-header .nav-links a:hover {
    color: var(--btn-primary) !important;
}
.wrapper-footer, footer#footer-openedx {
    background-color: var(--footer-bg) !important;
    border-top: 1px solid var(--border-color) !important;
    color: var(--text-main) !important;
}

/* ── Alerts & Badges ── */
.alert, .message, .system-message {
    border-radius: 8px !important;
    border: none !important;
    padding: 15px 20px !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    background-color: var(--bg-card) !important;
    color: var(--text-main) !important;
    border-left: 4px solid var(--btn-primary) !important;
}
.alert-success, .message-status.success {
    border-left-color: #10b981 !important;
}
.alert-error, .message-status.error {
    border-left-color: #ef4444 !important;
}
</style>
<script>
document.addEventListener("DOMContentLoaded", function() {
    // استبدال نصوص "Open edX" في الـ Header
    const logoLinks = document.querySelectorAll('a.logo, a.header-logo');
    logoLinks.forEach(link => {
        const img = link.querySelector('img');
        if (img) {
            img.alt = "{{ LEARNNOV_PLATFORM_NAME }} Home Page";
            img.src = "{{ LEARNNOV_SITE_URL }}/static/images/logo.png";
        }
    });

    // ── Circular Progress Rings Transformation ──────────────────
    setTimeout(() => {
        // Find elements that might contain progress text/bars
        const progressElements = document.querySelectorAll('.course-progress, .progress-text, .course-details .progress, .progress-bar-container, .learner-dashboard .progress, .course-card .complete-info');
        progressElements.forEach(el => {
            if(el.dataset.ringInjected) return;
            const text = el.innerText || '';
            const match = text.match(/(\d+)%/);
            if (match) {
                const percent = parseInt(match[1]);
                const radius = 26;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (percent / 100) * circumference;
                
                el.innerHTML = `
                <div class="circular-progress-container">
                    <svg class="circular-progress-svg" viewBox="0 0 60 60">
                        <circle class="circular-progress-bg" cx="30" cy="30" r="${radius}"></circle>
                        <circle class="circular-progress-fill" cx="30" cy="30" r="${radius}" 
                                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
                    </svg>
                    <span class="circular-progress-text">${percent}%</span>
                </div>
                `;
                el.dataset.ringInjected = 'true';
                el.style.display = 'inline-flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
            }
        });
    }, 1500); // Delay for MFE rendering


    // ── LearnNov Dashboard Integration ──────────────────
    if (window.location.pathname.endsWith('/dashboard') || window.location.pathname.endsWith('/dashboard/')) {
        fetch('/api/programs/summary/')
            .then(response => {
                if (!response.ok) throw new Error('Not logged in');
                return response.json();
            })
            .then(data => {
                const sidebar = document.querySelector('.side-container') || document.querySelector('.wrapper-course-material') || document.querySelector('.dashboard-content');
                if (sidebar) {
                    const widget = document.createElement('div');
                    widget.className = 'learnnov-dashboard-widget';
                    widget.style.marginBottom = '20px';
                    widget.innerHTML = `
                        <div class="learnnov-dashboard-widget-inner" style="border-radius: 12px; padding: 20px; font-family: 'Tajawal', sans-serif;">
                            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                                <img src="{{ LEARNNOV_SITE_URL }}/static/images/logo.png" style="height:25px;" alt="LearnNov">
                                <h3 style="margin:0; font-size:16px; color:var(--btn-primary);">ليرن نوف — ملخصك</h3>
                            </div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                <div style="background:var(--input-bg); padding:10px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                                    <div style="font-size:12px; color:var(--text-main);">طلباتك</div>
                                    <div style="font-weight:bold; color:var(--btn-primary);">${data.active_applications}</div>
                                </div>
                                <div style="background:var(--input-bg); padding:10px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                                    <div style="font-size:12px; color:var(--text-main);">نقاطك</div>
                                    <div style="font-weight:bold; color:var(--btn-primary);">${data.referral_points}</div>
                                </div>
                            </div>
                            <a href="/api/programs/applications/" style="display:block; margin-top:15px; text-align:center; font-size:13px; color:var(--btn-primary); text-decoration:none; font-weight:600;">
                                متابعة طلبات التقديم ←
                            </a>
                        </div>
                    `;
                    sidebar.prepend(widget);
                }
            })
            .catch(err => console.log('LearnNov widget skip:', err.message));
    }
});
</script>
"""
))

# ── Email Branding Patches ───────────────────────────────────────────────────
hooks.Filters.ENV_PATCHES.add_item((
    "emails-header",
    """
<div dir="rtl" style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
    <img src="{{ LEARNNOV_SITE_URL }}/static/images/logo.png" alt="LearnNov Logo" style="max-height: 50px;">
</div>
"""
))

hooks.Filters.ENV_PATCHES.add_item((
    "emails-footer",
    """
<table dir="rtl" style="width: 100%; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
    <tr>
        <td style="text-align: center; color: #64748b; font-size: 12px;">
            <p>© {{ LEARNNOV_PLATFORM_NAME }} — جميع الحقوق محفوظة.</p>
            <p>
                <a href="{{ LEARNNOV_SITE_URL }}/support" style="color: #0f766e; text-decoration: none;">الدعم الفني</a> | 
                <a href="{{ LEARNNOV_SITE_URL }}/privacy" style="color: #0f766e; text-decoration: none;">سياسة الخصوصية</a>
            </p>
        </td>
    </tr>
</table>
"""
))

# ── Mount our custom apps into the LMS container ────────────────────────────
_APPS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "openedx-platform-master", "lms", "djangoapps")

for _app in ("university_ads", "learnnov_payments", "learnnov_certificates", "academic_programs", "program_ads", "learnnov_marketing", "learnnov_exams", "learnnov_mobile_api", "learnnov_ai_tutor", "learnnov_b2b", "learnnov_gamification"):
    _src = os.path.join(_APPS_DIR, _app)
    if os.path.isdir(_src):
        hooks.Filters.COMPOSE_MOUNTS.add_item((
            "lms",
            _src,
            f"/openedx/edx-platform/lms/djangoapps/{_app}",
        ))
        hooks.Filters.COMPOSE_MOUNTS.add_item((
            "lms-job",
            _src,
            f"/openedx/edx-platform/lms/djangoapps/{_app}",
        ))
