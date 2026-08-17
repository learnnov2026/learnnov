import re
with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\config\settings.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('''    "navbar_fixed": False,
    # Whether to show the UI customizer on the sidebar
    "show_ui_builder": False,

    # Hide sidebar since we are using topnav
    "show_sidebar": False,''', '''    "navbar_fixed": False,''')

# Now put it in JAZZMIN_SETTINGS
content = content.replace('''    # Whether to show the UI customizer on the sidebar
    "show_ui_builder": False,''', '''    # Whether to show the UI customizer on the sidebar
    "show_ui_builder": False,

    # Hide sidebar since we are using topnav
    "show_sidebar": False,''')

with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\config\settings.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Settings Fixed")
