/* MÓDULO: KANBAN Y UI */
const detailModal = {
  currentOrder: null,

  open(order) {
    this.currentOrder = order;
    const modal = document.getElementById('modal-detail');
    const content = document.getElementById('detail-content');
    const title = document.getElementById('modal-detail-title');

    title.textContent = `Orden: ${order.id}`;

    const statusColors = {
      'Nuevo Ingreso': { bg: 'hsla(200,80%,60%,.15)', color: 'hsl(200,80%,60%)' },
      'En Reparación': { bg: 'hsla(280,80%,65%,.15)', color: 'hsl(280,80%,65%)' },
      'Esperando Piezas': { bg: 'hsla(25,100%,55%,.15)', color: 'hsl(25,100%,55%)' },
      'Listo para Entrega': { bg: 'hsla(140,70%,50%,.15)', color: 'hsl(140,70%,50%)' },
      'Entregado': { bg: 'hsla(0,0%,50%,.15)', color: 'hsl(0,0%,50%)' },
    };
    const sc = statusColors[order.status] || { bg: 'var(--c-surface)', color: 'var(--t-primary)' };
    const balance = (Number(order.budget) || 0) - (Number(order.downPayment) || 0);
    const veh = order.vehicleData;
    const ac = order.acData;

    content.innerHTML = `
      <div class="detail-section">
        <div style="margin-bottom:12px">
          <span class="detail-status-badge" style="background:${sc.bg};color:${sc.color}">
            �-� ${order.status}
          </span>
        </div>
        <div class="detail-grid">
          <div class="detail-field">
            <span class="detail-field-label">Cliente</span>
            <span class="detail-field-value">${utils.escape(order.clientName || '�?"')}</span>
          </div>
          <div class="detail-field">
            <span class="detail-field-label">WhatsApp / Teléfono</span>
            <span class="detail-field-value">${utils.escape(order.clientPhone || '�?"')}</span>
          </div>
          <div class="detail-field">
            <span class="detail-field-label">Cédula / RUC</span>
            <span class="detail-field-value mono">${utils.escape(order.clientId || 'No registrado')}</span>
          </div>
          <div class="detail-field">
            <span class="detail-field-label">PIN de Seguridad</span>
            <span class="detail-field-value mono" style="color: var(--c-primary); font-weight: bold;">${utils.escape(order.clientPin || 'Sin PIN')}</span>
          </div>
          <div class="detail-field">
            <span class="detail-field-label">Dispositivo</span>
            <span class="detail-field-value">${utils.escape(order.deviceType || '�?"')}${order.deviceDesc ? ` · ${utils.escape(order.deviceDesc)}` : ''}</span>
          </div>
          <div class="detail-field">
            <span class="detail-field-label">Ingreso</span>
            <span class="detail-field-value">${utils.formatDate(order.createdAt, true)}</span>
          </div>
          ${order.dueDate ? `
          <div class="detail-field">
            <span class="detail-field-label">Entrega Estimada</span>
            <span class="detail-field-value">${utils.formatDate(order.dueDate)}</span>
          </div>` : ''}
          <div class="detail-field">
            <span class="detail-field-label">�sltima Actualización</span>
            <span class="detail-field-value">${utils.formatDate(order.updatedAt, true)}</span>
          </div>
        </div>
      </div>

      ${veh ? `
      <div class="detail-section">
        <div class="detail-section-title">Datos del Vehículo</div>
        <div class="detail-grid">
          ${veh.brand ? `<div class="detail-field"><span class="detail-field-label">Marca / Modelo</span><span class="detail-field-value">${utils.escape([veh.brand, veh.model, veh.year].filter(Boolean).join(' '))}</span></div>` : ''}
          ${veh.vin ? `<div class="detail-field"><span class="detail-field-label">VIN</span><span class="detail-field-value mono">${utils.escape(veh.vin)}</span></div>` : ''}
          ${veh.dtcCode ? `<div class="detail-field span2"><span class="detail-field-label">Código DTC</span><span class="detail-field-value dtc">${utils.escape(veh.dtcCode)}</span></div>` : ''}
        </div>
      </div>` : ''}

      ${ac ? `
      <div class="detail-section">
        <div class="detail-section-title">Datos del Equipo A/C</div>
        <div class="detail-grid">
          ${ac.brand ? `<div class="detail-field"><span class="detail-field-label">Marca / Modelo</span><span class="detail-field-value">${utils.escape([ac.brand, ac.model].filter(Boolean).join(' '))}</span></div>` : ''}
          ${ac.btu ? `<div class="detail-field"><span class="detail-field-label">Capacidad</span><span class="detail-field-value">${utils.escape(ac.btu)}</span></div>` : ''}
          ${ac.tech ? `<div class="detail-field"><span class="detail-field-label">Tecnología</span><span class="detail-field-value">${utils.escape(ac.tech)}</span></div>` : ''}
          ${ac.errorCode ? `<div class="detail-field span2"><span class="detail-field-label">Código de Error</span><span class="detail-field-value dtc">${utils.escape(ac.errorCode)}</span></div>` : ''}
          ${ac.components ? (() => {
          const labels = { tarjetaEvap: 'Tarjeta Evaporador', tarjetaCond: 'Tarjeta Condensador', sensorEvap: 'Sensor Evap.', sensorCond: 'Sensor Cond.', ventilador: 'Ventilador', display: 'Display/Control' };
          const activos = Object.entries(ac.components).filter(([, v]) => v).map(([k]) => labels[k] || k);
          return activos.length ? `<div class="detail-field span2"><span class="detail-field-label">Componentes Entregados</span><span class="detail-field-value">${utils.escape(activos.join(' · '))}</span></div>` : '';
        })() : ''}
        </div>
      </div>` : ''}

      <div class="detail-section">
        <div class="detail-section-title">Falla y Diagnóstico</div>
        ${order.reportedFault ? `<div class="detail-field span2" style="margin-bottom:8px"><span class="detail-field-label">Falla Reportada por el Cliente</span><span class="detail-field-value" style="line-height:1.5">${utils.escape(order.reportedFault)}</span></div>` : ''}
        ${order.technicalNotes ? `<div class="detail-field span2"><span class="detail-field-label">Notas Técnicas</span><span class="detail-field-value" style="line-height:1.5">${utils.escape(order.technicalNotes)}</span></div>` : ''}
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Resumen Económico</div>
        <div class="detail-grid">
          <div class="detail-field"><span class="detail-field-label">Costo Total</span><span class="detail-field-value money">${utils.formatCurrency(order.budget)}</span></div>
          <div class="detail-field"><span class="detail-field-label">Anticipo</span><span class="detail-field-value money" style="color:var(--c-warning)">${utils.formatCurrency(order.downPayment)}</span></div>
          <div class="detail-field"><span class="detail-field-label">Saldo Pendiente</span><span class="detail-field-value money" style="color:var(--c-danger)">${utils.formatCurrency(balance)}</span></div>
        </div>
      </div>
    `;

    // Lógica para mostrar solo el botón de WA correspondiente a la columna
    const wa1 = document.getElementById('btn-detail-wa1');
    const wa2 = document.getElementById('btn-detail-wa2');
    const wa3 = document.getElementById('btn-detail-wa3');

    wa1.style.display = 'none';
    wa2.style.display = 'none';
    wa3.style.display = 'none';

    if (order.status === 'Nuevo Ingreso') {
      wa1.style.display = '';
    } else if (order.status === 'Listo para Entrega') {
      wa3.style.display = '';
    } else {
      wa2.style.display = '';
    }

    modal.hidden = false;
  },

  close() {
    document.getElementById('modal-detail').hidden = true;
    this.currentOrder = null;
  },
};

