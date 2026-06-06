import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the old notifyContact method
old_notifyContact_pattern = r"notifyContact\(aptId\) \{\s+try \{\s+console\.log\('notifyContact called with:', aptId\);\s+const apt = this\.appointments\.find\(a => a\.id === aptId\);\s+if\(!apt\) \{\s+alert\('Cita no encontrada en memoria\.'\);\s+return;\s+\}\s+const phoneRaw = apt\.residentPhone \|\| apt\.adminPhone;\s+if\(!phoneRaw\) \{\s+if \(window\.toast\) toast\.show\('Error', 'El cliente o administración no tienen teléfono guardado\.', 'error'\);\s+else alert\('El cliente o administración no tienen teléfono guardado\.'\);\s+return;\s+\}\s+let phone = phoneRaw\.replace\(/\\D/g, ''\);\s+if \(phone\.length === 7 \|\| phone\.length === 8\) phone = '507' \+ phone;\s+let workTypeDesc = 'Mantenimiento General';\s+if \(apt\.acWorkTypes && apt\.acWorkTypes\.length > 0\) \{\s+workTypeDesc = apt\.acWorkTypes\.map\(w => w === 'mantenimiento' \? 'Mantenimiento' : 'Diagnóstico y Reparación'\)\.join\(' y '\);\s+\}\s+const tech = this\.technicians\.find\(t => t\.id === apt\.techId\);\s+const techName = tech \? tech\.name : 'uno de nuestros técnicos';\s+const msg = `Hola \*\$\{apt\.residentName \|\| apt\.adminName \|\| 'cliente'\}\*,\s+Te escribimos de \*ELECTROTALLER\* ⚡\s+Te confirmamos tu cita técnica programada para:\s+📅 \*\$\{apt\.date\}\* a las \*\$\{apt\.time\}\*\s+Se te ha asignado a \*\$\{techName\}\* para realizar el servicio de \*\$\{workTypeDesc\}\* en tu ubicación \(\$\{apt\.building \|\| ''\} - \$\{apt\.apt \|\| ''\}\)\.\s+Cualquier duda adicional, estamos a tu disposición\. ¡Saludos!`;"

new_notifyContact = """notifyContact(aptId, targetType = 'resident') {
    try {
      console.log('notifyContact called with:', aptId, targetType);
      const apt = this.appointments.find(a => a.id === aptId);
      if(!apt) {
        alert('Cita no encontrada en memoria.');
        return;
      }
      
      let phoneRaw = '';
      let targetName = '';
      let personName = '';
      let isForShop = false;

      if (targetType === 'resident') {
        phoneRaw = apt.residentPhone;
        targetName = 'cliente / residente';
        personName = apt.residentName || 'cliente';
      } else if (targetType === 'admin') {
        phoneRaw = apt.adminPhone;
        targetName = 'administrador / encargado';
        personName = apt.adminName || 'encargado';
      } else if (targetType === 'electro') {
        const cfg = window.firebaseModule?.getConfig() || {};
        phoneRaw = cfg.shopPhone;
        targetName = 'taller (ElectroTaller)';
        isForShop = true;
      } else {
        phoneRaw = apt.residentPhone || apt.adminPhone;
        targetName = 'cliente';
      }

      if(!phoneRaw) {
        const msg = `No hay un número de teléfono guardado para el ${targetName}.`;
        if (window.toast) toast.show('Error', msg, 'error');
        else alert(msg);
        return;
      }

      let phone = phoneRaw.replace(/\\D/g, '');
      if (phone.length === 7 || phone.length === 8) phone = '507' + phone;

      let workTypeDesc = 'Mantenimiento General';
      if (apt.acWorkTypes && apt.acWorkTypes.length > 0) {
        workTypeDesc = apt.acWorkTypes.map(w => w === 'mantenimiento' ? 'Mantenimiento' : 'Diagnóstico y Reparación').join(' y ');
      }
      
      const tech = this.technicians.find(t => t.id === apt.techId);
      const techName = tech ? tech.name : 'uno de nuestros técnicos';

      let msg = '';
      
      if (isForShop) {
        msg = `Notificación de Cita (Resumen Interno) 📋
Edificio/PH: *${apt.building || 'No def.'}*
Apto/Casa: *${apt.apt || 'No def.'}*

Cliente: *${apt.residentName || 'No def.'}*
Técnico: *${techName}*
Servicio: *${workTypeDesc}*
Fecha: *${apt.date}* a las *${apt.time}*

Esta cita ha sido agendada en el sistema.`;
      } else {
        msg = `Hola *${personName}*,
Te escribimos de *ELECTROTALLER* ⚡

Te confirmamos tu cita técnica programada para:
📅 *${apt.date}* a las *${apt.time}*

Se te ha asignado a *${techName}* para realizar el servicio de *${workTypeDesc}* en tu ubicación (${apt.building || ''} - ${apt.apt || ''}).

Cualquier duda adicional, estamos a tu disposición. ¡Saludos!`;
      }"""

# Using string find and replace since regex with multi-line can be tricky
idx1 = content.find("notifyContact(aptId) {")
if idx1 != -1:
    idx2 = content.find("const payload = { phone, message: msg };", idx1)
    if idx2 != -1:
        content = content[:idx1] + new_notifyContact + "\n\n        " + content[idx2:]
        with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully updated agenda.js")
    else:
        print("Error: Could not find payload assignment")
else:
    print("Error: Could not find notifyContact")
