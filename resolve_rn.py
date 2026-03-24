import os
import re

files = [
    r"C:\Users\User\Desktop\learning\WorkSense\WorkSense\app\(auth)\login.jsx",
    r"C:\Users\User\Desktop\learning\WorkSense\WorkSense\app\(worker)\dashboard.jsx",
    r"C:\Users\User\Desktop\learning\WorkSense\WorkSense\src\components\MapMarker.jsx",
    r"C:\Users\User\Desktop\learning\WorkSense\WorkSense\app\(worker)\camera.jsx",
    r"C:\Users\User\Desktop\learning\WorkSense\WorkSense\app\(admin)\live-map.jsx"
]

conflict_pattern = re.compile(r'<<<<<<< HEAD\n(.*?)=======\n(.*?)>>>>>>> copilot/vscode-[^\n]+?\n', re.DOTALL)

for filepath in files:
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, file not found.")
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Keep the HEAD part
    new_content = conflict_pattern.sub(r'\1', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
print("Mobile app conflicts resolved using HEAD branch logic.")
