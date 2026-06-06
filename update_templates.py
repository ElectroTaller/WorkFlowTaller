import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace notifyContact messages
notify_contact_old = """      if (isForShop) {
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

notify_contact_new = """      const dashes = '- - - - - - - - - - - - - - - - - - - - - - - - -';
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
      }"""

content = content.replace(notify_contact_old, notify_contact_new)

# Replace notifyTech message
idx1 = content.find("notifyTech(aptId) {")
if idx1 != -1:
    idx2 = content.find("const payload = { phone, message: msg };", idx1)
    if idx2 != -1:
        tech_body_old = content[idx1:idx2]
        
        # We find where msg is assigned in tech_body_old
        msg_idx = tech_body_old.find("const msg = `")
        if msg_idx != -1:
            tech_body_new = tech_body_old[:msg_idx] + """const dashes = '- - - - - - - - - - - - - - - - - - - - - - - - -';
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
            content = content[:idx1] + tech_body_new + content[idx2:]
            
with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch complete.")
