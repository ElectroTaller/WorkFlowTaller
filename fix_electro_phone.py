import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Revert the first instance only
old_block = """      if (targetType === 'resident' || targetType === 'electro') {
        phoneRaw = apt.residentPhone;"""

new_block = """      if (targetType === 'resident') {
        phoneRaw = apt.residentPhone;"""

content = content.replace(old_block, new_block)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed electro phone routing.")
