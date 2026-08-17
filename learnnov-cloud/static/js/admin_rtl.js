/**
 * LearnNov Admin Dashboard RTL & Arabic Localization Engine
 */
(function() {
    'use strict';

    const TRANSLATIONS = {
        'Dashboard': 'الرئيسية',
        'Authentication and Authorization': 'المصادقة والصلاحيات',
        'Audit log': 'سجل العمليات والتدقيق',
        'Log entries': 'سجلات التدقيق',
        'Sites': 'المواقع الإلكترونية',
        'Groups': 'المجموعات',
        'Users': 'المستخدمون',
        'Recent actions': 'آخر الأنشطة والعمليات',
        'None available': 'لا توجد أنشطة سابقة',
        'See all': 'عرض الكل',
        'See All': 'عرض الكل',
        'View site': 'زيارة الموقع',
        'Change password': 'تغيير كلمة المرور',
        'Log out': 'تسجيل الخروج',
        'Action:': 'الإجراء:',
        'Action': 'الإجراء',
        'Go': 'تنفيذ',
        '0 of': '0 من',
        'selected': 'محدد',
        'Select all': 'تحديد الكل',
        'Home': 'الرئيسية',
        'Filter': 'تصفية',
        'Search': 'بحث',
        'By': 'بواسطة',
        'All': 'الكل',
        'Yes': 'نعم',
        'No': 'لا',
        'Unknown': 'غير معروف',
        'Add': 'إضافة',
        'Change': 'تعديل',
        'View': 'عرض'
    };

    function translateTextNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (TRANSLATIONS[text]) {
                node.textContent = node.textContent.replace(text, TRANSLATIONS[text]);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Check placeholders
            if (node.hasAttribute('placeholder')) {
                const ph = node.getAttribute('placeholder').trim();
                if (TRANSLATIONS[ph]) {
                    node.setAttribute('placeholder', TRANSLATIONS[ph]);
                }
            }
            // Check titles
            if (node.hasAttribute('title')) {
                const title = node.getAttribute('title').trim();
                if (TRANSLATIONS[title]) {
                    node.setAttribute('title', TRANSLATIONS[title]);
                }
            }
            // Recurse children
            for (let child of node.childNodes) {
                translateTextNode(child);
            }
        }
    }

    function applyRTL() {
        if (document.documentElement) {
            document.documentElement.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('lang', 'ar');
        }
        if (document.body) {
            document.body.setAttribute('dir', 'rtl');
            document.body.classList.add('rtl-mode');
        }

        // Translate sidebar headers and elements
        document.querySelectorAll('.nav-header, .nav-sidebar .nav-link p, .card-title, .breadcrumb-item, .brand-text').forEach(function(el) {
            translateTextNode(el);
        });

        // Translate any untranslated buttons
        document.querySelectorAll('.addlink').forEach(function(btn) {
            if (btn.textContent.trim() === 'Add') {
                btn.innerHTML = '<i class="fas fa-plus ms-1"></i> إضافة';
            }
        });
        document.querySelectorAll('.changelink').forEach(function(btn) {
            if (btn.textContent.trim() === 'Change') {
                btn.innerHTML = '<i class="fas fa-edit ms-1"></i> تعديل';
            }
        });
        document.querySelectorAll('.viewlink').forEach(function(btn) {
            if (btn.textContent.trim() === 'View') {
                btn.innerHTML = '<i class="fas fa-eye ms-1"></i> عرض';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyRTL);
    } else {
        applyRTL();
    }

    // Observe dynamic changes
    var observer = new MutationObserver(function(mutations) {
        applyRTL();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
