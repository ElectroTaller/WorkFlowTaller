const utils = {
  /** Genera un ID de orden legible y único */
  generateOrderId() {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORD-${date}-${rand}`;
  },

  /** Formatea un timestamp de Firestore o Date a string legible */
  formatDate(value, includeTime = false) {
    if (!value) return '—';
    let date;
    if (value?.toDate) date = value.toDate();
    else if (value instanceof Date) date = value;
    else date = new Date(value);
    if (isNaN(date)) return '—';
    const opts = { day: '2-digit', month: '2-digit', year: 'numeric' };
    if (includeTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
    return date.toLocaleDateString('es-MX', opts);
  },

  /** Calcula cuántos días LABORALES han pasado (L-V de 8-12 y 13-18) */
  daysSince(value) {
    if (!value) return 0;
    let start = value?.toDate ? value.toDate() : new Date(value);
    let end = new Date();
    if (isNaN(start) || start >= end) return 0;

    let totalWorkingMs = 0;
    let current = new Date(start);

    while (current <= end) {
      let day = current.getDay();
      // Solo de Lunes (1) a Viernes (5)
      if (day >= 1 && day <= 5) {
        let y = current.getFullYear();
        let m = current.getMonth();
        let d = current.getDate();

        // Horarios del turno
        let mStart = new Date(y, m, d, 8, 0, 0).getTime();
        let mEnd = new Date(y, m, d, 12, 0, 0).getTime();
        let aStart = new Date(y, m, d, 13, 0, 0).getTime();
        let aEnd = new Date(y, m, d, 18, 0, 0).getTime();

        let dayStart = (current.toDateString() === start.toDateString()) ? start.getTime() : new Date(y, m, d, 0, 0, 0).getTime();
        let dayEnd = (current.toDateString() === end.toDateString()) ? end.getTime() : new Date(y, m, d, 23, 59, 59, 999).getTime();

        // Turno mañana
        let mIntersectStart = Math.max(dayStart, mStart);
        let mIntersectEnd = Math.min(dayEnd, mEnd);
        if (mIntersectEnd > mIntersectStart) totalWorkingMs += (mIntersectEnd - mIntersectStart);

        // Turno tarde
        let aIntersectStart = Math.max(dayStart, aStart);
        let aIntersectEnd = Math.min(dayEnd, aEnd);
        if (aIntersectEnd > aIntersectStart) totalWorkingMs += (aIntersectEnd - aIntersectStart);
      }

      // Pasar al día siguiente a las 00:00:00
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    // 1 día laboral equivale a 9 horas (4 en la mañana + 5 en la tarde)
    return totalWorkingMs / (9 * 60 * 60 * 1000);
  },

  /** Formatea moneda en pesos mexicanos */
  formatCurrency(amount) {
    if (amount === undefined || amount === null || amount === '') return '$0.00';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(amount) || 0);
  },

  /** Escapa caracteres HTML peligrosos */
  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  },

  /** Obtiene el color/clase del badge según tipo de dispositivo */
  deviceBadgeClass(type) {
    const map = {
      'ECU Automotriz': 'badge-ecu',
      'Tablero Electrónico': 'badge-tablero',
      'Tarjeta A/C': 'badge-ac',
      'Instalación A/C': 'badge-ac',
      'Otro': 'badge-otro',
    };
    return map[type] || 'badge-otro';
  },

  /** Color del acento de la columna Kanban */
  columnAccentColor(status) {
    const map = {
      'Nuevo Ingreso': 'hsl(200,80%,60%)',
      'Diagnóstico': 'hsl(45,100%,55%)',
      'En Reparación': 'hsl(280,80%,65%)',
      'Esperando Piezas': 'hsl(25,100%,55%)',
      'Listo para Entrega': 'hsl(140,70%,50%)',
    };
    return map[status] || 'hsl(220,15%,40%)';
  },
};

window.utils = utils;
