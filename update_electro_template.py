import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update personName in electro block
old_electro = """      } else if (targetType === 'electro') {
        let cfg = {};
        try {
          cfg = JSON.parse(localStorage.getItem('wft_firebase_config')) || {};
        } catch(e) {}
        phoneRaw = cfg.shopPhone;
        targetName = 'taller (ElectroTaller)';
        isForShop = true;
      }"""

new_electro = """      } else if (targetType === 'electro') {
        let cfg = {};
        try {
          cfg = JSON.parse(localStorage.getItem('wft_firebase_config')) || {};
        } catch(e) {}
        phoneRaw = cfg.shopPhone;
        targetName = 'taller (ElectroTaller)';
        personName = apt.residentName || 'cliente';
        isForShop = true;
      }"""

content = content.replace(old_electro, new_electro)

# 2. Make electro use the resident template
old_if = "if (targetType === 'resident') {"
new_if = "if (targetType === 'resident' || targetType === 'electro') {"
content = content.replace(old_if, new_if)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated electro template logic.")
