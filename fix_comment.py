import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the problematic region around line 148-151 and replace with clean code
# The issue is a broken comment block before firebaseModule
# Remove any broken text lines between }; and const firebaseModule

fixed = re.sub(
    r'\};\s*\n[\s\S]*?const firebaseModule',
    '};\n\nconst firebaseModule',
    content,
    count=1
)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/app.js', 'w', encoding='utf-8') as f:
    f.write(fixed)

print('Done')
