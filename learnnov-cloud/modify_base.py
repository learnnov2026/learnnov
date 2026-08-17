import re
with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\templates\admin\base.html', 'r', encoding='utf-8') as f:
    content = f.read()

navbar_replacement = '''
                {% get_side_menu using="app_list" as dashboard_list %}
                {% for app in dashboard_list %}
                    <li class="nav-item dropdown">
                        <a id="dropdownSubMenu_{{ forloop.counter }}" href="#" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="nav-link dropdown-toggle">
                            <i class="nav-icon {{ app.icon }}"></i> {{ app.name|truncatechars:21 }}
                        </a>
                        <ul aria-labelledby="dropdownSubMenu_{{ forloop.counter }}" class="dropdown-menu border-0 shadow">
                            {% for model in app.models %}
                                <li>
                                    <a href="{% if model.url %}{{ model.url }}{% else %}javascript:void(0){% endif %}" class="dropdown-item">
                                        <i class="{{ model.icon }}"></i> {{ model.name }}
                                    </a>
                                </li>
                            {% endfor %}
                        </ul>
                    </li>
                {% endfor %}
'''

# Find the top_menu loop and replace it
content = re.sub(
    r'\{\% get_top_menu user request.current_app\|default:"admin" as top_menu \%\}.*?(?=\</ul>)',
    navbar_replacement,
    content,
    flags=re.DOTALL
)

# Empty the sidebar block completely
content = re.sub(
    r'\{\% block sidebar \%\}.*?\{\% endblock %\}',
    '{% block sidebar %}{% endblock %}',
    content,
    flags=re.DOTALL
)

with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\templates\admin\base.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("HTML Replaced")
