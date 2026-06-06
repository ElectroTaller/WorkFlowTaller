/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.�
   WORKFLOW TALLER �?" app.js
   Motor completo: Firebase | Kanban | Forms | WhatsApp | Print
   Versión: 1.0.0 | Offline-First | Real-Time Sync
�.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */

'use strict';

/* "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
   M"DULO: ORDENES (CRUD)
"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"? */
const ordersModule = {
  /** Cache local de órdenes */
  orders: new Map(),
  unsubscribe: null,

  /** Escucha en tiempo real de Firebase o carga desde localStorage */
  startListening(onUpdate) {
    const col = firebaseModule.getCollection();
    if (col) {
      // Modo Firebase: suscripción en tiempo real (sin orderBy para no excluir docs manuales sin createdAt)
      this.unsubscribe = col.onSnapshot(
        snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'removed') {
              this.orders.delete(change.doc.id);
            } else {
              this.orders.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
            }
          });
          this.saveLocal();
          // Función segura para obtener la fecha
          const getTime = val => {
            if (!val) return 0;
            if (val.toDate) return val.toDate().getTime();
            if (val instanceof Date) return val.getTime();
            return new Date(val).getTime() || 0;
          };

          // Ordenar en el cliente
          const sorted = [...this.orders.values()].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
          onUpdate(sorted);
        },
        err => {
          console.error('[Firestore] Error del listener:', err.code, err.message);
          if (err.code === 'permission-denied') {
            firebaseModule.setStatus('offline');
            toast.show(
              'Permiso denegado en Firestore',
              'Ve a Firebase Console -> Firestore -> Reglas y cambia a modo prueba.',
              'error',
              10000
            );
          } else {
            toast.show('Error de sincronización', err.message, 'error');
          }
        }
      );
    } else {
      // Modo Local: cargar desde localStorage
      const stored = this.loadLocal();
      stored.forEach(o => this.orders.set(o.id, o));

      const getTime = val => {
        if (!val) return 0;
        if (val.toDate) return val.toDate().getTime();
        if (val instanceof Date) return val.getTime();
        return new Date(val).getTime() || 0;
      };

      const sorted = [...this.orders.values()].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
      onUpdate(sorted);
    }
  },

  async save(orderData) {
    const col = firebaseModule.getCollection();
    const isNew = !orderData.id;
    const id = orderData.id || utils.generateOrderId();
    const now = new Date().toISOString();

    // Limpiar campos undefined y NaN que Firestore no acepta
    const clean = obj => {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue;
        if (typeof v === 'number' && isNaN(v)) continue;  // Elimina NaN
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
          out[k] = clean(v);
        } else {
          out[k] = v;
        }
      }
      return out;
    };

    const data = clean({
      ...orderData,
      id,
      updatedAt: now,
      createdAt: orderData.createdAt || now,
    });
    delete data.id;

    if (col) {
      await Promise.race([
        col.doc(id).set(data, { merge: true }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firebase tardó demasiado. Verifica reglas de Firestore.')), 10000)
        )
      ]);
      console.log('[Firebase] �o. Orden guardada:', id);
    } else {
      this.orders.set(id, { id, ...data });
      this.saveLocal();
      kanban.render([...this.orders.values()]);
    }
    return { id, ...data };
  },

  async delete(id) {
    const col = firebaseModule.getCollection();
    if (col) {
      await col.doc(id).delete();
    } else {
      this.orders.delete(id);
      this.saveLocal();
      kanban.render([...this.orders.values()]);
    }
  },

  async updateStatus(id, newStatus) {
    const col = firebaseModule.getCollection();
    const now = new Date().toISOString();
    if (col) {
      await col.doc(id).update({ status: newStatus, updatedAt: now });
    } else {
      const o = this.orders.get(id);
      if (o) { o.status = newStatus; o.updatedAt = now; }
      this.saveLocal();
      kanban.render([...this.orders.values()]);
    }
  },

  getById(id) { return this.orders.get(id); },

  saveLocal() {
    try { localStorage.setItem('wft_orders', JSON.stringify([...this.orders.values()])); }
    catch { /* Storage full */ }
  },

  loadLocal() {
    try { return JSON.parse(localStorage.getItem('wft_orders')) || []; }
    catch { return []; }
  },
};

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   M�"DULO: KANBAN
�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   M�"DULO: FORMULARIO
�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */
const formModule = {
  currentId: null,

  open(order = null) {
    this.currentId = order?.id || null;
    const modal = document.getElementById('modal-order');
    const title = document.getElementById('modal-order-title');
    title.textContent = order ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo';

    this.resetForm();
    if (order) this.populate(order);
    this.updateBalance();

    modal.hidden = false;
    document.getElementById('field-client-name')?.focus();
  },

  close() {
    document.getElementById('modal-order').hidden = true;
    this.currentId = null;
  },

  resetForm() {
    document.getElementById('order-form').reset();
    document.getElementById('field-order-id').value = '';
    document.getElementById('field-client-cedula').value = '';
    document.getElementById('field-client-ruc').value = '';
    document.getElementById('field-client-pin').value = '';
    const waLineSelect = document.getElementById('field-wa-line');
    if (waLineSelect) waLineSelect.value = '1';
    document.getElementById('field-device-type').value = 'ECU Automotriz';
    this.setDeviceType('ECU Automotriz');
    document.getElementById('fields-vehicle').style.display = 'none';
    document.getElementById('fields-ac').style.display = 'none';
    document.querySelectorAll('.device-type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-type="ECU Automotriz"]')?.classList.add('active');
    // Mostrar campos de vehículo por defecto para ECU
    document.getElementById('fields-vehicle').style.display = 'grid';
    // Limpiar checkboxes de componentes
    ['chk-tarjeta-evap', 'chk-tarjeta-cond', 'chk-sensor-evap', 'chk-sensor-cond', 'chk-ventilador', 'chk-display', 'chk-control']
      .forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });
    // Setear fecha de hoy
    const dueDate = document.getElementById('field-due-date');
    if (dueDate) dueDate.value = '';
  },

  populate(order) {
    document.getElementById('field-order-id').value = order.id || '';
    document.getElementById('field-client-name').value = order.clientName || '';
    document.getElementById('field-client-phone').value = order.clientPhone || '';
    document.getElementById('field-client-cedula').value = order.clientCedula || '';
    document.getElementById('field-client-ruc').value = order.clientRuc || '';
    document.getElementById('field-client-pin').value = order.clientPin || '';
    document.getElementById('field-status').value = order.status || 'Nuevo Ingreso';
    const waLineSelect = document.getElementById('field-wa-line');
    if (waLineSelect) waLineSelect.value = order.waLine || '1';
    document.getElementById('field-device-type').value = order.deviceType || 'ECU Automotriz';
    document.getElementById('field-device-desc').value = order.deviceDesc || '';
    document.getElementById('field-fault').value = order.reportedFault || '';
    document.getElementById('field-tech-notes').value = order.technicalNotes || '';
    document.getElementById('field-budget').value = order.budget || '';
    document.getElementById('field-down-payment').value = order.downPayment || '';
    if (order.dueDate) {
      const dd = document.getElementById('field-due-date');
      if (dd) dd.value = typeof order.dueDate === 'string' ? order.dueDate.substring(0, 10) : '';
    }

    // Device type UI
    this.setDeviceType(order.deviceType || 'ECU Automotriz');
    document.querySelectorAll('.device-type-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.type === order.deviceType);
    });

    // Vehicle data
    if (order.vehicleData) {
      document.getElementById('field-v-brand').value = order.vehicleData.brand || '';
      document.getElementById('field-v-model').value = order.vehicleData.model || '';
      document.getElementById('field-v-year').value = order.vehicleData.year || '';
      document.getElementById('field-v-vin').value = order.vehicleData.vin || '';
      document.getElementById('field-v-dtc').value = order.vehicleData.dtcCode || '';
    }

    // AC data
    if (order.acData) {
      document.getElementById('field-ac-brand').value = order.acData.brand || '';
      document.getElementById('field-ac-model').value = order.acData.model || '';
      document.getElementById('field-ac-btu').value = order.acData.btu || '';
      document.getElementById('field-ac-tech').value = order.acData.tech || '';
      const ecEl = document.getElementById('field-ac-error-code');
      if (ecEl) ecEl.value = order.acData.errorCode || '';
      // Restore checkboxes
      const comp = order.acData.components || {};
      const chkMap = {
        'chk-tarjeta-evap': comp.tarjetaEvap,
        'chk-tarjeta-cond': comp.tarjetaCond,
        'chk-sensor-evap': comp.sensorEvap,
        'chk-sensor-cond': comp.sensorCond,
        'chk-ventilador': comp.ventilador,
        'chk-display': comp.display,
        'chk-control': comp.control,
      };
      Object.entries(chkMap).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!val;
      });
    }
  },

  setDeviceType(type) {
    const needsVehicle = ['ECU Automotriz', 'Tablero Electrónico'].includes(type);
    const needsAC = type === 'Tarjeta A/C';
    document.getElementById('fields-vehicle').style.display = needsVehicle ? 'grid' : 'none';
    document.getElementById('fields-ac').style.display = needsAC ? 'grid' : 'none';
    document.getElementById('field-device-type').value = type;
    
    // Automatic waLine selection
    const waLineSelect = document.getElementById('field-wa-line');
    if (waLineSelect) {
      if (needsVehicle) waLineSelect.value = '1';
      else if (needsAC || type === 'Otro') waLineSelect.value = '2';
    }
  },

  updateBalance() {
    const budget = Number(document.getElementById('field-budget')?.value) || 0;
    const down = Number(document.getElementById('field-down-payment')?.value) || 0;
    const balance = document.getElementById('balance-display');
    if (balance) balance.textContent = utils.formatCurrency(budget - down);
  },

  collectData() {
    const type = document.getElementById('field-device-type').value;
    const needsVehicle = ['ECU Automotriz', 'Tablero Electrónico'].includes(type);
    const needsAC = type === 'Tarjeta A/C';

    const data = {
      id: this.currentId || null,
      clientName: document.getElementById('field-client-name').value.trim(),
      clientPhone: document.getElementById('field-client-phone').value.trim(),
      clientCedula: document.getElementById('field-client-cedula').value.trim(),
      clientRuc: document.getElementById('field-client-ruc').value.trim(),
      clientPin: document.getElementById('field-client-pin').value.trim() || clientsModule.generateUniquePin(document.getElementById('field-client-ruc').value.trim() || document.getElementById('field-client-cedula').value.trim()),
      waLine: parseInt(document.getElementById('field-wa-line')?.value) || 1,
      status: document.getElementById('field-status').value,
      deviceType: type,
      deviceDesc: document.getElementById('field-device-desc').value.trim(),
      reportedFault: document.getElementById('field-fault').value.trim(),
      technicalNotes: document.getElementById('field-tech-notes').value.trim(),
      budget: parseFloat(document.getElementById('field-budget').value) || 0,
      downPayment: parseFloat(document.getElementById('field-down-payment').value) || 0,
      dueDate: document.getElementById('field-due-date').value || null,
      vehicleData: null,
      acData: null,
    };

    if (needsVehicle) {
      const yearRaw = parseInt(document.getElementById('field-v-year').value);
      data.vehicleData = {
        brand: document.getElementById('field-v-brand').value.trim(),
        model: document.getElementById('field-v-model').value.trim(),
        year: isNaN(yearRaw) ? null : yearRaw,
        vin: document.getElementById('field-v-vin').value.toUpperCase().trim(),
        dtcCode: document.getElementById('field-v-dtc').value.trim(),
      };
    }
    if (needsAC) {
      data.acData = {
        brand: document.getElementById('field-ac-brand').value,
        model: document.getElementById('field-ac-model').value.trim(),
        btu: document.getElementById('field-ac-btu').value.trim(),
        tech: document.getElementById('field-ac-tech').value,
        errorCode: (document.getElementById('field-ac-error-code')?.value || '').trim(),
        components: {
          tarjetaEvap: document.getElementById('chk-tarjeta-evap')?.checked || false,
          tarjetaCond: document.getElementById('chk-tarjeta-cond')?.checked || false,
          sensorEvap: document.getElementById('chk-sensor-evap')?.checked || false,
          sensorCond: document.getElementById('chk-sensor-cond')?.checked || false,
          ventilador: document.getElementById('chk-ventilador')?.checked || false,
          display: document.getElementById('chk-display')?.checked || false,
          control: document.getElementById('chk-control')?.checked || false,
        },
      };
    }
    return data;
  },

  validate(data) {
    if (!data.clientName) { toast.show('Campo requerido', 'Ingresa el nombre del cliente.', 'warning'); return false; }
    if (!data.clientPhone) { toast.show('Campo requerido', 'Ingresa el teléfono/WhatsApp del cliente.', 'warning'); return false; }
    if (!data.reportedFault) { toast.show('Campo requerido', 'Describe la falla reportada.', 'warning'); return false; }
    return true;
  },
};

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   M�"DULO: WHATSAPP
�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */
const waModule = {
  getShopName() {
    try {
      const cfg = JSON.parse(localStorage.getItem('wft_firebase_config')) || {};
      return cfg.shopName || 'ELECTROTALLER';
    } catch { return 'ELECTROTALLER'; }
  },

  buildPhone(phone) {
    return phone.replace(/\D/g, '');
  },

  sep() { return '· - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - '; },

  /* 💬 Plantilla 0: Saludo Inicial */
  async sendGreeting(order) {
    const shop = this.getShopName();
    const msg = `¡Hola *${order.clientName}*! Soy ElectroBot, tu asistente virtual de *${shop}*.\n\nQuedo a tu entera disposición. A continuación te comparto la orden de trabajo correspondiente a tu servicio.`;

    const phone = this.buildPhone(order.clientPhone || '');
    const host = window.location.hostname || 'localhost';

    try {
      toast.show('Enviando Saludo...', 'Conectando con el bot local', 'info', 5000);
      const response = await fetch(`http://${host}:3000/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'wft-bot-2026' },
        body: JSON.stringify({ phone, message: msg, line: order.waLine || 1 })
      });

      const data = await response.json();
      if (data.success) {
        toast.show('WhatsApp Automático', `Saludo enviado a ${order.clientName}`, 'success');
      } else {
        throw new Error(data.error || 'Error del servidor local');
      }
    } catch (error) {
      console.warn('Bot local no disponible o error:', error);
      toast.show('Bot no disponible', 'Abriendo modo manual...', 'warning', 3000);
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },

  /* 🧾 Plantilla 1: Ingreso 🧾 */
  template1_Ingreso(order) {
    const veh = order.vehicleData;
    const ac = order.acData;
    const shop = this.getShopName();
    const bal = (Number(order.budget) || 0) - (Number(order.downPayment) || 0);
    const sep = this.sep();

    // Bloque dispositivo (condicional)
    const lines = [`📱 *Tipo:* ${order.deviceType}${order.deviceDesc ? ' - ' + order.deviceDesc : ''}`];
    if (veh && (veh.brand || veh.vin || veh.dtcCode)) {
      const vName = [veh.brand, veh.model, veh.year].filter(Boolean).join(' ');
      if (vName) lines.push(`🚗 *Vehiculo:* ${vName}`);
      if (veh.vin) lines.push(`🔖 *VIN:* ${veh.vin}`);
      if (veh.dtcCode) lines.push(`⚠️ *Codigo DTC:* ${veh.dtcCode}`);
    }
    if (ac && (ac.brand || ac.model)) {
      lines.push(`❄️ *Equipo A/C:* ${[ac.brand, ac.model].filter(Boolean).join(' ')}${ac.btu ? ' ' + ac.btu : ''}`);
      if (ac.tech) lines.push(`⚙️ *Tecnologia:* ${ac.tech}`);
      if (ac.errorCode) lines.push(`⚠️ *Cdigo de Error:* ${ac.errorCode}`);
      if (ac.components) {
        const compLabels = { tarjetaEvap: 'Tarjeta Evap.', tarjetaCond: 'Tarjeta Cond.', sensorEvap: 'Sensor Evap.', sensorCond: 'Sensor Cond.', ventilador: 'Ventilador', display: 'Display', control: 'Control Remoto' };
        const activos = Object.entries(ac.components).filter(([, v]) => v).map(([k]) => compLabels[k] || k);
        if (activos.length) lines.push(`📦 *Componentes entregados:* ${activos.join(', ')}`);
      }
    }
    const deviceBlock = lines.join('\n');

    // Bloque de costos (solo si hay presupuesto)
    const costLines = [];
    if (order.budget) {
      costLines.push('');
      costLines.push(sep);
      costLines.push('💰 *COSTOS ESTIMADOS*');
      costLines.push(`💰 Presupuesto:    *${utils.formatCurrency(order.budget)}*`);
      if (order.downPayment) {
        costLines.push(`💰 Anticipo rec.:  ${utils.formatCurrency(order.downPayment)}`);
        costLines.push(`💲 Saldo pend.:    *${utils.formatCurrency(bal)}*`);
      }
    }

    return [
      `🏪 *${shop}*`,
      `🧾 Recibo de Ingreso`,
      sep,
      `Estimado/a *${order.clientName}*, hemos recibido su equipo.`,
      '',
      sep,
      `📋 DATOS DE LA ORDEN`,
      sep,
      `🔖 Orden:  ${order.id}`,
      `📅 Ingreso: ${utils.formatDate(order.createdAt)}`,
      order.clientPin ? `🔑 PIN Rápido: *${order.clientPin}*` : '',
      order.dueDate ? `⏱️ Entrega est.: ${utils.formatDate(order.dueDate)}` : '',
      '',
      sep,
      `📱 DISPOSITIVO`,
      sep,
      deviceBlock,
      '',
      sep,
      `⚠️ FALLA REPORTADA`,
      sep,
      `_"${order.reportedFault}"_`,
      ...costLines,
      '',
      sep,
      `Su equipo esta en buenas manos.`,
      `Le avisaremos cuando haya novedades.`,
      '',
      `ElectroTaller - Electronica Automotriz y HVAC`,
    ].filter(l => l !== null && l !== undefined).join('\n');
  },

  /* Plantilla 2: Equipo Listo */
  template2_Listo(order) {
    const veh = order.vehicleData;
    const ac = order.acData;
    const balance = (Number(order.budget) || 0) - (Number(order.downPayment) || 0);
    const shop = this.getShopName();
    const sep = this.sep();

    const deviceLines = [`📱 *${order.deviceType}*${order.deviceDesc ? ' - ' + order.deviceDesc : ''}`];
    if (veh?.brand) deviceLines.push(`🚗 ${[veh.brand, veh.model, veh.year].filter(Boolean).join(' ')}`);
    if (ac?.brand) deviceLines.push(`❄️ ${[ac.brand, ac.model].filter(Boolean).join(' ')}`);

    const balanceLine = balance > 0
      ? `💰 Saldo a pagar: ${utils.formatCurrency(balance)}*`
      : `✅ Pagado en su totalidad`;

    return [
      `✅ *${shop}*`,
      `📢 EQUIPO REPARADO Y LISTO`,
      sep,
      `Buenas noticias, *${order.clientName}*!`,
      `Su equipo fue reparado exitosamente.`,
      '',
      sep,
      `ℹ️ DETALLE`,
      sep,
      `🔖 Orden: ${order.id}`,
      order.clientPin ? `🔑 PIN Rápido: *${order.clientPin}*` : '',
      ...deviceLines,
      '',
      sep,
      `💳 RESUMEN DE PAGO`,
      sep,
      `💰 Costo total:    *${utils.formatCurrency(order.budget)}*`,
      `💳 Anticipo pag.:  ${utils.formatCurrency(order.downPayment)}`,
      balanceLine,
      '',
      sep,
      `⏰ Pase a retirar su equipo al taller.`,
      `🕒 Horario: Lun - Vie de 8am a 12pm y 1pm a 6pm`,
      `🛡️ _Garantia: ${order.deviceType === 'Tarjeta A/C' ? '30 dias' : '3 meses'} sobre la reparacion._`,
      '',
      `ElectroTaller - Electronica Automotriz y HVAC`,
    ].join('\n');
  },

  /* Plantilla 3: Recibo de Entrega */
  template3_Entrega(order) {
    const veh = order.vehicleData;
    const ac = order.acData;
    const shop = this.getShopName();
    const sep = this.sep();

    const deviceLines = [`📱 *${order.deviceType}*${order.deviceDesc ? ' - ' + order.deviceDesc : ''}`];
    if (veh?.brand) deviceLines.push(`🚗 ${[veh.brand, veh.model, veh.year].filter(Boolean).join(' ')}`);
    if (veh?.vin) deviceLines.push(`🏷️ VIN: ${veh.vin}`);
    if (ac?.brand) deviceLines.push(`❄️ ${[ac.brand, ac.model].filter(Boolean).join(' ')}`);

    return [
      `🏪 *${shop}*`,
      `📦 RECIBO DE ENTREGA`,
      sep,
      `*${order.clientName}*, su equipo ha sido entregado. ✅`,
      '',
      sep,
      `📋 RESUMEN DEL SERVICIO`,
      sep,
      `🔖 Orden: ${order.id}`,
      order.clientPin ? `🔑 PIN Rápido: *${order.clientPin}*` : '',
      ...deviceLines,
      `📅 Fecha entrega: ${utils.formatDate(new Date())}`,
      `💰 Total pagado: *${utils.formatCurrency(order.budget)}*`,
      '',
      sep,
      `🛡️ GARANTIA`,
      sep,
      `✔️ ${order.deviceType === 'Tarjeta A/C' ? '30 dias' : '3 meses'} sobre la reparacion realizada.`,
      `❌ No aplica por mal uso o golpes externos.`,
      '',
      `📄 Conserve este mensaje como comprobante.`,
      '',
      sep,
      `🙏 Gracias por su preferencia!`,
      '',
      `ElectroTaller - Electronica Automotriz y HVAC`,
    ].join('\n');
  },

  /* Plantilla 4: Avance de Reparación */
  template4_Avance(order) {
    const shop = this.getShopName();
    const sep = this.sep();
    let statusMsg = '';

    if (order.status === 'En Reparación') {
      statusMsg = `Su equipo se encuentra actualmente en proceso de reparación. Le notificaremos en cuanto finalice.`;
    } else if (order.status === 'Esperando Piezas') {
      statusMsg = `Nos encontramos a la espera de refacciones o componentes para continuar con la reparación de su equipo.`;
      if (order.technicalNotes) {
        statusMsg += `\n\n*Nota Técnica de Revisión:*\n${order.technicalNotes}`;
      }
    } else {
      statusMsg = `Queríamos informarle que seguimos trabajando en su equipo y le mantendremos al tanto de cualquier novedad.`;
    }

    return [
      `🏪 *${shop}*`,
      `🛠️ *AVANCE DE SERVICIO*`,
      sep,
      `Estimado/a *${order.clientName}*,`,
      '',
      statusMsg,
      '',
      sep,
      `🔖 *Orden:* ${order.id}`,
      order.clientPin ? `🔑 *PIN Rápido:* ${order.clientPin}` : '',
      `📱 *Equipo:* ${order.deviceType}${order.deviceDesc ? ' - ' + order.deviceDesc : ''}`,
      sep,
      '',
      '',
      `_ElectroTaller - Electronica Automotriz y HVAC_`,
    ].join('\n');
  },

  /* Plantilla 5: Espera Consignación */
  template5_Consignacion(order) {
    const shop = this.getShopName();
    const sep = this.sep();
    let statusMsg = `Nos encontramos a la espera de la consignación de las piezas faltantes para poder realizar el diagnóstico y/o reparación de su equipo.`;
    return [
      `🏪 *${shop}*`,
      `🛠️ *RECORDATORIO DE PIEZAS FALTANTES*`,
      sep,
      `Estimado/a *${order.clientName}*,`,
      '',
      statusMsg,
      '',
      sep,
      `🔖 *Orden:* ${order.id}`,
      order.clientPin ? `🔑 *PIN Rápido:* ${order.clientPin}` : '',
      `📱 *Equipo:* ${order.deviceType}${order.deviceDesc ? ' - ' + order.deviceDesc : ''}`,
      sep,
      '',
      `_ElectroTaller - Electronica Automotriz y HVAC_`,
    ].join('\n');
  },

  /* Plantilla 6: En Reparación */
  template6_EnReparacion(order) {
    const shop = this.getShopName();
    const sep = this.sep();
    let statusMsg = `Su equipo se encuentra actualmente en proceso de reparación en nuestro laboratorio.`;
    return [
      `🏪 *${shop}*`,
      `🛠️ *AVISO DE REPARACIÓN*`,
      sep,
      `Estimado/a *${order.clientName}*,`,
      '',
      statusMsg,
      '',
      sep,
      `🔖 *Orden:* ${order.id}`,
      order.clientPin ? `🔑 *PIN Rápido:* ${order.clientPin}` : '',
      `📱 *Equipo:* ${order.deviceType}${order.deviceDesc ? ' - ' + order.deviceDesc : ''}`,
      sep,
      '',
      `_ElectroTaller - Electronica Automotriz y HVAC_`,
    ].join('\n');
  },

  async open(order, templateNumber) {
    let msg;
    if (templateNumber === 1) msg = this.template1_Ingreso(order);
    else if (templateNumber === 2) msg = this.template2_Listo(order);
    else if (templateNumber === 3) msg = this.template3_Entrega(order);
    else if (templateNumber === 5) msg = this.template5_Consignacion(order);
    else if (templateNumber === 6) msg = this.template6_EnReparacion(order);
    else msg = this.template4_Avance(order);

    const phone = this.buildPhone(order.clientPhone || '');

    // Intentar enviar mediante el bot local
    try {
      toast.show('Enviando WhatsApp...', 'Conectando con el bot local', 'info', 5000);
      await whatsappApi.sendMessage(phone, msg, order.waLine || 1);
      toast.show('WhatsApp Automático', `Mensaje enviado a ${order.clientName}`, 'success');
    } catch (error) {
      console.warn('Bot local no disponible o error:', error);
      toast.show('Bot no disponible', 'Abriendo modo manual...', 'warning', 3000);
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },

  syncOrdersToBot(orders) {
    // Mapear órdenes para enviar solo los datos necesarios y no saturar la red
    const payload = orders.map(o => ({
      id: o.id,
      clientName: o.clientName,
      clientPhone: o.clientPhone,
      securityPin: o.clientPin,
      deviceType: o.deviceType,
      deviceDesc: o.deviceDesc,
      status: o.status,
      budget: o.budget,
      downPayment: o.downPayment,
      vehicleData: o.vehicleData,
      acData: o.acData
    }));

    whatsappApi.syncOrders(payload).catch(err => console.debug('Sync-orders al bot local falló (quizá está apagado)', err));
  }
};




/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   M�"DULO: IMPRESI�"N / PDF
�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */
const printModule = {
  getShopName() {
    try { return JSON.parse(localStorage.getItem('wft_firebase_config'))?.shopName || 'ElectroTaller'; } catch { return 'ElectroTaller'; }
  },

  print(order) {
    const shop = this.getShopName();
    const balance = (Number(order.budget) || 0) - (Number(order.downPayment) || 0);
    const veh = order.vehicleData;
    const ac = order.acData;

    const vehicleSection = veh ? `
      <div class="print-section">
        <div class="print-section-title">Datos del Vehículo</div>
        <div class="print-grid">
          ${veh.brand ? `<div class="print-field"><div class="print-field-label">Marca</div><div class="print-field-value">${utils.escape(veh.brand)}</div></div>` : ''}
          ${veh.model ? `<div class="print-field"><div class="print-field-label">Modelo</div><div class="print-field-value">${utils.escape(veh.model)}</div></div>` : ''}
          ${veh.year ? `<div class="print-field"><div class="print-field-label">Año</div><div class="print-field-value">${veh.year}</div></div>` : ''}
          ${veh.vin ? `<div class="print-field"><div class="print-field-label">VIN / N° Serie</div><div class="print-field-value mono">${utils.escape(veh.vin)}</div></div>` : ''}
          ${veh.dtcCode ? `<div class="print-field"><div class="print-field-label">Código DTC / Falla</div><div class="print-field-value mono" style="color:#b45309">${utils.escape(veh.dtcCode)}</div></div>` : ''}
        </div>
      </div>` : '';

    const acSection = ac ? `
      <div class="print-section">
        <div class="print-section-title">Datos del Equipo A/C</div>
        <div class="print-grid">
          ${ac.brand ? `<div class="print-field"><div class="print-field-label">Marca</div><div class="print-field-value">${utils.escape(ac.brand)}</div></div>` : ''}
          ${ac.model ? `<div class="print-field"><div class="print-field-label">Modelo</div><div class="print-field-value">${utils.escape(ac.model)}</div></div>` : ''}
          ${ac.btu ? `<div class="print-field"><div class="print-field-label">Capacidad</div><div class="print-field-value">${utils.escape(ac.btu)}</div></div>` : ''}
          ${ac.tech ? `<div class="print-field"><div class="print-field-label">Tecnología</div><div class="print-field-value">${utils.escape(ac.tech)}</div></div>` : ''}
        </div>
      </div>` : '';

    const html = `
      <div class="print-receipt">
        <div class="print-header">
          <div>
            <div class="print-shop-name">${utils.escape(shop)}</div>
            <div class="print-shop-sub">Electrónica Automotriz · Climatización · Reparación</div>
          </div>
          <div>
            <div class="print-order-id">${utils.escape(order.id)}</div>
            <div class="print-date">Emitido: ${utils.formatDate(new Date(), true)}</div>
          </div>
        </div>

        <div class="print-section">
          <div class="print-section-title">Datos del Cliente</div>
          <div class="print-grid">
            <div class="print-field"><div class="print-field-label">Nombre</div><div class="print-field-value">${utils.escape(order.clientName)}</div></div>
            <div class="print-field"><div class="print-field-label">Cédula / RUC</div><div class="print-field-value">${utils.escape(order.clientId || '')}</div></div>
            <div class="print-field"><div class="print-field-label">Teléfono / WhatsApp</div><div class="print-field-value">${utils.escape(order.clientPhone)}</div></div>
          </div>
        </div>

        <div class="print-section">
          <div class="print-section-title">Dispositivo a Reparar</div>
          <div class="print-grid">
            <div class="print-field"><div class="print-field-label">Tipo</div><div class="print-field-value">${utils.escape(order.deviceType)}</div></div>
            ${order.deviceDesc ? `<div class="print-field"><div class="print-field-label">Descripción</div><div class="print-field-value">${utils.escape(order.deviceDesc)}</div></div>` : ''}
            <div class="print-field"><div class="print-field-label">Estado</div><div class="print-field-value">${utils.escape(order.status)}</div></div>
            ${order.dueDate ? `<div class="print-field"><div class="print-field-label">Entrega Estimada</div><div class="print-field-value">${utils.formatDate(order.dueDate)}</div></div>` : ''}
          </div>
        </div>

        ${vehicleSection}
        ${acSection}

        <div class="print-section">
          <div class="print-section-title">Descripción de la Falla</div>
          <div class="print-fault-box">${utils.escape(order.reportedFault || '�?"')}</div>
          ${order.technicalNotes ? `<div class="print-fault-box" style="margin-top:6px;border-left-color:#7c3aed"><strong>Notas Técnicas:</strong> ${utils.escape(order.technicalNotes)}</div>` : ''}
        </div>

        <div class="print-section">
          <div class="print-section-title">Resumen de Costos</div>
          <div class="print-cost-box">
            <div>
              <span class="print-cost-item-label">Costo Total</span>
              <span class="print-cost-item-value">${utils.formatCurrency(order.budget)}</span>
            </div>
            <div>
              <span class="print-cost-item-label">Anticipo</span>
              <span class="print-cost-item-value">${utils.formatCurrency(order.downPayment)}</span>
            </div>
            <div>
              <span class="print-cost-item-label">Saldo Pendiente</span>
              <span class="print-cost-item-value balance">${utils.formatCurrency(balance)}</span>
            </div>
          </div>
        </div>

        <div class="print-footer">
          <div class="print-signature-box">Firma del Cliente / Recibí conforme</div>
          <div class="print-signature-box">Sello y Firma del Taller</div>
        </div>

        <div class="print-warranty">
          s️ Garantía de ${order.deviceType === 'Tarjeta A/C' ? '30 días' : '3 meses'} sobre la reparación realizada, sujeta a mal uso o condiciones externas.
          Esta orden es válida como comprobante de servicio.
        </div>
      </div>
    `;

    const printArea = document.getElementById('print-area');
    printArea.innerHTML = html;
    printArea.hidden = false;
    window.print();
    // Restaurar después de la impresión
    setTimeout(() => {
      printArea.innerHTML = '';
      printArea.hidden = true;
    }, 1000);
  },
};

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   M�"DULO: MODAL DETALLE
�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   M�"DULO: CONFIGURACI�"N FIREBASE (UI)
�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   M�"DULO: PDF (jsPDF)
�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

const eventController = {
  init() {
    /* === Botón Nueva Orden === */
    document.getElementById('btn-new-order')?.addEventListener('click', () => formModule.open());

    /* === Botón Configuración === */
    document.getElementById('btn-config')?.addEventListener('click', () => configModal.open());

    /* === Cerrar Modales === */
    document.getElementById('modal-order-close')?.addEventListener('click', () => formModule.close());
    document.getElementById('btn-order-cancel')?.addEventListener('click', () => formModule.close());
    document.getElementById('modal-detail-close')?.addEventListener('click', () => detailModal.close());
    document.getElementById('modal-config-close')?.addEventListener('click', () => configModal.close());

    /* Cerrar modal al click en backdrop */
    ['modal-order', 'modal-detail', 'modal-config'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', e => {
        if (e.target === e.currentTarget) {
          e.currentTarget.hidden = true;
          if (id === 'modal-order') formModule.close();
          if (id === 'modal-detail') detailModal.close();
        }
      });
    });

    /* === Formulario de Orden === */
    document.getElementById('order-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const data = formModule.collectData();
      if (!formModule.validate(data)) return;
      const btn = document.getElementById('btn-order-save');
      btn.disabled = true;
      btn.textContent = 'Guardando�?�';
      try {
        await ordersModule.save(data);
        formModule.close();
        toast.show(data.id ? '�o. Orden actualizada' : '�o. Orden creada', `${data.clientName} · ${data.deviceType}`, 'success');
      } catch (err) {
        toast.show('Error al guardar', err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar Orden`;
      }
    });

    /* === Selector de Tipo de Dispositivo === */
    document.querySelectorAll('.device-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.device-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        formModule.setDeviceType(btn.dataset.type);
      });
    });

    /* === Balance automático === */
    ['field-budget', 'field-down-payment'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => formModule.updateBalance());
    });

    /* === Validaciones y auto-formato de campos === */

    // Función: convierte texto a Tipo Título (Primera letra de cada palabra en mayúscula)
    const toTitleCase = str => str.replace(/\b\w/g, l => l.toUpperCase());

    // Nombre del cliente �?' MAY�sSCULAS en tiempo real
    const nameEl = document.getElementById('field-client-name');
    if (nameEl) {
      nameEl.addEventListener('input', () => {
        const pos = nameEl.selectionStart;
        nameEl.value = nameEl.value.toUpperCase();
        nameEl.setSelectionRange(pos, pos);
      });
    }

    // Campos de texto �?' Tipo Título al salir del campo (field-ac-brand es select, se excluye)
    ['field-v-brand', 'field-v-model',
      'field-device-desc', 'field-ac-model'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur', () => {
          el.value = toTitleCase(el.value);
        });
      });

    // Teléfono: solo permite +, números, espacios, guiones y paréntesis
    document.getElementById('field-client-phone')?.addEventListener('input', e => {
      const raw = e.target.value;
      e.target.value = raw.replace(/[^\d\s\+\-\(\)]/g, '');
    });

    // Año del vehículo: solo dígitos, máximo 4 caracteres
    document.getElementById('field-v-year')?.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });

    // VIN: solo letras y números, mayúsculas automáticas
    document.getElementById('field-v-vin')?.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    });

    // Presupuesto y anticipo: solo números y punto decimal
    ['field-budget', 'field-down-payment'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', e => {
        const val = e.target.value.replace(/[^\d.]/g, '');
        // Evitar múltiples puntos decimales
        const parts = val.split('.');
        e.target.value = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
      });
    });

    /* === Búsqueda === */
    let searchDebounce;
    document.getElementById('search-input')?.addEventListener('input', e => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        kanban.searchQuery = e.target.value.trim();
        kanban.render([...ordersModule.orders.values()]);
      }, 250);
    });

    /* === Click en tarjetas Kanban (delegado) === */
    document.getElementById('kanban-board')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const order = ordersModule.getById(id);
      if (!order) return;

      if (action === 'view') detailModal.open(order);
      if (action === 'edit') { formModule.open(order); }
      if (action === 'wa') {
        let tmpl = 4; // Avance
        if (order.status === 'Nuevo Ingreso') tmpl = 1;
        else if (order.status === 'Listo para Entrega') tmpl = 2;
        else if (order.status === 'Entregado') tmpl = 3;
        waModule.open(order, tmpl);
      }
    });

    /* === Cambio rápido de estado desde la tarjeta (para móviles/PC) === */
    document.getElementById('kanban-board')?.addEventListener('change', e => {
      if (e.target.dataset.action === 'quick-status') {
        const id = e.target.dataset.id;
        const newStatus = e.target.value;
        const order = ordersModule.getById(id);

        if (order && order.status !== newStatus) {
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

          ordersModule.updateStatus(id, newStatus)
            .then(() => toast.show('Estado actualizado', `Movido a "${newStatus}"`, 'success'))
            .catch(err => toast.show('Error', err.message, 'error'));
        }
      }
    });

    /* === Modal Detalle �?" botones de acción === */
    document.getElementById('btn-detail-edit')?.addEventListener('click', () => {
      const order = detailModal.currentOrder;
      if (!order) return;
      detailModal.close();
      formModule.open(order);
    });

    document.getElementById('btn-detail-wa-saludar')?.addEventListener('click', () => {
      if (detailModal.currentOrder) waModule.sendGreeting(detailModal.currentOrder);
    });

    document.getElementById('btn-detail-wa1')?.addEventListener('click', () => {
      if (detailModal.currentOrder) waModule.open(detailModal.currentOrder, 1);
    });
    document.getElementById('btn-detail-wa2')?.addEventListener('click', () => {
      const order = detailModal.currentOrder;
      if (!order) return;
      if (order.status === 'Listo para Entrega') waModule.open(order, 2);
      else waModule.open(order, 4);
    });
    document.getElementById('btn-detail-wa3')?.addEventListener('click', () => {
      if (detailModal.currentOrder) waModule.open(detailModal.currentOrder, 3);
    });
    
    document.getElementById('btn-detail-wa5')?.addEventListener('click', () => {
      if (detailModal.currentOrder) waModule.open(detailModal.currentOrder, 5);
    });

    document.getElementById('btn-detail-wa6')?.addEventListener('click', () => {
      if (detailModal.currentOrder) waModule.open(detailModal.currentOrder, 6);
    });

    document.getElementById('btn-detail-pdf')?.addEventListener('click', () => {
      if (detailModal.currentOrder) pdfModule.generate(detailModal.currentOrder, false);
    });

    document.getElementById('btn-detail-pdf-wa')?.addEventListener('click', () => {
      const order = detailModal.currentOrder;
      if (order) pdfModule.generate(order, true);
    });

    document.getElementById('btn-detail-print')?.addEventListener('click', () => {
      if (detailModal.currentOrder) pdfModule.printDouble(detailModal.currentOrder);
    });
    document.getElementById('btn-generate-pin')?.addEventListener('click', () => {
      const cedulaInput = document.getElementById('field-client-cedula');
      const rucInput = document.getElementById('field-client-ruc');
      const pinInput = document.getElementById('field-client-pin');
      const targetVal = (rucInput.value.trim() || cedulaInput.value.trim());
      pinInput.value = clientsModule.generateUniquePin(targetVal);
      toast.show('PIN Generado', `El código de cuenta es: ${pinInput.value}`, 'success');
    });

    document.getElementById('btn-detail-delete')?.addEventListener('click', async () => {
      const order = detailModal.currentOrder;
      if (!order) return;
      if (!confirm(`¿Eliminar la orden ${order.id} de ${order.clientName}?\n\nEsta acción no se puede deshacer.`)) return;
      try {
        await ordersModule.delete(order.id);
        detailModal.close();
        toast.show('Orden eliminada', `${order.id} eliminada correctamente.`, 'info');
      } catch (err) {
        toast.show('Error al eliminar', err.message, 'error');
      }
    });

    /* === Config Firebase Form === */
    document.getElementById('config-form')?.addEventListener('submit', async e => {
      e.preventDefault();

      // Guardar configuración del Bot local
      const chk = document.getElementById('cfg-bot-human');
      if (chk) {
        try {
          const host = window.location.hostname || 'localhost';
          await fetch(`http://${host}:3000/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allowHumanContact: chk.checked })
          });
        } catch (err) {
          console.warn('No se pudo guardar la config del bot', err);
        }
      }

      const cfg = {
        apiKey: document.getElementById('cfg-api-key').value.trim(),
        projectId: document.getElementById('cfg-project-id').value.trim(),
        appId: document.getElementById('cfg-app-id').value.trim(),
        authDomain: document.getElementById('cfg-auth-domain').value.trim(),
        shopName: document.getElementById('cfg-shop-name').value.trim(),
      };
      if (!cfg.apiKey || !cfg.projectId) {
        toast.show('Faltan datos', 'API Key y Project ID son obligatorios.', 'warning'); return;
      }
      firebaseModule.saveConfig(cfg);
      configModal.close();
      toast.show('Configuración guardada', 'Recargando para conectar a Firebase�?�', 'success');
      setTimeout(() => location.reload(), 1500);
    });

    document.getElementById('btn-config-clear')?.addEventListener('click', () => {
      if (!confirm('¿Borrar la configuración de Firebase?\n\nLa app pasará a modo local.')) return;
      firebaseModule.clearConfig();
      configModal.close();
      toast.show('Configuración borrada', 'Recargando en modo local�?�', 'info');
      setTimeout(() => location.reload(), 1200);
    });

    /* === Tecla Escape === */
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (!document.getElementById('modal-clients').hidden) { clientsUIModule.close(); return; }
      if (!document.getElementById('modal-order').hidden) { formModule.close(); return; }
      if (!document.getElementById('modal-detail').hidden) { detailModal.close(); return; }
      if (!document.getElementById('modal-config').hidden) { configModal.close(); return; }
    });

    /* === Botón Clientes === */
    document.getElementById('btn-clients')?.addEventListener('click', () => clientsUIModule.open());
  },
};

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   INICIALIZACI�"N PRINCIPAL
�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */
const app = {
  kanban,

  async init() {
    toast.init();
    kanban.setupDragOverListeners();
    eventController.init();

    // Inicializar Firebase
    await firebaseModule.init();

    // Iniciar escucha de datos
    ordersModule.startListening(orders => {
      kanban.render(orders);
      waModule.syncOrdersToBot(orders);
    });

    // Iniciar escucha de clientes
    clientsModule.startListening();

    // Verificar si no hay configuración Firebase y mostrar bienvenida
    if (!firebaseModule.getConfig()) {
      setTimeout(() => {
        toast.show(
          '¡Bienvenido a ElectroTaller!',
          'Configura Firebase para sincronización en la nube, o trabaja en modo local.',
          'info',
          7000
        );
      }, 800);
    }

    console.log('%cElectroTaller v1.0 �o.', 'color:#00f5d4;font-weight:bold;font-size:14px');
  },
};

/* Arrancar la aplicación cuando el DOM esté listo */
document.addEventListener('DOMContentLoaded', () => app.init());

/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.�
   M�"DULO: CLIENTES
�.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */
const clientsModule = {
  clients: new Map(),
  unsubscribe: null,
  LOCAL_KEY: 'wft_clients',

  /** Normaliza texto para búsquedas (sin acentos, minúsculas) */
  normalize(str) {
    if (!str) return '';
    return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  },

  generateUniquePin(baseString) {
    let targetVal = (baseString || '').replace(/\D/g, '');
    if (targetVal.length < 2) targetVal = '00' + targetVal;
    const last2 = targetVal.slice(-2);
    let pin;
    let attempts = 0;
    do {
      const random2 = Math.floor(10 + Math.random() * 90); // 10 to 99
      pin = `${last2}${random2}`;
      attempts++;
    } while (attempts < 100 && [...this.clients.values()].some(c => c.clientPin === pin));
    return pin;
  },

  search(query) {
    if (!query) return [];
    const q = this.normalize(query);
    const qNum = q.replace(/\D/g, '');

    const results = [];
    for (const c of this.clients.values()) {
      const nName = this.normalize(c.name);
      const nPhone = c.phone ? c.phone.replace(/\D/g, '') : '';
      const nEmail = this.normalize(c.email);
      const nId = this.normalize(c.clientCedula);

      let score = 0;

      if (nName === q) score += 100;
      else if (nName.startsWith(q)) score += 50;
      else if (nName.includes(q)) score += 10;

      if (qNum) {
        if (nPhone === qNum) score += 80;
        else if (nPhone.startsWith(qNum)) score += 40;
        else if (nPhone.includes(qNum)) score += 8;
      }

      if (nId === q) score += 60;
      else if (nId.startsWith(q)) score += 30;
      else if (nId.includes(q)) score += 6;

      if (nEmail === q) score += 40;
      else if (nEmail.startsWith(q)) score += 20;
      else if (nEmail.includes(q)) score += 4;

      if (score > 0) {
        results.push({ client: c, score });
      }
    }

    // Ordenar de mayor puntuación a menor, y devolver los mejores 8
    results.sort((a, b) => b.score - a.score);
    return results.map(r => r.client).slice(0, 8);
  },

  /** Busca exactamente por nombre (case-insensitive) */
  findByName(name) {
    const q = this.normalize(name);
    return [...this.clients.values()].find(c => this.normalize(c.name) === q) || null;
  },

  /** Genera un ID para clientes locales */
  generateId() {
    return 'CLT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
  },

  /** Escucha Firestore o carga desde localStorage */
  startListening() {
    const col = firebaseModule.db ? firebaseModule.db.collection('clients') : null;
    if (col) {
      this.unsubscribe = col.onSnapshot(
        snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'removed') this.clients.delete(change.doc.id);
            else this.clients.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
          });
          this.saveLocal();
          clientsUIModule.render();
        },
        err => console.warn('[Clients] Firestore error:', err.message)
      );
    } else {
      const stored = this.loadLocal();
      stored.forEach(c => this.clients.set(c.id, c));
      clientsUIModule.render();
    }
  },

  /** Guarda o actualiza un cliente */
  async save(data) {
    const isNew = !data.id;
    const id = data.id || this.generateId();
    const now = new Date().toISOString();
    const record = {
      ...data,
      id,
      updatedAt: now,
      createdAt: data.createdAt || now,
    };
    delete record.id;

    const col = firebaseModule.db ? firebaseModule.db.collection('clients') : null;
    if (col) {
      await col.doc(id).set(record, { merge: true });
    } else {
      this.clients.set(id, { id, ...record });
      this.saveLocal();
      clientsUIModule.render();
    }
    return { id, ...record };
  },

  /** Elimina un cliente */
  async delete(id) {
    const col = firebaseModule.db ? firebaseModule.db.collection('clients') : null;
    if (col) {
      await col.doc(id).delete();
    } else {
      this.clients.delete(id);
      this.saveLocal();
      clientsUIModule.render();
    }
  },

  saveLocal() {
    try { localStorage.setItem(this.LOCAL_KEY, JSON.stringify([...this.clients.values()])); } catch { }
  },
  loadLocal() {
    try { return JSON.parse(localStorage.getItem(this.LOCAL_KEY)) || []; } catch { return []; }
  },
};

/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.�
   M�"DULO: UI DE CLIENTES (modal + autocomplete)
�.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */
const clientsUIModule = {
  /** �?" Modal principal �?" */
  open() {
    this.render();
    document.getElementById('modal-clients').hidden = false;
    document.getElementById('clients-search').value = '';
    document.getElementById('client-form-panel').hidden = true;
    document.getElementById('clients-search').focus();
  },

  close() {
    document.getElementById('modal-clients').hidden = true;
  },

  /** Renderiza la tabla de clientes (filtrada por búsqueda interna) */
  render(filter = '') {
    const tbody = document.getElementById('clients-tbody');
    const emptyEl = document.getElementById('clients-empty');
    const countEl = document.getElementById('clients-count');
    if (!tbody) return;

    const q = clientsModule.normalize(filter);
    const all = [...clientsModule.clients.values()].filter(c => {
      if (!q) return true;
      return (
        clientsModule.normalize(c.name).includes(q) ||
        (c.phone && c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))) ||
        (c.email && clientsModule.normalize(c.email).includes(q)) ||
        (c.address && clientsModule.normalize(c.address).includes(q)) ||
        (c.clientCedula && clientsModule.normalize(c.clientCedula).includes(q))
      );
    }).sort((a, b) => clientsModule.normalize(a.name).localeCompare(clientsModule.normalize(b.name)));

    countEl.textContent = `${all.length} cliente${all.length !== 1 ? 's' : ''}`;
    tbody.innerHTML = '';

    if (!all.length) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    all.forEach(c => {
      const initial = (c.name || '?').charAt(0).toUpperCase();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-avatar"><div class="client-row-avatar">${utils.escape(initial)}</div></td>
        <td>
          <div class="client-row-name">${utils.escape(c.name)}</div>
          ${c.email ? `<div class="client-row-email">${utils.escape(c.email)}</div>` : ''}
        </td>
        <td><span class="client-row-phone">${utils.escape(c.phone || '�?"')}</span></td>
        <td class="td-extra">
          <span class="client-row-extra">${utils.escape(c.address || c.notes || '')}</span>
        </td>
        <td class="td-actions">
          <div class="client-row-actions">
            <button class="client-action-btn edit" data-id="${utils.escape(c.id)}" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="client-action-btn del" data-id="${utils.escape(c.id)}" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      `;
      // Editar
      tr.querySelector('.client-action-btn.edit').addEventListener('click', () => this.openForm(c));
      // Borrar
      tr.querySelector('.client-action-btn.del').addEventListener('click', () => this.confirmDelete(c));
      tbody.appendChild(tr);
    });
  },

  /** Abre el formulario para crear o editar */
  openForm(client = null) {
    const panel = document.getElementById('client-form-panel');
    const titleEl = document.getElementById('client-form-title-text');
    document.getElementById('client-form-id').value = client?.id || '';
    document.getElementById('client-f-name').value = client?.name || '';
    document.getElementById('client-f-phone').value = client?.phone || '';
    document.getElementById('client-f-cedula').value = client?.clientCedula || '';
    document.getElementById('client-f-ruc').value = client?.clientRuc || '';
    document.getElementById('client-f-pin').value = client?.clientPin || '';
    document.getElementById('client-f-email').value = client?.email || '';
    document.getElementById('client-f-address').value = client?.address || '';
    document.getElementById('client-f-notes').value = client?.notes || '';
    titleEl.textContent = client ? 'Editar Cliente' : 'Nuevo Cliente';
    panel.hidden = false;
    document.getElementById('client-f-name').focus();
  },

  closeForm() {
    document.getElementById('client-form-panel').hidden = true;
  },

  async saveForm() {
    let name = document.getElementById('client-f-name').value.trim();
    let phone = document.getElementById('client-f-phone').value.trim();
    if (!name) { toast.show('Campo requerido', 'Ingresa el nombre del cliente.', 'warning'); return; }
    if (!phone) { toast.show('Campo requerido', 'Ingresa el teléfono del cliente.', 'warning'); return; }
    const id = document.getElementById('client-form-id').value || null;
    let email = document.getElementById('client-f-email').value.trim();
    let address = document.getElementById('client-f-address').value.trim();
    let notes = document.getElementById('client-f-notes').value.trim();
    let clientCedula = document.getElementById('client-f-cedula').value.trim();
    let clientRuc = document.getElementById('client-f-ruc').value.trim();
    let clientPin = document.getElementById('client-f-pin').value.trim();

    // Normalizar a mayúsculas (excepto email que va en minúsculas por convención)
    name = name.toUpperCase();
    address = address.toUpperCase();
    notes = notes.toUpperCase();
    clientCedula = clientCedula.toUpperCase();
    clientRuc = clientRuc.toUpperCase();
    if (email) email = email.toLowerCase();

    if (!clientPin) clientPin = clientsModule.generateUniquePin(clientRuc || clientCedula);

    // Verificación de duplicados
    const existing = [...clientsModule.clients.values()].find(c => {
      if (id && c.id === id) return false; // Ignorar si es el mismo que se está editando
      if (c.name && c.name.toUpperCase() === name) return true;
      if (c.phone && c.phone === phone) return true;
      if (email && c.email && c.email.toLowerCase() === email) return true;
      if (clientCedula && c.clientCedula && c.clientCedula.toUpperCase() === clientCedula) return true;
      if (clientRuc && c.clientRuc && c.clientRuc.toUpperCase() === clientRuc) return true;
      return false;
    });

    if (existing) {
      toast.show('Datos Duplicados', 'Ya existe un cliente con este Nombre, Teléfono, Correo, Cédula o RUC.', 'error');
      return;
    }

    try {
      await clientsModule.save({ id, name, phone, email, address, notes, clientCedula, clientRuc, clientPin });
      toast.show('Cliente guardado', name, 'success');
      this.closeForm();
      this.render(document.getElementById('clients-search')?.value || '');
    } catch (e) {
      toast.show('Error al guardar', e.message, 'error');
    }
  },

  async confirmDelete(client) {
    if (!confirm(`¿Eliminar al cliente "${client.name}"?\n\nEsta acción no se puede deshacer.`)) return;
    try {
      await clientsModule.delete(client.id);
      toast.show('Cliente eliminado', client.name, 'info');
      this.render(document.getElementById('clients-search')?.value || '');
    } catch (e) {
      toast.show('Error al eliminar', e.message, 'error');
    }
  },

  /** �?" Autocomplete en el formulario de orden �?" */
  _acTimer: null,
  _acFocused: -1,

  initAutocomplete() {
    const input = document.getElementById('field-client-name');
    const dropdown = document.getElementById('client-autocomplete');
    if (!input || !dropdown) return;

    const hide = () => { dropdown.hidden = true; this._acFocused = -1; };
    const show = () => { dropdown.hidden = false; };

    input.addEventListener('input', () => {
      clearTimeout(this._acTimer);
      this._acTimer = setTimeout(() => this._renderAC(input.value), 180);
    });

    input.addEventListener('keydown', e => {
      const items = dropdown.querySelectorAll('.client-ac-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._acFocused = Math.min(this._acFocused + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle('focused', i === this._acFocused));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._acFocused = Math.max(this._acFocused - 1, 0);
        items.forEach((el, i) => el.classList.toggle('focused', i === this._acFocused));
      } else if (e.key === 'Enter' && this._acFocused >= 0) {
        e.preventDefault();
        items[this._acFocused]?.click();
      } else if (e.key === 'Escape') {
        hide();
      }
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', e => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) hide();
    });
  },

  _renderAC(query) {
    const dropdown = document.getElementById('client-autocomplete');
    const input = document.getElementById('field-client-name');
    if (!dropdown || !input) return;
    this._acFocused = -1;

    if (!query) { dropdown.hidden = true; return; }

    const results = clientsModule.search(query);
    const hl = (str) => {
      if (!str) return '';
      const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return utils.escape(str).replace(new RegExp(`(${q})`, 'gi'), '<mark>$1</mark>');
    };

    let html = `<div class="client-ac-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      Clientes encontrados
    </div>`;

    if (results.length) {
      results.forEach(c => {
        const initial = (c.name || '?').charAt(0).toUpperCase();
        html += `<div class="client-ac-item" data-id="${utils.escape(c.id)}">
          <div class="client-ac-avatar">${utils.escape(initial)}</div>
          <div class="client-ac-info">
            <div class="client-ac-name">${hl(c.name)}</div>
            <div class="client-ac-sub">${utils.escape(c.phone || '')}${c.email ? ' · ' + utils.escape(c.email) : ''}</div>
          </div>
          ${c.address ? `<span class="client-ac-badge" title="${utils.escape(c.address)}">Dir.</span>` : ''}
        </div>`;
      });
    } else {
      html += `<div class="client-ac-item" style="color:var(--t-muted);font-size:.8rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        No hay coincidencias para "${utils.escape(query)}"
      </div>`;
    }

    // Fila para guardar cliente nuevo
    html += `<div class="client-ac-save-row" id="ac-save-new">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      Guardar "${utils.escape(query)}" como nuevo cliente
    </div>`;

    dropdown.innerHTML = html;
    dropdown.hidden = false;

    // Click en resultado
    dropdown.querySelectorAll('.client-ac-item[data-id]').forEach(el => {
      el.addEventListener('click', () => {
        const client = clientsModule.clients.get(el.dataset.id);
        if (!client) return;
        document.getElementById('field-client-name').value = client.name;
        document.getElementById('field-client-phone').value = client.phone || '';
        document.getElementById('field-client-cedula').value = client.clientCedula || '';
        document.getElementById('field-client-ruc').value = client.clientRuc || '';
        document.getElementById('field-client-pin').value = client.clientPin || '';
        dropdown.hidden = true;
        formModule.updateBalance?.();
      });
    });

    // Click en "guardar como nuevo"
    dropdown.querySelector('#ac-save-new')?.addEventListener('click', () => {
      dropdown.hidden = true;
      // Precarga el nombre en el formulario de clientes y lo abre
      clientsUIModule.open();
      clientsUIModule.openForm({ name: query, phone: document.getElementById('field-client-phone').value || '' });
    });
  },

  /** Inicializa todos los event listeners del módulo */
  initEvents() {
    // Cerrar modal
    document.getElementById('modal-clients-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-clients')?.addEventListener('click', e => {
      if (e.target === document.getElementById('modal-clients')) this.close();
    });

    // Nuevo cliente
    document.getElementById('btn-new-client')?.addEventListener('click', () => this.openForm());

    // Búsqueda interna
    document.getElementById('clients-search')?.addEventListener('input', e => {
      this.render(e.target.value);
    });

    // Guardar formulario
    document.getElementById('btn-client-form-save')?.addEventListener('click', () => this.saveForm());
    document.getElementById('btn-client-form-cancel')?.addEventListener('click', () => this.closeForm());

    // Generar PIN desde formulario de clientes
    document.getElementById('btn-client-f-generate-pin')?.addEventListener('click', () => {
      const cedulaInput = document.getElementById('client-f-cedula');
      const rucInput = document.getElementById('client-f-ruc');
      const pinInput = document.getElementById('client-f-pin');
      const targetVal = (rucInput.value.trim() || cedulaInput.value.trim());
      pinInput.value = clientsModule.generateUniquePin(targetVal);
      toast.show('PIN Generado', `El código de cuenta es: ${pinInput.value}`, 'success');
    });

    // Autocomplete en formulario de orden
    this.initAutocomplete();
  },
};

// Inicializar eventos de clientes cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => clientsUIModule.initEvents());

/* �.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.�
   M�"DULO: B�sSQUEDA POR VOZ (Web Speech API)
�.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.��.� */
const voiceSearchModule = {
  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API no soportada en este navegador.');
      return;
    }

    this.setupButton('btn-voice-main', 'search-input', SpeechRecognition);
    this.setupButton('btn-voice-clients', 'clients-search', SpeechRecognition);
  },

  setupButton(btnId, inputId, SpeechRecognition) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-MX';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isListening = false;

    recognition.onstart = () => {
      isListening = true;
      btn.classList.add('listening');
      input.placeholder = "Escuchando...";
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      input.value = speechResult;
      // Disparar evento input para activar la búsqueda
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    recognition.onspeechend = () => {
      recognition.stop();
    };

    recognition.onend = () => {
      isListening = false;
      btn.classList.remove('listening');
      if (inputId === 'search-input') {
        input.placeholder = "Buscar por cliente, orden, VIN�?�";
      } else {
        input.placeholder = "Buscar por nombre, teléfono, email�?�";
      }
    };

    recognition.onerror = (event) => {
      isListening = false;
      btn.classList.remove('listening');
      console.error('Error en reconocimiento de voz: ' + event.error);
      if (event.error === 'not-allowed') {
        toast.show('Permiso denegado', 'Debes permitir el acceso al micrófono en el navegador.', 'warning');
      }
    };

    btn.addEventListener('click', () => {
      if (isListening) {
        recognition.stop();
      } else {
        try {
          recognition.start();
        } catch (e) {
          console.error(e);
        }
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => voiceSearchModule.init());
