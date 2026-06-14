import traceback
import sys

try:
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # PowerShell Get-Content -Raw without -Encoding uses the system ANSI code page (e.g., cp1256 for Arabic Windows)
    # Let's try cp1256 or cp1252
    
    fixed = False
    for enc in ['cp1252', 'cp1256', 'latin1']:
        try:
            fixed_content = content.encode(enc).decode('utf-8')
            with open('src/App.tsx', 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print('Fixed with ' + enc)
            fixed = True
            break
        except Exception:
            pass
            
    if not fixed:
        print('Could not fix encoding')
except Exception as e:
    traceback.print_exc()
