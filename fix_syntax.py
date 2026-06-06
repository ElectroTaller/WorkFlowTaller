with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("this.notifyTech(aptId) {", "notifyTech(aptId) {")
content = content.replace("this.notifyContact(aptId", "notifyContact(aptId") # just in case

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed syntax error.")
