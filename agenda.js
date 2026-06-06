/* agenda.js - Reconstrucción del Módulo de Agenda */
const agendaModule = {
  ...window.agendaCalendarMixin,
  ...window.agendaModalsMixin,
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


  /* ================== TECHNICIANS (CRUD) ================== */


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



  /* ================== FORM & MODALS ================== */





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
