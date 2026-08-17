import re
with open(r'b:\LEARNNOV PLATFORM\learnnov-web\src\app\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace /api/courses with /api/programs/programs/
content = content.replace("api.get<any>('/api/courses')", "api.get<any>('/api/programs/programs/')")

# Remove the mapping logic for Prisma since Django returns AcademicProgram directly
# It looks like:
# .then((json) => {
#    if (Array.isArray(json)) {
#       const mappedCourses = json.map(c => ({...}))
#       setAvailableCourses(mappedCourses)

content = re.sub(
    r'\.then\(\(json\) => \{\s*if \(Array\.isArray\(json\)\) \{\s*// Map Prisma Course to AcademicProgram format.*?setAvailableCourses\(mappedCourses\);\s*\}\s*\}\)',
    '''.then((json) => {
          if (Array.isArray(json)) {
            setAvailableCourses(json);
          } else if (json && Array.isArray(json.results)) {
            setAvailableCourses(json.results);
          }
        })''',
    content,
    flags=re.DOTALL
)

with open(r'b:\LEARNNOV PLATFORM\learnnov-web\src\app\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated page.tsx")
