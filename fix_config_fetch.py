import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = "const cfg = window.firebaseModule?.getConfig() || {};"
new_code = """let cfg = {};
        try {
          cfg = JSON.parse(localStorage.getItem('wft_firebase_config')) || {};
        } catch(e) {}"""

content = content.replace(old_code, new_code)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated config fetch in agenda.js")
