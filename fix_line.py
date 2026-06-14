import re

file_path = r'E:\نبض-التاريخ\src\App.tsx'

with open(file_path, 'rb') as f:
    raw = f.read()

content = raw.decode('utf-8')

lines = content.split('\r\n')

line_idx = 2987  # 0-indexed for line 2988
line = lines[line_idx]

print(f"Line 2988 before fix:")
print(repr(line[:120]))

# The broken pattern: message: استخراج: ${nidResult.dob}`
# Should be:          message: `استخراج: ${nidResult.dob}`
# The Arabic word starts: \u0627\u0633\u062A\u062E\u0631\u0627\u062C (استخراج)

broken = 'message: \u0627\u0633\u062A\u062E\u0631\u0627\u062C: ${nidResult.dob}`'
fixed  = 'message: `\u0627\u0633\u062A\u062E\u0631\u0627\u062C: ${nidResult.dob}`'

if broken in line:
    print("FOUND broken pattern - fixing...")
    lines[line_idx] = line.replace(broken, fixed)
    new_content = '\r\n'.join(lines)
    with open(file_path, 'wb') as f:
        f.write(new_content.encode('utf-8'))
    print("FIXED successfully!")
else:
    # Try a more flexible search
    print("Exact pattern not found, searching with regex...")
    # Look for message: followed by Arabic then the backtick closure
    match = re.search(r'message: (?!`)(\u0627\u0633\u062A\u062E\u0631\u0627\u062C)', line)
    if match:
        print(f"Found at position {match.start()}")
        new_line = line[:match.start()] + 'message: `' + line[match.start() + len('message: '):]
        lines[line_idx] = new_line
        new_content = '\r\n'.join(lines)
        with open(file_path, 'wb') as f:
            f.write(new_content.encode('utf-8'))
        print("FIXED with regex!")
    else:
        print("Could not find pattern. Dumping line chars:")
        for i, ch in enumerate(line):
            if i > 80:
                print(f"  [{i}] U+{ord(ch):04X} = {repr(ch)}")
