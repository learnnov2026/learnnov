## Convert Bandit JSON to CSV
# File: generate_bandit_csv.py
# Reads bandit_report.json and produces a CSV summary.

import json
import csv
import os

# Paths (adjust if needed)
json_path = r"b:/LEARNNOV PLATFORM/bandit_report.json"
csv_path = r"b:/LEARNNOV PLATFORM/bandit_report_summary.csv"

# Load Bandit results (list of dicts)
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Write CSV header
with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["filename", "line_number", "severity", "confidence", "test_name", "issue_text"])
    for entry in data:
        writer.writerow([
            entry.get("filename"),
            entry.get("line_number"),
            entry.get("issue_severity"),
            entry.get("issue_confidence"),
            entry.get("test_name"),
            entry.get("issue_text")
        ])

print(f"Bandit CSV summary written to {csv_path}")
