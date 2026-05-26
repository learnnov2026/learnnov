import json, csv, os

# Paths
project_root = os.getcwd()
bandit_path = os.path.join(project_root, 'bandit_report.json')
output_path = os.path.join(project_root, 'bandit_low_issues.csv')

with open(bandit_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# data['metrics'] contains per-file metrics
metrics = data.get('metrics', {})

with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['File', 'LowSeverityCount'])
    for file, stats in metrics.items():
        low = stats.get('SEVERITY.LOW', 0)
        if low and low > 0:
            writer.writerow([file, low])

print('Low severity issues CSV generated at', output_path)
