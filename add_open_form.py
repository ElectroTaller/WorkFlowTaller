import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

open_form = """  openForm(apt = null) {
    const form = document.getElementById('apt-form');
    if(form) form.reset();
    const idField = document.getElementById('apt-field-id');
    if(idField) idField.value = '';

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if(el && val !== undefined) el.value = val;
    };

    if (apt) {
      setVal('apt-field-id', apt.id);
      setVal('apt-field-date', apt.date);
      setVal('apt-field-time', apt.time);
      setVal('apt-field-duration', apt.duration);
      setVal('apt-field-tech', apt.techId);
      setVal('apt-field-building', apt.building);
      setVal('apt-field-apt', apt.apt);
      setVal('apt-field-resident-name', apt.residentName);
      setVal('apt-field-resident-phone', apt.residentPhone);
      setVal('apt-field-contact-name', apt.adminName);
      setVal('apt-field-contact-phone', apt.adminPhone);
      setVal('apt-field-service-type', apt.serviceType);
      
      const chkMan = document.getElementById('ac-chk-mantenimiento');
      const chkDiag = document.getElementById('ac-chk-diagnostico');
      
      if (apt.acWorkTypes) {
        if(chkMan) chkMan.checked = apt.acWorkTypes.includes('mantenimiento');
        if(chkDiag) chkDiag.checked = apt.acWorkTypes.includes('diagnostico_reparacion');
      } else {
        if(chkMan) chkMan.checked = false;
        if(chkDiag) chkDiag.checked = false;
      }
    } else {
      setVal('apt-field-date', new Date().toISOString().split('T')[0]);
    }
    const modal = document.getElementById('modal-appointment');
    if(modal) {
      modal.hidden = false;
      // scroll to top
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent) modalContent.scrollTop = 0;
    }
  },

"""

content = content.replace("  bindModalEvents() {", open_form + "  bindModalEvents() {")

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added openForm.")
