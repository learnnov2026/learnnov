import pathlib, re, sys
root = pathlib.Path(r"b:/LEARNNOV PLATFORM/openedx-platform-master/lms/static/sass")
for p in root.rglob('*.scss'):
    try:
        text = p.read_text(encoding='utf-8')
    except Exception as e:
        print('skip', p, e, file=sys.stderr)
        continue
    new = re.sub(r'@extend (%t-[a-zA-Z0-9_-]+);', r'@extend \1 !optional;', text)
    if new != text:
        p.write_text(new, encoding='utf-8')
        print('modified', p)
