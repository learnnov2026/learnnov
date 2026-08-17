import ast
import re

with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\config\settings.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Disable Sidebar in JAZZMIN_SETTINGS
if '"show_sidebar":' in content:
    content = re.sub(r'"show_sidebar":\s*True,', '"show_sidebar": False,', content)
else:
    content = re.sub(r'JAZZMIN_SETTINGS\s*=\s*\{', 'JAZZMIN_SETTINGS = {\n    "show_sidebar": False,', content)

# Change theme to default so our custom colors stand out, or keep litera.
# litera is fine. 

with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\config\settings.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated settings.py")
