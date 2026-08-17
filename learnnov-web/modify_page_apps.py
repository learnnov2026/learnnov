import re
with open(r'b:\LEARNNOV PLATFORM\learnnov-web\src\app\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r"api\.get<any>\('/api/users/me/profile'\)\s*\.then\(\s*json\s*=>\s*\{.*?\setDbApplications\(apps\);\s*\}\s*\}\)",
    '''api.get<any>('/api/programs/applications/')
        .then(json => {
          if (Array.isArray(json)) {
            const apps = json.map((e: any) => ({
              id: e.id,
              program: e.program,
              status: e.status
            }));
            setDbApplications(apps);
          } else if (json && Array.isArray(json.results)) {
            const apps = json.results.map((e: any) => ({
              id: e.id,
              program: e.program,
              status: e.status
            }));
            setDbApplications(apps);
          }
        })''',
    content,
    flags=re.DOTALL
)

# And fix handle Apply Enrollment Form Submission
# await api.post(/api/enrollments, { courseId: enrollingProgram.id, notes: formData.personalStatement });
# should hit /api/programs/programs//apply/
content = re.sub(
    r"await api\.post\(/api/enrollments, \{ courseId: enrollingProgram\.id, notes: formData\.personalStatement \}\);",
    "await api.post(/api/programs/programs//apply/, { personal_statement: formData.personalStatement });",
    content
)

with open(r'b:\LEARNNOV PLATFORM\learnnov-web\src\app\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("page.tsx applications fetch updated")
