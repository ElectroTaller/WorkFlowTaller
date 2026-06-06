import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update save logic
save_logic_old = """      // Save Tech
      document.getElementById('btn-tech-save')?.addEventListener('click', () => {
        const name = document.getElementById('tech-f-name').value;
        const phone = document.getElementById('tech-f-phone').value;
        if(!name) return toast.show('Error', 'Ingresa el nombre', 'warning');
        const id = Date.now().toString();
        const colors = ['#f44336', '#9c27b0', '#3f51b5', '#009688', '#ffeb3b', '#ff9800'];
        const color = colors[this.technicians.length % colors.length];
        this.technicians.push({ id, name, phone, color });
        this.saveTechnicians();
        this.loadTechnicians();
        document.getElementById('tech-f-name').value = '';
        document.getElementById('tech-f-phone').value = '';
        document.getElementById('tech-f-id').value = '';
        toast.show('Guardado', 'Técnico agregado', 'success');
      });"""

save_logic_new = """      // Save Tech
      document.getElementById('btn-tech-save')?.addEventListener('click', () => {
        const name = document.getElementById('tech-f-name').value;
        const phone = document.getElementById('tech-f-phone').value;
        const idField = document.getElementById('tech-f-id').value;
        if(!name) return toast.show('Error', 'Ingresa el nombre', 'warning');
        
        if (idField) {
          // Update existing
          const tech = this.technicians.find(t => t.id === idField);
          if (tech) {
            tech.name = name;
            tech.phone = phone;
            toast.show('Guardado', 'Técnico actualizado', 'success');
          }
        } else {
          // Add new
          const id = Date.now().toString();
          const colors = ['#f44336', '#9c27b0', '#3f51b5', '#009688', '#ffeb3b', '#ff9800'];
          const color = colors[this.technicians.length % colors.length];
          this.technicians.push({ id, name, phone, color });
          toast.show('Guardado', 'Técnico agregado', 'success');
        }
        
        this.saveTechnicians();
        this.loadTechnicians();
        document.getElementById('tech-f-name').value = '';
        document.getElementById('tech-f-phone').value = '';
        document.getElementById('tech-f-id').value = '';
      });"""

# Handle encoding differences in the old logic (it might have TǸcnico instead of Técnico)
if 'T\u01f8cnico agregado' in content: # 'TǸcnico'
    save_logic_old = save_logic_old.replace('Técnico', 'T\u01f8cnico')

# It's better to just find the block and replace it using regex to avoid exact match issues
import re
content = re.sub(
    r"// Save Tech\s+document\.getElementById\('btn-tech-save'\)\?\.addEventListener\('click', \(\) => \{\s+const name = document\.getElementById\('tech-f-name'\)\.value;\s+const phone = document\.getElementById\('tech-f-phone'\)\.value;\s+if\(!name\) return toast\.show\('Error', 'Ingresa el nombre', 'warning'\);\s+const id = Date\.now\(\)\.toString\(\);\s+const colors = \['#f44336', '#9c27b0', '#3f51b5', '#009688', '#ffeb3b', '#ff9800'\];\s+const color = colors\[this\.technicians\.length % colors\.length\];\s+this\.technicians\.push\(\{ id, name, phone, color \}\);\s+this\.saveTechnicians\(\);\s+this\.loadTechnicians\(\);\s+document\.getElementById\('tech-f-name'\)\.value = '';\s+document\.getElementById\('tech-f-phone'\)\.value = '';\s+document\.getElementById\('tech-f-id'\)\.value = '';\s+toast\.show\('Guardado', '[^']+', 'success'\);\s+\}\);",
    save_logic_new,
    content
)

# 2. Update renderTechList
render_old = r"renderTechList\(\) \{[\s\S]*?el\.innerHTML = html;\s+\},"
render_new = """renderTechList() {
    const el = document.getElementById('techs-list');
    if(!el) return;
    if(this.technicians.length === 0) {
      el.innerHTML = '<p>No hay técnicos registrados.</p>';
      return;
    }
    let html = '';
    this.technicians.forEach((t, index) => {
       html += `<div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-main); padding:8px; border-radius:4px; margin-bottom: 5px;">
         <div style="display:flex; align-items:center; gap:10px;">
           <span style="width:16px; height:16px; border-radius:50%; background:${t.color || '#fff'};"></span>
           <strong>${utils.escape(t.name)}</strong> - ${utils.escape(t.phone || 'Sin tel')}
         </div>
         <div style="display:flex; gap:5px;">
           <button class="btn btn-ghost btn-icon" style="color:var(--c-primary);" onclick="agendaModule.editTech(${index})" title="Editar">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
           </button>
           <button class="btn btn-ghost btn-icon" style="color:var(--c-danger);" onclick="agendaModule.deleteTech(${index})" title="Eliminar">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
           </button>
         </div>
       </div>`;
    });
    el.innerHTML = html;
  },
  
  editTech(index) {
    const tech = this.technicians[index];
    if(tech) {
      const elName = document.getElementById('tech-f-name');
      const elPhone = document.getElementById('tech-f-phone');
      const elId = document.getElementById('tech-f-id');
      if (elName) elName.value = tech.name;
      if (elPhone) elPhone.value = tech.phone || '';
      if (elId) elId.value = tech.id;
      
      const modal = document.getElementById('modal-techs');
      if (modal && modal.querySelector('.modal-content')) {
        modal.querySelector('.modal-content').scrollTop = 0;
      }
    }
  },"""

content = re.sub(render_old, render_new, content)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch complete.")