window.detailModal = detailModal;

const configModal = {
  open() {
    const cfg = firebaseModule.getConfig() || {};
    document.getElementById('cfg-api-key').value = cfg.apiKey || '';
    document.getElementById('cfg-project-id').value = cfg.projectId || '';
    document.getElementById('cfg-app-id').value = cfg.appId || '';
    document.getElementById('cfg-auth-domain').value = cfg.authDomain || '';
    document.getElementById('cfg-shop-name').value = cfg.shopName || '';
    document.getElementById('cfg-shop-phone').value = cfg.shopPhone || '';
    document.getElementById('cfg-shop-phone-2').value = cfg.shopPhone2 || '';
    document.getElementById('modal-config').hidden = false;

    // Obtener la configuración actual del bot de WhatsApp local
    const host = window.location.hostname || 'localhost';
    fetch(`http://${host}:3000/config`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          const chkHuman = document.getElementById('cfg-bot-human');
          const chkAfterHours = document.getElementById('cfg-bot-afterhours');
          if (chkHuman) chkHuman.checked = data.config.allowHumanContact;
          if (chkAfterHours) chkAfterHours.checked = data.config.notifyAfterHours;
        }
      })
      .catch(err => console.warn('Bot local no detectado o apagado', err));
  },
  close() { document.getElementById('modal-config').hidden = true; },
};

