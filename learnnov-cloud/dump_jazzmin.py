import ast

with open(r'b:\LEARNNOV PLATFORM\learnnov-cloud\config\settings.py', 'r', encoding='utf-8') as f:
    source = f.read()

out = []
parsed = ast.parse(source)
for node in parsed.body:
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id in ['JAZZMIN_SETTINGS', 'JAZZMIN_UI_TWEAKS']:
                out.append(f"--- {target.id} ---")
                out.append(ast.unparse(node.value))

with open('jazzmin_dump.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
