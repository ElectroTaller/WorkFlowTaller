import os
import re

app_path = r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\agenda.js'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

calendar_methods = ['setWeekStart', 'renderCalendar', 'buildCard']
modal_methods = ['loadTechnicians', 'saveTechnicians', 'renderTechLegend', 'populateTechSelect', 'renderTechList', 'editTech', 'deleteTech', 'loadLocations', 'loadDefaultLocations', 'saveLocations', 'renderLocList', 'editLoc', 'deleteLoc', 'initAutocomplete', 'fillLocationData', 'openForm', 'selectServiceType', 'bindModalEvents', 'bindFormEvents', 'saveForm']

calendar_code = []
modal_code = []
new_agenda_lines = []

i = 0
while i < len(lines):
    line = lines[i]
    
    match = re.match(r'^  ([a-zA-Z0-9_]+)\s*\(', line)
    if match:
        func_name = match.group(1)
        
        if func_name in calendar_methods or func_name in modal_methods:
            func_lines = [line]
            brace_count = line.count('{') - line.count('}')
            
            i += 1
            while i < len(lines) and brace_count > 0:
                l = lines[i]
                func_lines.append(l)
                brace_count += l.count('{') - l.count('}')
                i += 1
            
            # remove trailing comma if it got attached to the last line inside the func block
            if func_lines[-1].endswith(','):
                func_lines[-1] = func_lines[-1][:-1]
                
            # skip the next line if it's just a comma
            if i < len(lines) and lines[i].strip() == ',':
                i += 1
                
            code_block = '\n'.join(func_lines)
            if func_name in calendar_methods:
                calendar_code.append(code_block)
            else:
                modal_code.append(code_block)
                
            continue

    if 'const agendaModule = {' in line:
        new_agenda_lines.append(line)
        new_agenda_lines.append('  ...window.agendaCalendarMixin,')
        new_agenda_lines.append('  ...window.agendaModalsMixin,')
    else:
        new_agenda_lines.append(line)
        
    i += 1

cal_content = "window.agendaCalendarMixin = {\n" + ",\n\n".join(calendar_code) + "\n};\n"
mod_content = "window.agendaModalsMixin = {\n" + ",\n\n".join(modal_code) + "\n};\n"

os.makedirs(r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\js\agenda', exist_ok=True)
with open(r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\js\agenda\calendar.js', 'w', encoding='utf-8') as f: f.write(cal_content)
with open(r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\js\agenda\modals.js', 'w', encoding='utf-8') as f: f.write(mod_content)
with open(app_path, 'w', encoding='utf-8') as f: f.write('\n'.join(new_agenda_lines))

print('Phase 4 Extraction Done!')
