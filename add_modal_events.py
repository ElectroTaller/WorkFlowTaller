import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

bind_modal_events = """  bindModalEvents() {
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.hidden = true;
      }
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) modal.hidden = true;
      });
    });
  },

"""

content = content.replace("  bindFormEvents() {", bind_modal_events + "  bindFormEvents() {")

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added bindModalEvents.")
