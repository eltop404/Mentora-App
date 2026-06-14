import re

def find_duplicates(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the DB object content
    match = re.search(r'export const DB = \{(.*)\}\s*;', content, re.DOTALL)
    if not match:
        # Try without the semicolon
        match = re.search(r'export const DB = \{(.*)\}', content, re.DOTALL)
        if not match:
            print("DB object not found")
            return

    db_content = match.group(1)
    
    # Find keys (very simple regex, assumes keys start with some spaces and then alphabetical chars followed by colon)
    keys = re.findall(r'^\s{4}([a-zA-Z0-9_]+):', db_content, re.MULTILINE)
    
    seen = {}
    duplicates = []
    for key in keys:
        if key in seen:
            duplicates.append(key)
        seen[key] = seen.get(key, 0) + 1
    
    if duplicates:
        print("Duplicate keys found:")
        for key in set(duplicates):
            print(f"- {key} (appears {seen[key]} times)")
    else:
        print("No duplicate keys found")

find_duplicates(r'd:\نبض-التاريخ\src\services\db.ts')
