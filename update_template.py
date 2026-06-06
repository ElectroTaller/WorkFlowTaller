import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the specific line in the resident template
old_string = "📍 *Apto / Unidad:* ${apt.apt || 'No def.'}\n👤 *Residente:* ${(apt.residentName || 'No def.').toUpperCase()}\n👷 *Técnico asignado:* ${(techName || 'No asignado').toUpperCase()}"
new_string = "📍 *Apto / Unidad:* ${apt.apt || 'No def.'}\n👷 *Técnico asignado:* ${(techName || 'No asignado').toUpperCase()}"

content = content.replace(old_string, new_string)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed Residente line.")
