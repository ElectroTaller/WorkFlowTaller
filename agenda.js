/* agenda.js - Reconstrucción del Módulo de Agenda */
const agendaModule = {
  dbCollection: 'appointments',
  appointments: [],
  currentWeekStart: new Date(),
  technicians: [],
  locations: [],
  unsubscribe: null,

  init() {
    this.bindNavigation();
    this.loadTechnicians();
    this.loadLocations();
    this.bindFormEvents();
    this.bindModalEvents();
    this.initAutocomplete();

    // Set to current week's Monday
    this.setWeekStart(new Date());

    // Listen to Firebase
    this.startListening();
  },

  bindNavigation() {
    const btnAgenda = document.getElementById('btn-agenda');
    const btnBack = document.getElementById('btn-agenda-back');
    const kanban = document.getElementById('kanban-wrapper');
    const kpi = document.getElementById('kpi-section');
    const agendaView = document.getElementById('agenda-view');

    btnAgenda?.addEventListener('click', () => {
      if (kanban) kanban.hidden = true;
      if (kpi) kpi.hidden = true;
      if (agendaView) agendaView.hidden = false;
      this.renderCalendar();
    });

    btnBack?.addEventListener('click', () => {
      if (agendaView) agendaView.hidden = true;
      if (kpi) kpi.hidden = false;
      if (kanban) kanban.hidden = false;
    });

    // Week navigation
    document.getElementById('btn-week-prev')?.addEventListener('click', () => {
      this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
      this.renderCalendar();
    });
    document.getElementById('btn-week-next')?.addEventListener('click', () => {
      this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
      this.renderCalendar();
    });
    document.getElementById('btn-week-today')?.addEventListener('click', () => {
      this.setWeekStart(new Date());
      this.renderCalendar();
    });

    // New Appointment
    document.getElementById('btn-new-apt')?.addEventListener('click', () => {
      this.openForm();
    });
  },

  setWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    if (day !== 1) d.setHours(-24 * (day - 1));
    d.setHours(0, 0, 0, 0);
    this.currentWeekStart = d;
  },

  /* ================== TECHNICIANS (CRUD) ================== */
  loadTechnicians() {
    try {
      const stored = localStorage.getItem('wft_technicians');
      if (stored) {
        this.technicians = JSON.parse(stored);
      } else {
        this.technicians = [
          { id: '1', name: 'Técnico 1', phone: '', phone2: '', color: '#4caf50' },
          { id: '2', name: 'Técnico 2', phone: '', phone2: '', color: '#2196f3' }
        ];
        this.saveTechnicians();
      }
      this.renderTechLegend();
      this.populateTechSelect();
      this.renderTechList();
    } catch (e) {
      console.error(e);
      this.technicians = [];
    }
  },
  saveTechnicians() {
    localStorage.setItem('wft_technicians', JSON.stringify(this.technicians));
  },
  renderTechLegend() {
    const el = document.getElementById('tech-legend');
    if (!el) return;
    el.innerHTML = this.technicians.map(t =>
      `<span style="color:${t.color || '#fff'}; font-weight:bold;">${utils.escape(t.name)}</span>`
    ).join(' | ');
  },
  populateTechSelect() {
    const sel = document.getElementById('apt-field-tech');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccionar técnico...</option>' +
      this.technicians.map(t => `<option value="${t.id}">${utils.escape(t.name)}</option>`).join('');
  },
  renderTechList() {
    const el = document.getElementById('techs-list');
    if (!el) return;
    if (this.technicians.length === 0) {
      el.innerHTML = '<p>No hay técnicos registrados.</p>';
      return;
    }
    let html = '';
    this.technicians.forEach((t, index) => {
      const phoneDisplay = [t.phone, t.phone2].filter(Boolean).join(' / ') || 'Sin tel';
      html += `<div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-main); padding:8px; border-radius:4px; margin-bottom: 5px;">
         <div style="display:flex; align-items:center; gap:10px;">
           <span style="width:16px; height:16px; border-radius:50%; background:${t.color || '#fff'};"></span>
           <strong>${utils.escape(t.name)}</strong> - ${utils.escape(phoneDisplay)}
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
    if (tech) {
      const elName = document.getElementById('tech-f-name');
      const elPhone = document.getElementById('tech-f-phone');
      const elPhone2 = document.getElementById('tech-f-phone2');
      const elId = document.getElementById('tech-f-id');
      const editId = document.getElementById('tech-edit-id');
      
      if (editId) editId.value = tech.id;
      if (elName) elName.value = tech.name || '';
      if (elPhone) elPhone.value = tech.phone || '';
      if (elPhone2) elPhone2.value = tech.phone2 || '';
      if (elId) elId.value = tech.cedula || '';

      const formLabel = document.getElementById('tech-form-label');
      if (formLabel) formLabel.innerText = '✏️ Editar Técnico';

      const btnCancel = document.getElementById('btn-tech-cancel-edit');
      if (btnCancel) btnCancel.style.display = 'inline-block';

      const modal = document.getElementById('modal-technicians');
      if (modal && modal.querySelector('.modal-panel')) {
        modal.querySelector('.modal-panel').scrollTop = 0;
      }
    }
  },
  deleteTech(index) {
    if (confirm('¿Seguro que deseas eliminar a este técnico?')) {
      this.technicians.splice(index, 1);
      this.saveTechnicians();
      this.loadTechnicians();
      toast.show('Eliminado', 'Técnico eliminado', 'success');
    }
  },

  formatDuration(mins) {
    const m = parseInt(mins);
    if (isNaN(m) || m === 0) return 'Indefinido';
    if (m < 60) return `${m} min`;
    if (m === 60) return '1 hora';
    if (m === 90) return '1.5 horas';
    if (m === 1440) return '1 día';
    if (m === 2880) return '2 días';
    if (m === 4320) return '3 días';
    if (m % 60 === 0) return `${m / 60} horas`;
    return `${(m / 60).toFixed(1)} horas`;
  },

  /* ================== LOCATIONS (CRUD & AUTOCOMPLETE) ================== */
  loadLocations() {
    try {
      const stored = localStorage.getItem('wft_locations');
      if (stored) {
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrar formato antiguo de llaves a formato nuevo si es necesario
          parsed = parsed.map(l => {
            if (l.buildingName && !l.name) l.name = l.buildingName;
            if (l.aptNumber && !l.apt) l.apt = l.aptNumber;
            if (l.contactName && !l.adminName) l.adminName = l.contactName;
            if (l.contactPhone && !l.adminPhone) l.adminPhone = l.contactPhone;
            return l;
          });
          this.locations = parsed;
        } else {
          this.loadDefaultLocations();
        }
      } else {
        this.loadDefaultLocations();
      }
      this.renderLocList();
    } catch (e) {
      console.error('Error loadLocations:', e);
      this.loadDefaultLocations();
      this.renderLocList();
    }
  },
  loadDefaultLocations() {
    this.locations = [
      { id: 'loc_1', name: 'PH Torres del Pacífico', apt: 'Apto 14-B', address: 'Av. Balboa, Cd. de Panamá', residentName: 'Juan Pérez', residentPhone: '+507 6222-3333', adminName: 'Luis Ramos', adminPhone: '+507 6222-1111', notes: 'Entrar por garita de seguridad' },
      { id: 'loc_2', name: 'PH Altamira', apt: 'Local 3', address: 'Vía España, Bella Vista', residentName: 'Ana Smith', residentPhone: '+507 6333-4444', adminName: 'María Gómez', adminPhone: '+507 6333-2222', notes: 'Código de portón #1024' },
      { id: 'loc_3', name: 'Edificio Las Orquídeas', apt: 'Apto 2A', address: 'San Francisco, Calle 74', residentName: 'Carlos Ruiz', residentPhone: '+507 6444-5555', adminName: 'Roberto Chang', adminPhone: '+507 6444-3333', notes: 'Estacionamiento de visitas #12 o #13' }
    ];
    this.saveLocations();
  },
  saveLocations() {
    localStorage.setItem('wft_locations', JSON.stringify(this.locations));
  },
  renderLocList(query = '') {
    const el = document.getElementById('locs-list');
    if (!el) return;

    let filtered = this.locations;
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(l => (l.name || '').toLowerCase().includes(q) || (l.residentName || '').toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      el.innerHTML = '<p>No hay ubicaciones registradas.</p>';
      return;
    }
    let html = '';
    filtered.forEach((l, index) => {
      const realIndex = this.locations.indexOf(l);
      html += `<div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-main); padding:8px; border-radius:4px; border-bottom:1px solid var(--c-border-light);">
         <div>
           <strong>${utils.escape(l.name)} ${l.apt ? `(${utils.escape(l.apt)})` : ''}</strong><br>
           <span style="font-size:0.8rem; color:var(--t-secondary);">Res: ${utils.escape(l.residentName || 'N/A')}</span>
         </div>
         <div style="display:flex; gap:4px;">
           <button class="btn btn-ghost btn-icon" style="color:var(--c-primary);" onclick="agendaModule.editLoc(${realIndex})" title="Editar">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
           </button>
           <button class="btn btn-ghost btn-icon" style="color:var(--c-danger);" onclick="agendaModule.deleteLoc(${realIndex})" title="Eliminar">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
           </button>
         </div>
       </div>`;
    });
    el.innerHTML = html;
  },
  editLoc(index) {
    const loc = this.locations[index];
    if (loc) {
      document.getElementById('loc-edit-id').value = loc.id;
      document.getElementById('loc-f-name').value = loc.name || '';
      document.getElementById('loc-f-apt').value = loc.apt || '';
      document.getElementById('loc-f-address').value = loc.address || '';
      document.getElementById('loc-f-resident-name').value = loc.residentName || '';
      document.getElementById('loc-f-resident-phone').value = loc.residentPhone || '';
      document.getElementById('loc-f-contact-name').value = loc.adminName || '';
      document.getElementById('loc-f-contact-phone').value = loc.adminPhone || '';
      document.getElementById('loc-f-notes').value = loc.notes || '';

      const formLabel = document.getElementById('loc-form-label');
      if (formLabel) formLabel.innerText = '✏️ Editar Ubicación';

      const btnCancel = document.getElementById('btn-loc-cancel-edit');
      if (btnCancel) btnCancel.style.display = 'inline-block';

      const modal = document.getElementById('modal-locations');
      if (modal && modal.querySelector('.modal-panel')) {
        modal.querySelector('.modal-panel').scrollTop = 0;
      }
    }
  },
  deleteLoc(index) {
    if (confirm('¿Seguro que deseas eliminar esta ubicación?')) {
      this.locations.splice(index, 1);
      this.saveLocations();
      this.loadLocations();
      toast.show('Eliminada', 'Ubicación eliminada', 'success');
    }
  },
  initAutocomplete() {
    const buildingInput = document.getElementById('apt-field-building');
    if (!buildingInput) return;

    let dropdown = document.getElementById('ph-autocomplete-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'ph-autocomplete-dropdown';
      dropdown.className = 'autocomplete-dropdown';
      dropdown.style.display = 'none';

      dropdown.style.position = 'absolute';
      dropdown.style.background = 'var(--c-bg-2)';
      dropdown.style.border = '1px solid var(--c-border)';
      dropdown.style.borderRadius = 'var(--radius-md)';
      dropdown.style.width = '100%';
      dropdown.style.maxHeight = '200px';
      dropdown.style.overflowY = 'auto';
      dropdown.style.zIndex = '100';
      dropdown.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
      dropdown.style.marginTop = '4px';

      buildingInput.parentNode.style.position = 'relative';
      buildingInput.parentNode.appendChild(dropdown);
    }

    buildingInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase();
      if (!val) { dropdown.style.display = 'none'; return; }

      const matches = this.locations.filter(loc =>
        (loc.name || '').toLowerCase().includes(val) || (loc.address || '').toLowerCase().includes(val)
      );

      dropdown.innerHTML = '';
      if (matches.length === 0) {
        dropdown.innerHTML = `<div style="padding:10px; color:var(--t-secondary); font-size:0.85rem;">No se encontraron ubicaciones guardadas. <span style="color:var(--c-accent); cursor:pointer;" onclick="document.getElementById('btn-manage-locations').click();">Registrar nueva</span></div>`;
      } else {
        matches.forEach(loc => {
          const item = document.createElement('div');
          item.style.padding = '10px';
          item.style.cursor = 'pointer';
          item.style.borderBottom = '1px solid var(--c-border-light)';
          item.style.fontSize = '0.85rem';
          item.innerText = `${loc.name} ${loc.apt ? '- ' + loc.apt : ''}`;

          item.addEventListener('mouseover', () => item.style.background = 'var(--c-bg-3)');
          item.addEventListener('mouseout', () => item.style.background = 'transparent');

          item.addEventListener('click', () => {
            this.fillLocationData(loc);
            dropdown.style.display = 'none';
          });
          dropdown.appendChild(item);
        });
      }
      dropdown.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
      if (e.target !== buildingInput) dropdown.style.display = 'none';
    });
  },
  fillLocationData(loc) {
    document.getElementById('apt-field-building').value = loc.name || '';
    document.getElementById('apt-field-apt').value = loc.apt || '';
    document.getElementById('apt-field-resident-name').value = loc.residentName || '';
    document.getElementById('apt-field-resident-phone').value = loc.residentPhone || '';
    document.getElementById('apt-field-contact-name').value = loc.adminName || '';
    document.getElementById('apt-field-contact-phone').value = loc.adminPhone || '';
    if (document.getElementById('apt-field-ac-notes')) {
      document.getElementById('apt-field-ac-notes').value = loc.notes || '';
    }
  },

  /* ================== FIREBASE & CALENDAR ================== */
  startListening() {
    if (!firebaseModule.isConnected || !firebaseModule.db) return;
    if (this.unsubscribe) this.unsubscribe();

    this.unsubscribe = firebaseModule.db.collection(this.dbCollection)
      .onSnapshot(snapshot => {
        this.appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.renderCalendar();
      }, err => console.error('Error agendas:', err));
  },

  renderCalendar() {
    const title = document.getElementById('agenda-week-title');
    if (title) {
      const endWeek = new Date(this.currentWeekStart);
      endWeek.setDate(endWeek.getDate() + 6);
      title.innerText = `Semana del ${utils.formatDate(this.currentWeekStart)} al ${utils.formatDate(endWeek)}`;
    }

    for (let i = 0; i < 7; i++) {
      const d = new Date(this.currentWeekStart);
      d.setDate(d.getDate() + i);
      const span = document.getElementById(`wc-num-${i}`);
      if (span) span.innerText = d.getDate();

      const col = document.getElementById(`wc-col-${i}`);
      if (col) col.innerHTML = '';
    }

    const timeCol = document.getElementById('wc-time-col');
    if (timeCol && timeCol.children.length === 0) {
      let html = '';
      for (let h = 6; h <= 18; h++) {
        let h12 = h % 12;
        h12 = h12 ? h12 : 12;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const bg = (h % 2 === 0) ? 'background: hsla(220, 15%, 20%, 0.5);' : 'background: transparent;';
        const border = 'border-bottom: 1px solid var(--c-border-light);';
        html += `<div class="wc-hour-label" style="height:100px; box-sizing:border-box; width:100%; ${bg} ${border}"><span>${h12}:00 ${ampm}</span></div>`;
      }
      timeCol.innerHTML = html;
    }

    // Generar los slots de la cuadrícula en cada columna siempre (ya que se limpian arriba)
    for (let i = 0; i < 7; i++) {
      const col = document.getElementById(`wc-col-${i}`);
      if (col) {
        let gridHtml = '';
        for (let h = 6; h <= 18; h++) {
          const bg = (h % 2 === 0) ? 'background: hsla(220, 15%, 20%, 0.5);' : 'background: transparent;';
          const border = 'border-bottom: 1px solid var(--c-border-light);';
          gridHtml += `<div class="wc-hour-slot" style="height:100px; box-sizing:border-box; width:100%; ${bg} ${border}"></div>`;
        }
        col.innerHTML = gridHtml;
      }
    }

    // Renderizar visitas por día resolviendo solapamientos
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const col = document.getElementById(`wc-col-${dayIndex}`);
      if (!col) continue;

      // Filtrar las visitas de la semana actual para este día
      const dayApts = this.appointments.filter(apt => {
        const aptDate = new Date(apt.date + 'T00:00:00');
        const aptWeekStart = new Date(aptDate);
        const day = aptWeekStart.getDay() || 7;
        if (day !== 1) aptWeekStart.setHours(-24 * (day - 1));
        aptWeekStart.setHours(0, 0, 0, 0);

        if (aptWeekStart.getTime() !== this.currentWeekStart.getTime()) return false;
        const targetDayIndex = aptDate.getDay() === 0 ? 6 : aptDate.getDay() - 1;
        return targetDayIndex === dayIndex;
      });

      if (dayApts.length === 0) continue;

      // Calcular minutos de inicio y fin para ordenar y maquetar
      dayApts.forEach(apt => {
        const [h, m] = apt.time.split(':').map(Number);
        apt.startMins = (h - 6) * 60 + m;
        apt.endMins = apt.startMins + parseInt(apt.duration || 60);
      });

      // Ordenar por hora de inicio
      dayApts.sort((a, b) => a.startMins - b.startMins);

      // Agrupar en grupos (clusters) independientes de solapamiento
      const clusters = [];
      let currentCluster = [];
      let clusterEnd = -1;

      dayApts.forEach(apt => {
        if (currentCluster.length === 0 || apt.startMins < clusterEnd) {
          currentCluster.push(apt);
          clusterEnd = Math.max(clusterEnd, apt.endMins);
        } else {
          clusters.push(currentCluster);
          currentCluster = [apt];
          clusterEnd = apt.endMins;
        }
      });
      if (currentCluster.length > 0) {
        clusters.push(currentCluster);
      }

      // Distribuir cada cluster en columnas
      clusters.forEach(cluster => {
        const columns = []; // columnas dentro del cluster
        cluster.forEach(apt => {
          let placedIndex = -1;
          for (let c = 0; c < columns.length; c++) {
            const lastInCol = columns[c][columns[c].length - 1];
            if (lastInCol.endMins <= apt.startMins) {
              placedIndex = c;
              break;
            }
          }
          if (placedIndex === -1) {
            columns.push([apt]);
          } else {
            columns[placedIndex].push(apt);
          }
        });

        const numCols = columns.length;
        columns.forEach((colApts, colIndex) => {
          colApts.forEach(apt => {
            const leftPercent = colIndex * (100 / numCols);
            const widthPercent = 100 / numCols;
            const card = this.buildCard(apt, leftPercent, widthPercent);
            col.appendChild(card);
          });
        });
      });
    }
  },

  buildCard(apt, leftPercent = 0, widthPercent = 100) {
    const card = document.createElement('div');
    card.className = 'apt-card';

    const [h, m] = apt.time.split(':').map(Number);
    const startMins = (h - 6) * 60 + m;
    const durMins = parseInt(apt.duration);

    // Si la duración es 0 (Indefinido), usamos 120 minutos para la altura visual
    const displayMinsForHeight = (isNaN(durMins) || durMins === 0) ? 120 : durMins;
    const maxDurMins = 720 - startMins; // Limite de 12 horas hasta las 6 PM
    const heightMins = Math.max(30, Math.min(displayMinsForHeight, maxDurMins));

    card.style.top = `${(startMins / 60) * 100}px`;
    card.style.height = `${(heightMins / 60) * 100}px`;
    card.style.left = `calc(${leftPercent}% + 2px)`;
    card.style.width = `calc(${widthPercent}% - 4px)`;
    card.style.right = 'auto';

    // Establecer el color del borde izquierdo según el técnico
    const tech = this.technicians.find(t => t.id === apt.techId);
    if (tech) {
      card.style.borderLeft = `8px solid ${tech.color}`;
    }

    // Establecer el color de fondo según el día de la semana
    const aptDate = new Date(apt.date + 'T00:00:00');
    const day = aptDate.getDay();
    // 0: Dom (Rojo), 1: Lun (Azul), 2: Mar (Verde), 3: Mie (Naranja), 4: Jue (Morado), 5: Vie (Cian), 6: Sab (Rosa)
    const dayColors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63'];
    card.style.backgroundColor = `${dayColors[day]}26`; // 15% de opacidad del color del día

    let workType = apt.serviceType === 'air' ? '❄️ A/C' : (apt.serviceType === 'auto' || apt.serviceType === 'automotive' ? '🚗 Auto' : (apt.serviceType === 'general' ? '🔧 General' : '🔌 Elec'));
    if (apt.serviceType === 'air' && apt.acWorkTypes && apt.acWorkTypes.length > 0) {
      const shortLabels = {
        'mantenimiento': 'Mant.',
        'instalacion': 'Inst.',
        'diagnostico_reparacion': 'Diag.'
      };
      workType += ` (${apt.acWorkTypes.map(w => shortLabels[w] || w).join(' + ')})`;
    } else if (apt.serviceType === 'general' && apt.genWorkTypes && apt.genWorkTypes.length > 0) {
      const shortLabels = {
        'inst_interruptores': 'Inst. Int.',
        'inst_cerradura': 'Inst. Cerr.',
        'rev_cerradura': 'Rev. Cerr.',
        'rev_interruptores': 'Rev. Int.',
        'diag_electrico': 'Diag. Elec.',
        'prog_entrega': 'Prog. o Entrega'
      };
      workType += ` (${apt.genWorkTypes.map(w => shortLabels[w] || w).join(' + ')})`;
    }

    let h12 = h % 12;
    h12 = h12 ? h12 : 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayTime = `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;

    card.style.overflow = 'hidden';

    const clientName = apt.residentName || apt.adminName || 'Sin Nombre';

    card.innerHTML = `
      <div class="apt-card-time" style="font-size: 0.85rem; font-weight: 700; margin-bottom: 3px;">
        ${displayTime} <span style="font-size: 0.7rem; font-weight: 400; color: var(--t-secondary);">(${this.formatDuration(apt.duration)})</span>
      </div>
      <div class="apt-card-title" style="font-size: 0.95rem; color: #fff; margin-bottom: 2px;">
        ${utils.escape(apt.building)}
      </div>
      <div class="apt-card-title" style="font-size: 0.85rem; color: var(--t-primary); margin-bottom: 4px;">
        ${utils.escape(apt.apt)}
      </div>
      <div class="apt-card-sub" style="font-size: 0.75rem; color: var(--t-muted); margin-bottom: 3px;">
        ${workType}
      </div>
      <div class="apt-card-sub" style="font-size: 0.8rem; color: var(--c-accent-dim);">
        👤 ${utils.escape(clientName)}
      </div>
      <div class="apt-card-actions" style="position:absolute; top:4px; right:4px; z-index:10;">
        <button type="button" class="btn btn-icon float-wa-btn" title="Notificar a Técnico" style="font-size:16px; background:none; border:none; cursor:pointer;">📲</button>
      </div>
    `;

    const waBtn = card.querySelector('.float-wa-btn');
    if (waBtn) {
      waBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.notifyTech(apt.id);
      });
    }

    card.addEventListener('click', () => {
      this.openForm(apt);
    });

    return card;
  },

  /* ================== FORM & MODALS ================== */
  openForm(apt = null) {
    const form = document.getElementById('apt-form');
    if (form) form.reset();
    const idField = document.getElementById('apt-field-id');
    if (idField) idField.value = '';

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    };

    const btnDelete = document.getElementById('btn-apt-delete');

    if (apt) {
      if (btnDelete) btnDelete.style.display = 'inline-flex';
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

      setVal('apt-field-ac-brand', apt.acBrand || '');
      setVal('apt-field-ac-model', apt.acModel || '');
      setVal('apt-field-ac-type', apt.acType || '');
      setVal('apt-field-ac-fault', apt.reportedFault || '');
      setVal('apt-field-ac-notes', apt.techNotes || apt.notes || '');

      setVal('apt-field-auto-year', apt.autoYear || '');
      setVal('apt-field-auto-model', apt.autoModel || '');
      setVal('apt-field-auto-fault', apt.reportedFault || '');
      setVal('apt-field-auto-notes', apt.techNotes || apt.notes || '');
      setVal('apt-field-gen-notes', apt.techNotes || apt.notes || '');

      const dayBefore = document.getElementById('apt-field-remind-day-before');
      if (dayBefore) dayBefore.checked = apt.remindDayBefore !== false;
      const hourBefore = document.getElementById('apt-field-remind-hour-before');
      if (hourBefore) hourBefore.checked = apt.remindHourBefore !== false;

      this.selectServiceType(apt.serviceType || 'air');

      const chkMan = document.getElementById('ac-chk-mantenimiento');
      const chkDiag = document.getElementById('ac-chk-diagnostico');
      const chkInst = document.getElementById('ac-chk-instalacion');

      if (apt.acWorkTypes) {
        if (chkMan) chkMan.checked = apt.acWorkTypes.includes('mantenimiento');
        if (chkDiag) chkDiag.checked = apt.acWorkTypes.includes('diagnostico_reparacion');
        if (chkInst) chkInst.checked = apt.acWorkTypes.includes('instalacion');
      } else {
        if (chkMan) chkMan.checked = false;
        if (chkDiag) chkDiag.checked = false;
        if (chkInst) chkInst.checked = false;
      }
      
      const chkGen1 = document.getElementById('gen-chk-inst-interruptores');
      const chkGen2 = document.getElementById('gen-chk-inst-cerradura');
      const chkGen3 = document.getElementById('gen-chk-rev-cerradura');
      const chkGen4 = document.getElementById('gen-chk-rev-interruptores');
      const chkGen5 = document.getElementById('gen-chk-diag-electrico');
      const chkGen6 = document.getElementById('gen-chk-prog-entrega');

      if (apt.genWorkTypes) {
        if (chkGen1) chkGen1.checked = apt.genWorkTypes.includes('inst_interruptores');
        if (chkGen2) chkGen2.checked = apt.genWorkTypes.includes('inst_cerradura');
        if (chkGen3) chkGen3.checked = apt.genWorkTypes.includes('rev_cerradura');
        if (chkGen4) chkGen4.checked = apt.genWorkTypes.includes('rev_interruptores');
        if (chkGen5) chkGen5.checked = apt.genWorkTypes.includes('diag_electrico');
        if (chkGen6) chkGen6.checked = apt.genWorkTypes.includes('prog_entrega');
      } else {
        if (chkGen1) chkGen1.checked = false;
        if (chkGen2) chkGen2.checked = false;
        if (chkGen3) chkGen3.checked = false;
        if (chkGen4) chkGen4.checked = false;
        if (chkGen5) chkGen5.checked = false;
        if (chkGen6) chkGen6.checked = false;
      }
    } else {
      if (btnDelete) btnDelete.style.display = 'none';
      setVal('apt-field-date', new Date().toISOString().split('T')[0]);
      this.selectServiceType('air');
    }
    const modal = document.getElementById('modal-appointment');
    if (modal) {
      modal.hidden = false;
      // scroll to top
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent) modalContent.scrollTop = 0;
    }
  },

  selectServiceType(type) {
    const btnAir = document.getElementById('apt-svc-air');
    const btnAuto = document.getElementById('apt-svc-auto');
    const btnGen = document.getElementById('apt-svc-general');
    const hidSvcType = document.getElementById('apt-field-service-type');
    const divFieldsAir = document.getElementById('apt-fields-air');
    const divFieldsAuto = document.getElementById('apt-fields-auto');
    const divFieldsGen = document.getElementById('apt-fields-general');

    if (type === 'air') {
      btnAir?.classList.add('active');
      btnAuto?.classList.remove('active');
      btnGen?.classList.remove('active');
      if (divFieldsAir) divFieldsAir.style.display = 'block';
      if (divFieldsAuto) divFieldsAuto.style.display = 'none';
      if (divFieldsGen) divFieldsGen.style.display = 'none';
      if (hidSvcType) hidSvcType.value = 'air';
    } else if (type === 'automotive' || type === 'auto') {
      btnAir?.classList.remove('active');
      btnAuto?.classList.add('active');
      btnGen?.classList.remove('active');
      if (divFieldsAir) divFieldsAir.style.display = 'none';
      if (divFieldsAuto) divFieldsAuto.style.display = 'block';
      if (divFieldsGen) divFieldsGen.style.display = 'none';
      if (hidSvcType) hidSvcType.value = 'automotive';
    } else if (type === 'general') {
      btnAir?.classList.remove('active');
      btnAuto?.classList.remove('active');
      btnGen?.classList.add('active');
      if (divFieldsAir) divFieldsAir.style.display = 'none';
      if (divFieldsAuto) divFieldsAuto.style.display = 'none';
      if (divFieldsGen) divFieldsGen.style.display = 'block';
      if (hidSvcType) hidSvcType.value = 'general';
    }
  },

  bindModalEvents() {
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop');
        if (modal) modal.hidden = true;
      });
    });

    document.getElementById('btn-manage-locations')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-locations');
      if (modal) {
        modal.hidden = false;
        this.renderLocList();

        // Limpiar formulario al abrir para evitar que queden datos precargados o en modo edición
        ['loc-f-name', 'loc-f-apt', 'loc-f-address', 'loc-f-resident-name', 'loc-f-resident-phone', 'loc-f-contact-name', 'loc-f-contact-phone', 'loc-f-notes', 'loc-edit-id'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });

        const formLabel = document.getElementById('loc-form-label');
        if (formLabel) formLabel.innerText = '➕ Nueva Ubicación';

        const btnCancel = document.getElementById('btn-loc-cancel-edit');
        if (btnCancel) btnCancel.style.display = 'none';
      }
    });

    document.getElementById('btn-manage-techs')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-technicians');
      if (modal) {
        modal.hidden = false;
        this.renderTechList();
      }
    });
  },

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
      else if (window.toast) toast.show('Aviso', 'Debe guardar la visita antes de enviar mensajes.', 'warning');
      else alert('Debe guardar la visita antes de enviar mensajes.');
    });

    document.getElementById('btn-apt-wa-contact')?.addEventListener('click', () => {
      const id = document.getElementById('apt-field-id').value;
      if (id) this.notifyContact(id, 'admin');
      else if (window.toast) toast.show('Aviso', 'Debe guardar la visita antes de enviar mensajes.', 'warning');
      else alert('Debe guardar la visita antes de enviar mensajes.');
    });

    document.getElementById('btn-apt-wa-resident')?.addEventListener('click', () => {
      const id = document.getElementById('apt-field-id').value;
      if (id) this.notifyContact(id, 'resident');
      else if (window.toast) toast.show('Aviso', 'Debe guardar la visita antes de enviar mensajes.', 'warning');
      else alert('Debe guardar la visita antes de enviar mensajes.');
    });

    document.getElementById('btn-apt-wa-res-to-contact')?.addEventListener('click', () => {
      const id = document.getElementById('apt-field-id').value;
      if (id) this.notifyContact(id, 'electro');
      else if (window.toast) toast.show('Aviso', 'Debe guardar la visita antes de enviar mensajes.', 'warning');
      else alert('Debe guardar la visita antes de enviar mensajes.');
    });

    const chkMan = document.getElementById('ac-chk-mantenimiento');
    const chkDiag = document.getElementById('ac-chk-diagnostico');
    const chkInst = document.getElementById('ac-chk-instalacion');
    const hidType = document.getElementById('apt-field-ac-subtype');

    const updateHidden = () => {
      let vals = [];
      if (chkMan?.checked) vals.push('mantenimiento');
      if (chkDiag?.checked) vals.push('diagnostico_reparacion');
      if (chkInst?.checked) vals.push('instalacion');
      if (hidType) hidType.value = vals.join(',');
    };

    chkMan?.addEventListener('change', updateHidden);
    chkDiag?.addEventListener('change', updateHidden);
    chkInst?.addEventListener('change', updateHidden);
    
    const chkGen1 = document.getElementById('gen-chk-inst-interruptores');
    const chkGen2 = document.getElementById('gen-chk-inst-cerradura');
    const chkGen3 = document.getElementById('gen-chk-rev-cerradura');
    const chkGen4 = document.getElementById('gen-chk-rev-interruptores');
    const chkGen5 = document.getElementById('gen-chk-diag-electrico');
    const chkGen6 = document.getElementById('gen-chk-prog-entrega');
    const hidGenType = document.getElementById('apt-field-gen-subtype');

    const updateGenHidden = () => {
      let vals = [];
      if (chkGen1?.checked) vals.push('inst_interruptores');
      if (chkGen2?.checked) vals.push('inst_cerradura');
      if (chkGen3?.checked) vals.push('rev_cerradura');
      if (chkGen4?.checked) vals.push('rev_interruptores');
      if (chkGen5?.checked) vals.push('diag_electrico');
      if (chkGen6?.checked) vals.push('prog_entrega');
      if (hidGenType) hidGenType.value = vals.join(',');
    };

    chkGen1?.addEventListener('change', updateGenHidden);
    chkGen2?.addEventListener('change', updateGenHidden);
    chkGen3?.addEventListener('change', updateGenHidden);
    chkGen4?.addEventListener('change', updateGenHidden);
    chkGen5?.addEventListener('change', updateGenHidden);
    chkGen6?.addEventListener('change', updateGenHidden);

    // Save Tech
    document.getElementById('btn-tech-save')?.addEventListener('click', () => {
      const name = document.getElementById('tech-f-name').value;
      const phone = document.getElementById('tech-f-phone').value;
      const phone2 = document.getElementById('tech-f-phone2')?.value || '';
      const cedula = document.getElementById('tech-f-id').value;
      const editId = document.getElementById('tech-edit-id')?.value;
      
      if (!name) return toast.show('Error', 'Ingresa el nombre', 'warning');

      if (editId) {
        // Update existing
        const tech = this.technicians.find(t => t.id === editId);
        if (tech) {
          tech.name = name;
          tech.phone = phone;
          tech.phone2 = phone2;
          tech.cedula = cedula;
          toast.show('Guardado', 'Técnico actualizado', 'success');
        }
      } else {
        // Add new
        const id = Date.now().toString();
        const colors = ['#f44336', '#9c27b0', '#3f51b5', '#009688', '#ffeb3b', '#ff9800'];
        const color = colors[this.technicians.length % colors.length];
        this.technicians.push({ id, name, phone, phone2, cedula, color });
        toast.show('Guardado', 'Técnico agregado', 'success');
      }

      this.saveTechnicians();
      this.loadTechnicians();

      // Limpiar form
      ['tech-f-name', 'tech-f-phone', 'tech-f-phone2', 'tech-f-id', 'tech-edit-id'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

      const formLabel = document.getElementById('tech-form-label');
      if (formLabel) formLabel.innerText = '➕ Nuevo Técnico';

      const btnCancel = document.getElementById('btn-tech-cancel-edit');
      if (btnCancel) btnCancel.style.display = 'none';
    });

    document.getElementById('btn-tech-cancel-edit')?.addEventListener('click', () => {
      ['tech-f-name', 'tech-f-phone', 'tech-f-phone2', 'tech-f-id', 'tech-edit-id'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const formLabel = document.getElementById('tech-form-label');
      if (formLabel) formLabel.innerText = '➕ Nuevo Técnico';
      const btnCancel = document.getElementById('btn-tech-cancel-edit');
      if (btnCancel) btnCancel.style.display = 'none';
    });

    // Save Location
    document.getElementById('btn-loc-save')?.addEventListener('click', () => {
      const name = document.getElementById('loc-f-name').value;
      if (!name) return toast.show('Error', 'Ingresa el nombre del PH', 'warning');
      
      const editId = document.getElementById('loc-edit-id')?.value;
      
      if (editId) {
        // Update existing
        const loc = this.locations.find(l => l.id === editId);
        if (loc) {
          loc.name = name;
          loc.apt = document.getElementById('loc-f-apt').value;
          loc.address = document.getElementById('loc-f-address').value;
          loc.residentName = document.getElementById('loc-f-resident-name').value;
          loc.residentPhone = document.getElementById('loc-f-resident-phone').value;
          loc.adminName = document.getElementById('loc-f-contact-name').value;
          loc.adminPhone = document.getElementById('loc-f-contact-phone').value;
          loc.notes = document.getElementById('loc-f-notes').value;
          toast.show('Guardado', 'Ubicación actualizada', 'success');
        }
      } else {
        // Add new
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
        toast.show('Guardado', 'Ubicación guardada', 'success');
      }

      this.saveLocations();
      this.loadLocations();

      // Limpiar form
      ['loc-f-name', 'loc-f-apt', 'loc-f-address', 'loc-f-resident-name', 'loc-f-resident-phone', 'loc-f-contact-name', 'loc-f-contact-phone', 'loc-f-notes', 'loc-edit-id'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

      const formLabel = document.getElementById('loc-form-label');
      if (formLabel) formLabel.innerText = '➕ Nueva Ubicación';

      const btnCancel = document.getElementById('btn-loc-cancel-edit');
      if (btnCancel) btnCancel.style.display = 'none';

      document.getElementById('modal-locations').hidden = true;
    });

    document.getElementById('btn-loc-cancel-edit')?.addEventListener('click', () => {
      ['loc-f-name', 'loc-f-apt', 'loc-f-address', 'loc-f-resident-name', 'loc-f-resident-phone', 'loc-f-contact-name', 'loc-f-contact-phone', 'loc-f-notes', 'loc-edit-id'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const formLabel = document.getElementById('loc-form-label');
      if (formLabel) formLabel.innerText = '➕ Nueva Ubicación';
      const btnCancel = document.getElementById('btn-loc-cancel-edit');
      if (btnCancel) btnCancel.style.display = 'none';
    });

    document.getElementById('apt-svc-air')?.addEventListener('click', () => this.selectServiceType('air'));
    document.getElementById('apt-svc-auto')?.addEventListener('click', () => this.selectServiceType('automotive'));
    document.getElementById('apt-svc-general')?.addEventListener('click', () => this.selectServiceType('general'));

    document.getElementById('btn-apt-gcal')?.addEventListener('click', () => {
      const date = document.getElementById('apt-field-date').value;
      const time = document.getElementById('apt-field-time').value;
      if (!date || !time) {
        toast.show('Aviso', 'Se requiere fecha y hora para agendar.', 'warning');
        return;
      }
      
      const duration = parseInt(document.getElementById('apt-field-duration').value || 60);
      const building = document.getElementById('apt-field-building').value;
      const apt = document.getElementById('apt-field-apt').value;
      const residentName = document.getElementById('apt-field-resident-name').value;
      const serviceType = document.getElementById('apt-field-service-type').value;

      const start = new Date(`${date}T${time}:00`);
      const end = new Date(start.getTime() + duration * 60000);
      
      const formatGCalDate = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const dates = `${formatGCalDate(start)}/${formatGCalDate(end)}`;
      
      const title = `Visita Técnica - ${building} ${apt}`;
      
      const fault = serviceType === 'air' ? document.getElementById('apt-field-ac-fault').value : (serviceType === 'general' ? '' : document.getElementById('apt-field-auto-fault').value);
      const notes = serviceType === 'air' ? document.getElementById('apt-field-ac-notes').value : (serviceType === 'general' ? document.getElementById('apt-field-gen-notes').value : document.getElementById('apt-field-auto-notes').value);
      
      let details = `Contacto: ${residentName}\nServicio: ${serviceType === 'air' ? 'A/C' : (serviceType === 'general' ? 'General' : 'Automotriz')}\n`;
      if (fault) details += `\nReporte: ${fault}`;
      if (notes) details += `\nNotas: ${notes}`;

      const location = `${building} ${apt}`;
      
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    });

    document.getElementById('btn-apt-delete')?.addEventListener('click', () => {
      const idField = document.getElementById('apt-field-id');
      const id = idField ? idField.value : '';
      if (!id) return;
      
      if (confirm('¿Seguro que deseas eliminar esta visita técnica? Esta acción no se puede deshacer.')) {
        if (!firebaseModule.isConnected || !firebaseModule.db) {
          toast.show('Error', 'No hay conexión con Firebase.', 'error');
          return;
        }
        
        firebaseModule.db.collection(this.dbCollection).doc(id).delete()
          .then(() => {
            toast.show('Eliminado', 'Visita técnica eliminada', 'success');
            document.getElementById('modal-appointment').hidden = true;
          })
          .catch(err => {
            console.error(err);
            toast.show('Error', 'Error al eliminar: ' + err.message, 'error');
          });
      }
    });
  },

  saveForm() {
    const idField = document.getElementById('apt-field-id');
    const id = idField ? idField.value : '';
    const date = document.getElementById('apt-field-date').value;
    const time = document.getElementById('apt-field-time').value;
    const duration = document.getElementById('apt-field-duration').value;
    const techId = document.getElementById('apt-field-tech').value;
    const building = document.getElementById('apt-field-building').value;
    const apt = document.getElementById('apt-field-apt').value;
    const residentName = document.getElementById('apt-field-resident-name').value;
    const residentPhone = document.getElementById('apt-field-resident-phone').value;
    const adminName = document.getElementById('apt-field-contact-name').value;
    const adminPhone = document.getElementById('apt-field-contact-phone').value;
    const serviceType = document.getElementById('apt-field-service-type').value;

    const acWorkTypes = [];
    const chkMan = document.getElementById('ac-chk-mantenimiento');
    const chkDiag = document.getElementById('ac-chk-diagnostico');
    const chkInst = document.getElementById('ac-chk-instalacion');
    if (chkMan && chkMan.checked) acWorkTypes.push('mantenimiento');
    if (chkDiag && chkDiag.checked) acWorkTypes.push('diagnostico_reparacion');
    if (chkInst && chkInst.checked) acWorkTypes.push('instalacion');
    
    const genWorkTypes = [];
    const chkGen1 = document.getElementById('gen-chk-inst-interruptores');
    const chkGen2 = document.getElementById('gen-chk-inst-cerradura');
    const chkGen3 = document.getElementById('gen-chk-rev-cerradura');
    const chkGen4 = document.getElementById('gen-chk-rev-interruptores');
    const chkGen5 = document.getElementById('gen-chk-diag-electrico');
    const chkGen6 = document.getElementById('gen-chk-prog-entrega');
    if (chkGen1 && chkGen1.checked) genWorkTypes.push('inst_interruptores');
    if (chkGen2 && chkGen2.checked) genWorkTypes.push('inst_cerradura');
    if (chkGen3 && chkGen3.checked) genWorkTypes.push('rev_cerradura');
    if (chkGen4 && chkGen4.checked) genWorkTypes.push('rev_interruptores');
    if (chkGen5 && chkGen5.checked) genWorkTypes.push('diag_electrico');
    if (chkGen6 && chkGen6.checked) genWorkTypes.push('prog_entrega');

    const acBrand = document.getElementById('apt-field-ac-brand')?.value || '';
    const acModel = document.getElementById('apt-field-ac-model')?.value || '';
    const acType = document.getElementById('apt-field-ac-type')?.value || '';
    
    const reportedFault = (serviceType === 'air' 
      ? document.getElementById('apt-field-ac-fault')?.value 
      : (serviceType === 'general' ? '' : document.getElementById('apt-field-auto-fault')?.value)) || '';
      
    const techNotes = (serviceType === 'air' 
      ? document.getElementById('apt-field-ac-notes')?.value 
      : (serviceType === 'general' ? document.getElementById('apt-field-gen-notes')?.value : document.getElementById('apt-field-auto-notes')?.value)) || '';

    const data = {
      date,
      time,
      duration,
      techId,
      building,
      apt,
      residentName,
      residentPhone,
      adminName,
      adminPhone,
      serviceType,
      acWorkTypes,
      genWorkTypes,
      acBrand,
      acModel,
      acType,
      reportedFault,
      techNotes,
      remindDayBefore: document.getElementById('apt-field-remind-day-before')?.checked || false,
      remindHourBefore: document.getElementById('apt-field-remind-hour-before')?.checked || false
    };

    if (!firebaseModule.isConnected || !firebaseModule.db) {
      toast.show('Error', 'No hay conexión con Firebase.', 'error');
      return;
    }

    const col = firebaseModule.db.collection(this.dbCollection);
    
    if (id) {
      col.doc(id).update(data)
        .then(() => {
          toast.show('Guardado', 'Visita actualizada', 'success');
          document.getElementById('modal-appointment').hidden = true;
        })
        .catch(err => {
          console.error(err);
          toast.show('Error', 'Error al actualizar: ' + err.message, 'error');
        });
    } else {
      col.add(data)
        .then(() => {
          toast.show('Guardado', 'Visita agendada', 'success');
          document.getElementById('modal-appointment').hidden = true;
        })
        .catch(err => {
          console.error(err);
          toast.show('Error', 'Error al guardar: ' + err.message, 'error');
        });
    }
  },

  notifyTech(aptId) {
    try {
      console.log('notifyTech called with:', aptId);
      const apt = this.appointments.find(a => a.id === aptId);
      if (!apt) {
        alert('Cita no encontrada en memoria.');
        return;
      }

      const tech = this.technicians.find(t => t.id === apt.techId);
      if (!tech || (!tech.phone && !tech.phone2)) {
        if (window.toast) toast.show('Error', 'El técnico no tiene número asignado.', 'error');
        else alert('El técnico no tiene número asignado.');
        return;
      }

      const phonesToSend = [];
      if (tech.phone) phonesToSend.push(tech.phone);
      if (tech.phone2) phonesToSend.push(tech.phone2);

      let workTypeDesc = 'Mantenimiento General';
      if (apt.serviceType === 'air' && apt.acWorkTypes && apt.acWorkTypes.length > 0) {
        const labels = {
          'mantenimiento': 'Mantenimiento',
          'instalacion': 'Instalación',
          'diagnostico_reparacion': 'Diagnóstico y Reparación'
        };
        workTypeDesc = apt.acWorkTypes.map(w => labels[w] || w).join(' y ');
      } else if (apt.serviceType === 'general' && apt.genWorkTypes && apt.genWorkTypes.length > 0) {
        const labels = {
          'inst_interruptores': 'Inst. Interruptores',
          'inst_cerradura': 'Inst. Cerradura',
          'rev_cerradura': 'Rev. Cerradura',
          'rev_interruptores': 'Rev. Interruptores',
          'diag_electrico': 'Diagnóstico sist. eléctrico',
          'prog_entrega': 'Servicio de programación o entrega'
        };
        workTypeDesc = apt.genWorkTypes.map(w => labels[w] || w).join(' y ');
      }

      const dashes = '- - - - - - - - - - - - - - - - - - - - - - - - -';
      let durationStr = this.formatDuration(apt.duration);

      let msg = `🏪 ELECTROTALLER
👷 NUEVA VISITA ASIGNADA
${dashes}
Hola *${(tech.name || '').toUpperCase()}*, se te ha asignado la siguiente visita técnica:

📅 *Fecha:* ${apt.date}
⏱️ *Hora:* ${apt.time} (Duración: ${durationStr})

🏢 *UBICACIÓN:*
*Lugar:* ${(apt.building || 'No def.').toUpperCase()}
*Apto/Casa/Local:* ${apt.apt || 'No def.'}
*Notas/Geo:* ${apt.techNotes || apt.notes || 'Ninguna'}

👤 *RESIDENTE / INQUILINO:*
*Nombre:* ${(apt.residentName || 'No def.').toUpperCase()}

🔧 *DETALLES DEL TRABAJO:*
`;
      if (apt.serviceType === 'air') {
        const details = [
          `*Servicio:* Aire Acondicionado (${workTypeDesc})`,
          (apt.acBrand || apt.acType) ? `*Marca/Tipo:* ${[apt.acBrand, apt.acType].filter(Boolean).join(' - ')}` : '',
          apt.reportedFault ? `*Falla:* ${(apt.reportedFault).toUpperCase()}` : '',
          apt.techNotes || apt.notes ? `*Notas:* ${apt.techNotes || apt.notes}` : ''
        ].filter(Boolean).join('\n');
        msg += details + '\n';
      } else if (apt.serviceType === 'general') {
        const details = [
          `*Servicio:* Servicio General (${workTypeDesc})`,
          apt.techNotes || apt.notes ? `*Notas:* ${apt.techNotes || apt.notes}` : ''
        ].filter(Boolean).join('\n');
        msg += details + '\n';
      } else {
        const details = [
          `*Servicio:* Automotriz / Electrónico`,
          (apt.autoModel || apt.autoYear) ? `*Vehículo:* ${[apt.autoModel, apt.autoYear].filter(Boolean).join(' ')}` : '',
          apt.reportedFault ? `*Falla:* ${(apt.reportedFault).toUpperCase()}` : '',
          apt.techNotes || apt.notes ? `*Notas:* ${apt.techNotes || apt.notes}` : ''
        ].filter(Boolean).join('\n');
        msg += details + '\n';
      }
      msg += `${dashes}
Por favor confirmar de enterado y coordinar con el cliente si es necesario.
_ElectroTaller - Gestión de Agenda_`;

      if (window.toast) toast.show('Enviando WhatsApp...', 'Conectando con el bot local', 'info', 5000);
      
      phonesToSend.forEach(rawPhone => {
        let phone = rawPhone.replace(/\D/g, '');
        if (phone.length === 7 || phone.length === 8) phone = '507' + phone;

        const payload = { phone, message: msg };
        whatsappApi.sendMessage(phone, msg)
          .then(() => {
            if (window.toast) toast.show('Enviado por bot', `Mensaje enviado a ${rawPhone}.`, 'success');
            else console.log(`Mensaje enviado a ${rawPhone}.`);
          })
          .catch(err => {
            console.warn('Bot local no disponible o error:', err);
            if (window.toast) toast.show('Bot no disponible', `Abriendo WhatsApp manual para ${rawPhone}...`, 'warning', 3000);
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          });
      });
    } catch (error) {
      console.error(error);
      alert('Error en WhatsApp: ' + error.message);
    }
  },

  notifyContact(aptId, targetType = 'resident') {
    try {
      console.log('notifyContact called with:', aptId, targetType);
      const apt = this.appointments.find(a => a.id === aptId);
      if (!apt) {
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
        let cfg = {};
        try {
          cfg = JSON.parse(localStorage.getItem('wft_firebase_config')) || {};
        } catch (e) { }
        phoneRaw = cfg.shopPhone;
        targetName = 'taller (ElectroTaller)';
        personName = apt.residentName || 'cliente';
        isForShop = true;
      } else {
        phoneRaw = apt.residentPhone || apt.adminPhone;
        targetName = 'cliente';
      }

      if (!phoneRaw) {
        const msg = `No hay un número de teléfono guardado para el ${targetName}.`;
        if (window.toast) toast.show('Error', msg, 'error');
        else alert(msg);
        return;
      }

      let phone = phoneRaw.replace(/\D/g, '');
      if (phone.length === 7 || phone.length === 8) phone = '507' + phone;

      let workTypeDesc = 'Revisión General';
      if (apt.serviceType === 'air' && apt.acWorkTypes && apt.acWorkTypes.length > 0) {
        const labels = {
          'mantenimiento': 'Mantenimiento',
          'instalacion': 'Instalación',
          'diagnostico_reparacion': 'Diagnóstico y Reparación'
        };
        workTypeDesc = apt.acWorkTypes.map(w => labels[w] || w).join(' y ');
      } else if (apt.serviceType === 'general' && apt.genWorkTypes && apt.genWorkTypes.length > 0) {
        const labels = {
          'inst_interruptores': 'Inst. Interruptores',
          'inst_cerradura': 'Inst. Cerradura',
          'rev_cerradura': 'Rev. Cerradura',
          'rev_interruptores': 'Rev. Interruptores',
          'diag_electrico': 'Diagnóstico sist. eléctrico',
          'prog_entrega': 'Servicio de programación o entrega'
        };
        workTypeDesc = apt.genWorkTypes.map(w => labels[w] || w).join(' y ');
      }

      let serviceName = 'Automotriz / Electrónico';
      if (apt.serviceType === 'air') serviceName = 'Aire Acondicionado';
      else if (apt.serviceType === 'general') serviceName = 'Servicio General';

      const tech = this.technicians.find(t => t.id === apt.techId);
      const techName = tech ? tech.name : 'uno de nuestros técnicos';

      let msg = '';

      const dashes = '- - - - - - - - - - - - - - - - - - - - - - - - -';
      let durationStr = this.formatDuration(apt.duration);

      if (targetType === 'resident' || targetType === 'electro') {
        msg = `🏪 ElectroTaller
📅 CONFIRMACIÓN DE VISITA TÉCNICA
${dashes}
Estimado/a *${(apt.residentName || 'CLIENTE').toUpperCase()}*,

Le confirmamos que nuestro equipo técnico visitará *${(apt.building || 'su ubicación').toUpperCase()}* el día *${apt.date}* a las *${apt.time}*.

⏱️ *Duración estimada:* ${durationStr}

${dashes}
📋 DETALLE DE LA VISITA
${dashes}
🔧 *Servicio:* ${serviceName} (${workTypeDesc})
📍 *Apto / Unidad:* ${apt.apt || 'No def.'}
👷 *Técnico asignado:* ${(techName || 'No asignado').toUpperCase()}
${dashes}
Si necesita reprogramar, contáctenos a la brevedad.

_ElectroTaller - Electronica Automotriz y HVAC_`;
      } else {
        msg = `🏪 ElectroTaller
📅 CONFIRMACIÓN DE VISITA TÉCNICA
${dashes}
Estimado/a *${(personName || 'CLIENTE').toUpperCase()}*,

Le confirmamos que nuestro equipo técnico visitará *${(apt.building || 'su ubicación').toUpperCase()}* el día *${apt.date}* a las *${apt.time}*.

⏱️ *Duración estimada:* ${durationStr}

${dashes}
📋 DETALLE DE LA VISITA
${dashes}
🔧 *Servicio:* ${serviceName} (${workTypeDesc})
📍 *Apto / Unidad:* ${apt.apt || 'No def.'}
👤 *Residente:* ${(apt.residentName || 'No def.').toUpperCase()}
👷 *Técnico asignado:* ${(techName || 'No asignado').toUpperCase()}
${dashes}
Si necesita reprogramar, contáctenos a la brevedad.

_ElectroTaller - Electronica Automotriz y HVAC_`;
      }

      if (window.toast) toast.show('Enviando WhatsApp...', 'Conectando con el bot local', 'info', 5000);

      const payload = { phone, message: msg };
      whatsappApi.sendMessage(phone, msg)
        .then(() => {
          if (window.toast) toast.show('Enviado por bot', 'Mensaje enviado silenciosamente.', 'success');
          else alert('Mensaje enviado silenciosamente.');
        })
        .catch(err => {
          console.warn('Bot local no disponible o error:', err);
          if (window.toast) toast.show('Bot no disponible', 'Abriendo modo manual...', 'warning', 3000);
          const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        });
    } catch (error) {
      console.error(error);
      alert('Error en WhatsApp al cliente: ' + error.message);
    }
  }
};

window.agendaModule = agendaModule;

document.addEventListener('DOMContentLoaded', () => { agendaModule.init(); });
