import pathlib, re, sys
root = pathlib.Path(r"b:/LEARNNOV PLATFORM/openedx-platform-master/lms/static/sass")
pattern_missing = re.compile(r'@extend\s+(%t-[\w-]+);(?!.*!optional)')
for p in root.rglob('*.scss'):
    try:
        text = p.read_text(encoding='utf-8')
    except Exception as e:
        print('skip', p, e, file=sys.stderr)
        continue
    new_lines = []
    changed = False
    for line in text.splitlines():
        if pattern_missing.search(line):
            # Insert !optional before semicolon
            line = pattern_missing.sub(r'@extend \1 !optional;', line)
            changed = True
        new_lines.append(line)
    if changed:
        p.write_text('\n'.join(new_lines) + '\n', encoding='utf-8')
        print('fixed', p)
