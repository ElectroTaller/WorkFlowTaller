with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

missing_block = """        this.notifyTech(apt.id);
      });
    }

    card.addEventListener('click', () => {
      this.openForm(apt);
    });

    return card;
  },

  /* ================== FORM & MODALS ================== */
  bindFormEvents() {
    const form = document.getElementById('apt-form');
    document.getElementById('btn-apt-save')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (form.checkValidity()) {
        this.saveForm();
      } else {
        form.reportValidity();
      }
    });

    document.getElementById('btn-apt-cancel')?.addEventListener('click', () => {
      document.getElementById('modal-appointment').hidden = true;
    });
    
    document.getElementById('modal-apt-close')?.addEventListener('click', () => {
      document.getElementById('modal-appointment').hidden = true;
    });

    document.getElementById('btn-apt-wa-tech')?.addEventListener('click', () => {
      const id = document.getElementById('apt-field-id').value;
      if (id) this.notifyTech(id);
      else alert('Por favor, guarda la cita primero.');
    });

    document.getElementById('btn-apt-wa-contact')?.addEventListener('click', () => {
      const id = document.getElementById('apt-field-id').value;
      if (id) this.notifyContact(id, 'admin');
      else alert('Por favor, guarda la cita primero.');
    });

    const chkMan = document.getElementById('ac-chk-mantenimiento');
    const chkDiag = document.getElementById('ac-chk-diagnostico');
    const hidType = document.getElementById('apt-field-ac-subtype');
    
    const updateHidden = () => {
      let vals = [];
      if(chkMan?.checked) vals.push('mantenimiento');
      if(chkDiag?.checked) vals.push('diagnostico_reparacion');
      if(hidType) hidType.value = vals.join(',');
    };
    
    chkMan?.addEventListener('change', updateHidden);
    chkDiag?.addEventListener('change', updateHidden);

    // Save Tech
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
    });

    // Save Location
    document.getElementById('btn-loc-save')?.addEventListener('click', () => {
      const name = document.getElementById('loc-f-name').value;
      if(!name) return toast.show('Error', 'Ingresa el nombre del PH', 'warning');
      const data = {
        id: Date.now().toString(),
        name,
        apt: document.getElementById('loc-f-apt').value,
        address: document.getElementById('loc-f-address').value,
        residentName: document.getElementById('loc-f-resident-name').value,
        residentPhone: document.getElementById('loc-f-resident-phone').value,
        adminName: document.getElementById('loc-f-contact-name').value,
        adminPhone: document.getElementById('loc-f-contact-phone').value,
        notes: document.getElementById('loc-f-notes').value
      };
      this.locations.push(data);
      this.saveLocations();
      this.loadLocations();
      
      // Limpiar form
      ['loc-f-name', 'loc-f-apt', 'loc-f-address', 'loc-f-resident-name', 'loc-f-resident-phone', 'loc-f-contact-name', 'loc-f-contact-phone', 'loc-f-notes'].forEach(id => {
         const el = document.getElementById(id);
         if(el) el.value = '';
      });
      document.getElementById('modal-locs').hidden = true;
      toast.show('Guardado', 'Ubicación guardada', 'success');
    });
  },

  """

content = content.replace("notifyTech(aptId) {\n    try {\n      console.log('notifyTech called with:', aptId);", missing_block + "notifyTech(aptId) {\n    try {\n      console.log('notifyTech called with:', aptId);")

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/agenda.js', 'w', encoding='utf-8') as f:
    f.write(content)