window.configModal = configModal;

const kanban = {
  COLUMNS: ['Nuevo Ingreso', 'En Reparación', 'Esperando Piezas', 'Listo para Entrega', 'Entregado'],
  searchQuery: '',
  dragOrderId: null,

  render(orders) {
    const q = this.searchQuery.toLowerCase();
    const filtered = q
      ? orders.filter(o =>
        [o.clientName, o.orderId || o.id, o.vehicleData?.vin, o.vehicleData?.dtcCode, o.clientPhone, o.deviceType, o.reportedFault]
          .some(v => v && String(v).toLowerCase().includes(q)))
      : orders;

    // Limpiar columnas
    this.COLUMNS.forEach(status => {
      const container = document.getElementById(`cards-${this.statusId(status)}`);
      if (container) container.innerHTML = '';
    });

    const counts = {};
    this.COLUMNS.forEach(s => counts[s] = 0);

    // Separar órdenes activas y entregadas
    const active = filtered;
    const grouping = {};
    this.COLUMNS.forEach(s => grouping[s] = []);
    active.forEach(o => {
      const s = o.status || 'Nuevo Ingreso';
      if (grouping[s]) grouping[s].push(o);
      else grouping['Nuevo Ingreso'].push(o);
    });

    this.COLUMNS.forEach(status => {
      const container = document.getElementById(`cards-${this.statusId(status)}`);
      if (!container) return;
      const group = grouping[status] || [];
      counts[status] = group.length;

      group.forEach(order => {
        const card = this.buildCard(order);
        container.appendChild(card);
      });
    });

    // Actualizar contadores
    this.COLUMNS.forEach(status => {
      const el = document.getElementById(`count-${this.statusId(status)}`);
      if (el) {
        const prev = parseInt(el.textContent, 10) || 0;
        el.textContent = counts[status];
        if (prev !== counts[status]) { el.style.animation = 'none'; el.offsetHeight; el.style.animation = 'counterPop .4s var(--ease-bounce)'; }
      }
    });

    // Actualizar KPIs
    this.updateKPIs(orders);
  },

  buildCard(order) {
    const daysSinceUpdate = utils.daysSince(order.updatedAt);
    const isCritical = daysSinceUpdate >= 5;
    const isWarning = daysSinceUpdate >= 2 && daysSinceUpdate < 5;
    const accentColor = utils.columnAccentColor(order.status);
    const badgeClass = utils.deviceBadgeClass(order.deviceType);

    const hasVehicle = order.vehicleData && (order.vehicleData.brand || order.vehicleData.vin || order.vehicleData.dtcCode);
    const hasDTC = order.vehicleData?.dtcCode;
    const isOverdue = order.dueDate && new Date(order.dueDate) < new Date();

    const balance = (Number(order.budget) || 0) - (Number(order.downPayment) || 0);

    const card = document.createElement('article');
    card.className = `kanban-card${isCritical ? ' alert-critical' : isWarning ? ' alert-warning' : ''}`;
    card.setAttribute('data-id', order.id);
    card.setAttribute('draggable', 'true');
    card.style.setProperty('--card-accent', accentColor);

    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-order-id">${utils.escape(order.id)}</div>
          <div class="card-client-name">${utils.escape(order.clientName || '�?"')}</div>
        </div>
        <span class="card-device-badge ${badgeClass}">${utils.escape(order.deviceType || 'Otro')}</span>
      </div>
      ${order.reportedFault ? `<p class="card-fault">${utils.escape(order.reportedFault)}</p>` : ''}
      ${hasVehicle ? `
        <div class="card-vehicle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="20" r="1"/><circle cx="20" cy="20" r="1"/></svg>
          <span>${utils.escape([order.vehicleData?.brand, order.vehicleData?.model, order.vehicleData?.year].filter(Boolean).join(' '))}</span>
          ${hasDTC ? `<span class="card-dtc">· ${utils.escape(order.vehicleData.dtcCode)}</span>` : ''}
        </div>
      ` : ''}
      <div class="card-meta">
        <span class="card-date${isOverdue ? ' overdue' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${order.dueDate ? utils.formatDate(order.dueDate) : 'Sin fecha'}
        </span>
        ${order.budget ? `<span class="card-budget">${utils.formatCurrency(balance)} pendiente</span>` : ''}
      </div>
      <div class="card-actions">
        <button class="card-btn" data-action="view" data-id="${utils.escape(order.id)}" title="Ver detalle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Ver
        </button>
        <button class="card-btn" data-action="edit" data-id="${utils.escape(order.id)}" title="Editar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        <button class="card-btn card-btn-wa" data-action="wa" data-id="${utils.escape(order.id)}" title="WhatsApp Rápido">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
          WA
        </button>
      </div>
      <div class="card-status-quick">
        <select class="form-input form-select" data-action="quick-status" data-id="${utils.escape(order.id)}">
          ${kanban.COLUMNS.map(c => `<option value="${c}" ${c === (order.status || 'Nuevo Ingreso') ? 'selected' : ''}>${c}</option>`).join('')}
          <option value="Entregado">�o" Marcar como Entregado</option>
        </select>
      </div>
    `;

    // Drag & Drop events
    card.addEventListener('dragstart', e => {
      this.dragOrderId = order.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); this.dragOrderId = null; });

    return card;
  },

  onDrop(event) {
    event.preventDefault();
    const col = event.currentTarget;
    col.classList.remove('drag-over');
    const newStatus = col.getAttribute('data-status');

    if (this.dragOrderId && newStatus) {
      const order = ordersModule.getById(this.dragOrderId);

      if (order && order.status !== newStatus) {
        // Consultar antes de disparar WA
        if (order.clientPhone) {
          const sendWA = confirm(`¿Deseas enviar notificación por WhatsApp de que el equipo está en "${newStatus}"?`);
          if (sendWA) {
            const tempOrder = { ...order, status: newStatus };
            let tmpl = 4; // Avance
            if (newStatus === 'Nuevo Ingreso') tmpl = 1;
            else if (newStatus === 'Listo para Entrega') tmpl = 2;
            else if (newStatus === 'Entregado') tmpl = 3;

            waModule.open(tempOrder, tmpl);
          }
        }

        ordersModule.updateStatus(this.dragOrderId, newStatus)
          .then(() => toast.show('Estado actualizado', `Movido a "${newStatus}"`, 'success'))
          .catch(err => toast.show('Error', err.message, 'error'));
      }
    }
  },

  updateKPIs(orders) {
    const active = orders.filter(o => o.status !== 'Entregado' && o.status !== 'Listo para Entrega');
    const ready = orders.filter(o => o.status === 'Listo para Entrega');
    const overdue = orders.filter(o => {
      const days = utils.daysSince(o.updatedAt);
      return o.status !== 'Entregado' && (days >= 3 || (o.dueDate && new Date(o.dueDate) < new Date()));
    });
    const revenue = orders
      .filter(o => o.status !== 'Entregado')
      .reduce((sum, o) => sum + Math.max(0, (Number(o.budget) || 0) - (Number(o.downPayment) || 0)), 0);

    this.setKPI('kpi-val-total', active.length);
    this.setKPI('kpi-val-ready', ready.length);
    this.setKPI('kpi-val-overdue', overdue.length);
    this.setKPI('kpi-val-revenue', utils.formatCurrency(revenue));
  },

  setKPI(id, value) {
    const el = document.getElementById(id);
    if (el && el.textContent !== String(value)) el.textContent = value;
  },

  statusId(status) {
    const map = {
      'Nuevo Ingreso': 'nuevo',
      'En Reparación': 'reparacion',
      'Esperando Piezas': 'piezas',
      'Listo para Entrega': 'listo',
      'Entregado': 'entregado',
    };
    return map[status] || 'nuevo';
  },

  setupDragOverListeners() {
    document.querySelectorAll('.column-cards').forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.closest('.kanban-column').classList.add('drag-over'); });
      col.addEventListener('dragleave', () => { col.closest('.kanban-column').classList.remove('drag-over'); });
      col.addEventListener('drop', e => { col.closest('.kanban-column').classList.remove('drag-over'); });
    });
  },
};

window.kanban = kanban;
