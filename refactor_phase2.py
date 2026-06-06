import os

app_path = r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\app_updated.js'
app_bak_path = r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\app.js'
agenda_path = r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\agenda.js'
api_path = r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\js\services\whatsappApi.js'

with open(api_path, 'r', encoding='utf-8') as f: content = f.read()
content = content.replace("headers: { 'Content-Type': 'application/json' }", "headers: { 'Content-Type': 'application/json', 'x-api-key': 'wft-bot-2026' }")
with open(api_path, 'w', encoding='utf-8') as f: f.write(content)

app_orig = """    const phone = this.buildPhone(order.clientPhone || '');
    const host = window.location.hostname || 'localhost';

    // Intentar enviar mediante el bot local
    try {
      toast.show('Enviando WhatsApp...', 'Conectando con el bot local', 'info', 5000);
      const response = await fetch(`http://${host}:3000/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: msg, line: order.waLine || 1 })
      });

      const data = await response.json();
      if (data.success) {
        toast.show('WhatsApp Automático', `Mensaje enviado a ${order.clientName}`, 'success');
      } else {
        throw new Error(data.error || 'Error del servidor local');
      }
    } catch (error) {
      console.warn('Bot local no disponible o error:', error);
      toast.show('Bot no disponible', 'Abriendo modo manual...', 'warning', 3000);
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }"""

app_new = """    const phone = this.buildPhone(order.clientPhone || '');

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
    }"""

sync_orig = """  syncOrdersToBot(orders) {
    const host = window.location.hostname || 'localhost';
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

    fetch(`http://${host}:3000/sync-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: payload })
    }).catch(err => console.debug('Sync-orders al bot local falló (quizá está apagado)', err));
  }"""

sync_new = """  syncOrdersToBot(orders) {
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
  }"""

for p in [app_path, app_bak_path]:
    with open(p, 'r', encoding='utf-8') as f: content = f.read()
    content = content.replace(app_orig, app_new)
    content = content.replace(sync_orig, sync_new)
    with open(p, 'w', encoding='utf-8') as f: f.write(content)

agenda_fetch1 = """        fetch('http://localhost:3000/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'wft-bot-2026' },
          body: JSON.stringify(payload)
        })
          .then(r => {
            if (!r.ok) throw new Error('Error de red');
            if (window.toast) toast.show('Enviado por bot', `Mensaje enviado a ${rawPhone}.`, 'success');
            else console.log(`Mensaje enviado a ${rawPhone}.`);
          })
          .catch(err => {
            console.warn('Bot local no disponible o error:', err);
            if (window.toast) toast.show('Bot no disponible', `Abriendo WhatsApp manual para ${rawPhone}...`, 'warning', 3000);
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          });"""

agenda_fetch1_new = """        whatsappApi.sendMessage(phone, msg)
          .then(() => {
            if (window.toast) toast.show('Enviado por bot', `Mensaje enviado a ${rawPhone}.`, 'success');
            else console.log(`Mensaje enviado a ${rawPhone}.`);
          })
          .catch(err => {
            console.warn('Bot local no disponible o error:', err);
            if (window.toast) toast.show('Bot no disponible', `Abriendo WhatsApp manual para ${rawPhone}...`, 'warning', 3000);
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          });"""

agenda_fetch2 = """      fetch('http://localhost:3000/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'wft-bot-2026' },
        body: JSON.stringify(payload)
      })
        .then(r => {
          if (!r.ok) throw new Error('Error de red');
          if (window.toast) toast.show('Enviado por bot', 'Mensaje enviado silenciosamente.', 'success');
          else alert('Mensaje enviado silenciosamente.');
        })
        .catch(err => {
          console.warn('Bot local no disponible o error:', err);
          if (window.toast) toast.show('Bot no disponible', 'Abriendo modo manual...', 'warning', 3000);
          const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        });"""

agenda_fetch2_new = """      whatsappApi.sendMessage(phone, msg)
        .then(() => {
          if (window.toast) toast.show('Enviado por bot', 'Mensaje enviado silenciosamente.', 'success');
          else alert('Mensaje enviado silenciosamente.');
        })
        .catch(err => {
          console.warn('Bot local no disponible o error:', err);
          if (window.toast) toast.show('Bot no disponible', 'Abriendo modo manual...', 'warning', 3000);
          const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        });"""

with open(agenda_path, 'r', encoding='utf-8') as f: content = f.read()
content = content.replace(agenda_fetch1, agenda_fetch1_new)
content = content.replace(agenda_fetch2, agenda_fetch2_new)
with open(agenda_path, 'w', encoding='utf-8') as f: f.write(content)

html_old = '  <script src="js/core/firebase.js"></script>'
html_new = '  <script src="js/core/firebase.js"></script>\n  <!-- Servicios -->\n  <script src="js/services/whatsappApi.js"></script>'

for p in [r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\index_updated.html', r'g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\index.html']:
    with open(p, 'r', encoding='utf-8') as f: content = f.read()
    if 'whatsappApi.js' not in content:
        content = content.replace(html_old, html_new)
        with open(p, 'w', encoding='utf-8') as f: f.write(content)

print('Refactor successful')
