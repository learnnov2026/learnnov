import os, csv, re, sys
root = os.getcwd()
pattern = re.compile(r'TODO|FIXME')
output_path = os.path.join(root, 'todo_fixme.csv')
with open(output_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['File', 'Line', 'Text'])
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn.lower().endswith(('.py', '.sh', '.js', '.php', '.rb', '.java', '.c', '.cpp', '.cs')):
                file_path = os.path.join(dirpath, fn)
                try:
                    with open(file_path, 'r', errors='ignore') as file:
                        for i, line in enumerate(file, 1):
                            if pattern.search(line):
                                writer.writerow([file_path, i, line.strip()])
                except Exception as e:
                    # Skip files that can't be read
                    pass
print('CSV generated at', output_path)
