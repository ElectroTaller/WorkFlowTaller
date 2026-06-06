import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """    document.getElementById('btn-apt-wa-contact')?.addEventListener('click', () => {
      const id = document.getElementById('apt-field-id').value;
      if (id) this.notifyContact(id, 'admin');
      else alert('Por favor, guarda la cita primero.');
    });"""

new_code = """    document.getElementById('btn-apt-wa-contact')?.addEventListener('click', () => {
      const id = document.getElementById('apt-field-id').value;
      if (id) this.notifyContact(id, 'admin');
      else alert('Por favor, guarda la cita primero.');
    });

    document.getElementById('btn-apt-wa-resident')?.addEventListener('click', () => {
      const id = document.getElementById('apt-field-id').value;
      if (id) this.notifyContact(id, 'resident');
      else alert('Por favor, guarda la cita primero.');
    });

    document.getElementById('btn-apt-wa-res-to-contact')?.addEventListener('click', () => {
      const id = document.getElementById('apt-field-id').value;
      if (id) this.notifyContact(id, 'electro');
      else alert('Por favor, guarda la cita primero.');
    });"""

content = content.replace(old_code, new_code)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added event listeners to buttons.")
