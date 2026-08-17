import re

with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\templates\admin\base.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Make body always layout-top-nav
content = re.sub(
    r'<body class="layout-fixed[^"]*"',
    r'<body class="layout-top-nav no-sidebar bg-body-tertiary {% sidebar_status request %} {% if is_popup %}popup {% endif %}{% block bodyclass %}{% endblock %} {{ jazzmin_ui.body_classes }}"',
    content
)

# Replace the dynamic top menu with our custom hardcoded grouped menu
# The original has: {% get_top_menu user request.current_app|default:"admin" as top_menu %}
# We replace the whole block until the search form.
custom_menu = '''
                <!-- Custom Grouped Menu -->
                <li class="nav-item d-none d-sm-inline-block">
                    <a href="{% url 'admin:index' %}" class="nav-link">الرئيسية</a>
                </li>
                
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">المنظومة الأكاديمية</a>
                    <div class="dropdown-menu">
                        <a class="dropdown-item" href="{% url 'admin:app_list' 'academic_programs' %}">البرامج والمسارات</a>
                        <a class="dropdown-item" href="{% url 'admin:app_list' 'learnnov_exams' %}">الاختبارات والتقييمات</a>
                    </div>
                </li>

                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">المالية والاشتراكات</a>
                    <div class="dropdown-menu">
                        <a class="dropdown-item" href="{% url 'admin:app_list' 'learnnov_payments' %}">إدارة المدفوعات</a>
                    </div>
                </li>

                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">الشهادات والاعتمادات</a>
                    <div class="dropdown-menu">
                        <a class="dropdown-item" href="{% url 'admin:app_list' 'learnnov_certificates' %}">إصدار الشهادات</a>
                    </div>
                </li>

                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">التفاعل والمجتمع</a>
                    <div class="dropdown-menu">
                        <a class="dropdown-item" href="{% url 'admin:app_list' 'course_discussions' %}">النقاشات والأسئلة</a>
                        <a class="dropdown-item" href="{% url 'admin:app_list' 'university_ads' %}">إعلانات الجامعات</a>
                        <a class="dropdown-item" href="{% url 'admin:app_list' 'ai_assistant' %}">المساعد الذكي (AI)</a>
                    </div>
                </li>

                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">الإدارة والأمان</a>
                    <div class="dropdown-menu">
                        <a class="dropdown-item" href="{% url 'admin:app_list' 'auth' %}">المستخدمون والصلاحيات</a>
                        <a class="dropdown-item" href="{% url 'admin:app_list' 'auditlog' %}">سجل العمليات</a>
                    </div>
                </li>
'''

# Find where get_top_menu starts and replace
content = re.sub(
    r'\{\% get_top_menu user request\.current_app.*?\{\% endfor \%\}',
    custom_menu,
    content,
    flags=re.DOTALL
)

# Remove the sidebar rendering completely since it's layout-top-nav
content = re.sub(
    r'\{\% block sidebar \%\}\s*\{\% if jazzmin_settings.show_sidebar \%\}.*?\{\% endif \%\}\s*\{\% endblock \%\}',
    '',
    content,
    flags=re.DOTALL
)

with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\templates\admin\base.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated base.html with custom layout-top-nav")
