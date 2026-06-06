import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the else block template
old_else_block = """      } else {
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

new_else_block = """      } else {
        msg = `🏪 ElectroTaller
📅 CONFIRMACIÓN DE VISITA TÉCNICA
${dashes}
Estimado/a *${(personName || 'CLIENTE').toUpperCase()}*,

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
      }"""

content = content.replace(old_else_block, new_else_block)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated admin template.")
