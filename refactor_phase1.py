import os

app_updated_path = r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\app_updated.js'
with open(app_updated_path, 'r', encoding='utf-8') as f: lines = f.readlines()

start_idx, end_idx = -1, -1
for i, line in enumerate(lines):
    if 'const utils = {' in line:
        if start_idx == -1: start_idx = max(0, i - 3)
    if 'const ordersModule = {' in line:
        if end_idx == -1: end_idx = max(0, i - 3)
        break

if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
    new_lines = lines[:start_idx] + lines[end_idx:]
    with open(app_updated_path, 'w', encoding='utf-8') as f: f.writelines(new_lines)
    print('app_updated.js refactored.')
else: print('Failed on app_updated.js')

app_path = r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\app.js'
with open(app_path, 'r', encoding='utf-8') as f: lines = f.readlines()
start_idx, end_idx = -1, -1
for i, line in enumerate(lines):
    if 'const utils = {' in line:
        if start_idx == -1: start_idx = max(0, i - 3)
    if 'const ordersModule = {' in line:
        if end_idx == -1: end_idx = max(0, i - 3)
        break

if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
    new_lines = lines[:start_idx] + lines[end_idx:]
    with open(app_path, 'w', encoding='utf-8') as f: f.writelines(new_lines)
    print('app.js refactored.')
else: print('Failed on app.js')

def fix_html(p):
    with open(p, 'r', encoding='utf-8') as f: c = f.read()
    added = '  <!-- Módulos Core -->\n  <script src="js/core/utils.js"></script>\n  <script src="js/core/toast.js"></script>\n  <script src="js/core/firebase.js"></script>\n'
    if 'js/core/utils.js' not in c:
        if '<script src="app_updated.js' in c: c = c.replace('<script src="app_updated.js', added + '  <script src="app_updated.js')
        elif '<script src="app.js' in c: c = c.replace('<script src="app.js', added + '  <script src="app.js')
        with open(p, 'w', encoding='utf-8') as f: f.write(c)
        print(p, 'updated.')
        
fix_html(r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\index_updated.html')
fix_html(r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\index.html')
