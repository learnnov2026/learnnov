import re

with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\templates\admin\base.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove layout-top-nav if it exists
content = re.sub(r'layout-top-nav\s*', '', content)

with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\templates\admin\base.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed layout-top-nav class")
