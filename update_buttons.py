import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the three buttons
html = re.sub(
    r'id="btn-apt-wa-resident"[^>]*?onclick="[^"]*notifyContact\([^"]*?\)"',
    'id="btn-apt-wa-resident" title="Notificar WhatsApp al residente/inquilino" onclick="if(window.agendaModule) window.agendaModule.notifyContact(document.getElementById(\'apt-field-id\').value, \'resident\')"',
    html
)

html = re.sub(
    r'id="btn-apt-wa-res-to-contact"[^>]*?onclick="[^"]*notifyContact\([^"]*?\)"',
    'id="btn-apt-wa-res-to-contact" title="Enviar WhatsApp a ElectroTaller" onclick="if(window.agendaModule) window.agendaModule.notifyContact(document.getElementById(\'apt-field-id\').value, \'electro\')"',
    html
)

html = re.sub(
    r'id="btn-apt-wa-contact"[^>]*?onclick="[^"]*notifyContact\([^"]*?\)"',
    'id="btn-apt-wa-contact" title="Notificar WhatsApp al encargado/administrador" onclick="if(window.agendaModule) window.agendaModule.notifyContact(document.getElementById(\'apt-field-id\').value, \'admin\')"',
    html
)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
