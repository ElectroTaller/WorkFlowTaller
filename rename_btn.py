import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'Solo Residente(\s*</button>)', r'Residente\1', content)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Button renamed to Residente.")
