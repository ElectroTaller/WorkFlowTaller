window.agendaCalendarMixin = {
  setWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    if (day !== 1) d.setHours(-24 * (day - 1));
    d.setHours(0, 0, 0, 0);
    this.currentWeekStart = d;
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
  }
};
