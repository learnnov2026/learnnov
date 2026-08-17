import ast
import re

with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\config\settings.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Enable UI Builder
if '"show_ui_builder":' in content:
    content = re.sub(r'"show_ui_builder":\s*False,', '"show_ui_builder": True,', content)
else:
    content = re.sub(r'JAZZMIN_SETTINGS\s*=\s*\{', 'JAZZMIN_SETTINGS = {\n    "show_ui_builder": True,', content)

# Remove topmenu_links to unclutter the top nav
content = re.sub(r'"topmenu_links":\s*\[.*?\],\n', '', content, flags=re.DOTALL)

# Tweak UI
content = re.sub(r'"theme":\s*"[^"]*"', '"theme": "litera"', content)
content = re.sub(r'"sidebar":\s*"[^"]*"', '"sidebar": "sidebar-dark-primary"', content)

with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\config\settings.py', 'w', encoding='utf-8') as f:
    f.write(content)
