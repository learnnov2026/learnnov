## Generate CSV from Scan Results
# File: generate_csv.py
# Reads the JSON output from security_scan.ps1 and creates a CSV report.

import json
import csv
import os

# Paths (relative to the repository root)
search_root = r"b:/LEARNNOV PLATFORM/openedx-platform-master"
json_path = os.path.join(search_root, "scan_results.json")
csv_path = os.path.join(search_root, "security_audit_report.csv")

# Load scan results
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Write CSV
with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["file_path", "line_number", "issue_type", "code_snippet"])
    for entry in data:
        writer.writerow([
            entry.get("File"),
            entry.get("Line"),
            entry.get("Pattern"),
            entry.get("Text")
        ])

print(f"CSV report generated at {csv_path}")
