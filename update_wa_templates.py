import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_method(content, method_name, new_body):
    start = content.find(f"{method_name}(")
    if start == -1:
        print(f"Method {method_name} not found")
        return content
    
    # find where payload is declared
    end = content.find("const payload = {", start)
    if end == -1:
        print(f"Payload not found for {method_name}")
        return content
        
    return content[:start] + new_body + "  " + content[end:]

notifyContact_body = """notifyContact(aptId, targetType = 'resident') {
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
        const errMsg = `No hay un número de teléfono guardado para el ${targetName}.`;
        if (window.toast) toast.show('Error', errMsg, 'error');
        else alert(errMsg);
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
      const dashes = '- - - - - - - - - - - - - - - - - - - - - - - - -';
      let durationStr = Math.round((Number(apt.duration) || 120) / 60) + 'h';
      
      if (targetType === 'resident') {
        msg = `🏪 ElectroTaller
📅 CONFIRMACIÓN DE VISITA TÉCNICA
${dashes}
Estimado/a *${(apt.residentName || 'CLIENTE').toUpperCase()}*,

Le confirmamos que nuestro equipo técnico visitará *${(apt.building || 'su ubicación').toUpperCase()}* el día *${apt.date}* a las *${apt.time}*.

⏱️ *Duración estimada:* ${durationStr}

${dashes}
📋 DETALLE DE LA VISITA
${dashes}
🔧 *Servicio:* Aire Acondicionado (${workTypeDesc})
📍 *Apto / Unidad:* ${apt.apt || 'No def.'}
👤 *Residente:* ${(apt.residentName || 'No def.').toUpperCase()}
👷 *Técnico asignado:* ${(techName || 'No asignado').toUpperCase()}
${dashes}
Si necesita reprogramar, contáctenos a la brevedad.

_ElectroTaller - Electronica Automotriz y HVAC_`;
      } else {
        msg = `🏪 ElectroTaller
📅 AVISO DE VISITA TÉCNICA
${dashes}
Estimado/a *${(personName || 'CLIENTE').toUpperCase()}*,

Le informamos que el día *${apt.date}* a las *${apt.time}* recibirá la visita de nuestro técnico de *ElectroTaller*.

⏱️ *Duración estimada:* ${durationStr}
Por favor asegúrese de estar disponible durante ese tiempo.

${dashes}
📋 DETALLE DE LA VISITA
${dashes}
🔧 *Servicio:* Aire Acondicionado (${workTypeDesc})
📍 *Ubicación:* ${(apt.building || 'No def.').toUpperCase()}, ${apt.apt || 'No def.'}
👷 *Técnico:* ${(techName || 'No asignado').toUpperCase()}
${dashes}
🙏 Gracias por su confianza.

_ElectroTaller - Electronica Automotriz y HVAC_`;
      }

"""

notifyTech_body = """notifyTech(aptId) {
    try {
      console.log('notifyTech called with:', aptId);
      const apt = this.appointments.find(a => a.id === aptId);
      if(!apt) {
        alert('Cita no encontrada en memoria.');
        return;
      }
      
      const tech = this.technicians.find(t => t.id === apt.techId);
      if(!tech || !tech.phone) {
        if (window.toast) toast.show('Error', 'El técnico no tiene número asignado.', 'error');
        else alert('El técnico no tiene número asignado.');
        return;
      }

      let phone = tech.phone.replace(/\\D/g, '');
      if (phone.length === 7 || phone.length === 8) phone = '507' + phone;

      let workTypeDesc = 'Mantenimiento General';
      if (apt.acWorkTypes && apt.acWorkTypes.length > 0) {
        workTypeDesc = apt.acWorkTypes.map(w => w === 'mantenimiento' ? 'Mantenimiento' : 'Diagnóstico y Reparación').join(' y ');
      }

      const dashes = '- - - - - - - - - - - - - - - - - - - - - - - - -';
      let durationStr = Math.round((Number(apt.duration) || 120) / 60) + 'h';
      
      const msg = `🏪 ELECTROTALLER
👷 NUEVA VISITA ASIGNADA
${dashes}
Hola *${(tech.name || '').toUpperCase()}*, se te ha asignado la siguiente visita técnica:

📅 *Fecha:* ${apt.date}
⏱️ *Hora:* ${apt.time} (Duración: ${durationStr})

🏢 *UBICACIÓN:*
*PH/Edificio:* ${(apt.building || 'No def.').toUpperCase()}
*Apto:* ${apt.apt || 'No def.'}

👤 *RESIDENTE / INQUILINO:*
*Nombre:* ${(apt.residentName || 'No def.').toUpperCase()}

🔧 *DETALLES DEL TRABAJO:*
*Servicio:* Aire Acondicionado (${workTypeDesc})
*Equipo/Vehículo:* ${apt.deviceDesc || apt.deviceType || 'No especificado'}
*Falla:* ${(apt.reportedFault || 'No especificada').toUpperCase()}
${dashes}
Por favor confirmar de enterado y coordinar con el cliente si es necesario.
_ElectroTaller - Gestión de Agenda_`;

"""

content = replace_method(content, "notifyContact", notifyContact_body)
content = replace_method(content, "notifyTech", notifyTech_body)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished updates.")
