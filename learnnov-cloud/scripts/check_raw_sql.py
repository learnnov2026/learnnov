import os
import sys
import re

def main():
    apps_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'apps')
    
    # Simple regex to catch .raw( and .execute( usage in Python files
    bad_patterns = [
        re.compile(r'\bobjects\.raw\('),
        re.compile(r'\bcursor\.execute\('),
        re.compile(r'\bconnection\.cursor\('),
    ]

    has_errors = False

    for root, dirs, files in os.walk(apps_dir):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.readlines()
                    
                for i, line in enumerate(content):
                    # Exclude comments
                    if line.strip().startswith('#'):
                        continue
                        
                    for pattern in bad_patterns:
                        if pattern.search(line):
                            print(f"[SECURITY VULNERABILITY] Raw SQL detected in {filepath} at line {i+1}:")
                            print(f"  {line.strip()}")
                            has_errors = True

    if has_errors:
        print("\nDB01: SQL Injection risk. Please use Django ORM instead of raw queries.")
        sys.exit(1)
    else:
        print("No raw SQL usage detected. Good to go!")
        sys.exit(0)

if __name__ == '__main__':
    main()
