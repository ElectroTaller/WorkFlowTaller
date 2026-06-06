/* MÓDULO: PDF (jsPDF) */
const pdfModule = {
  getConfig() {
    try { return JSON.parse(localStorage.getItem('wft_firebase_config')) || {}; } catch { return {}; }
  },

  /** Convierte caracteres especiales a ASCII para jsPDF (fuente helvetica) */
  fixText(str) {
    if (str === null || str === undefined) return '-';
    var map = {
      '\u00e1': 'a', '\u00e9': 'e', '\u00ed': 'i', '\u00f3': 'o', '\u00fa': 'u',
      '\u00c1': 'A', '\u00c9': 'E', '\u00cd': 'I', '\u00d3': 'O', '\u00da': 'U',
      '\u00f1': 'n', '\u00d1': 'N', '\u00fc': 'u', '\u00dc': 'U',
      '\u2014': '-', '\u2013': '-', '\u2026': '...', '\u00b0': 'o'
    };
    return String(str).replace(/[^\x00-\x7F]/g, function (c) {
      return map[c] !== undefined ? map[c] : '?';
    });
  },

  _drawReceiptSection(doc, order, startY, copyLabel) {
    var t = function (s) { return pdfModule.fixText(s); };
    var cfg = pdfModule.getConfig();
    var shop = t(cfg.shopName || 'ELECTROTALLER');
    var veh = order.vehicleData;
    var ac = order.acData;
    var bal = (Number(order.budget) || 0) - (Number(order.downPayment) || 0);
    var W = doc.internal.pageSize.getWidth();
    var y = startY;

    // Barra superior decorativa
    doc.setFillColor(0, 168, 181);
    doc.rect(0, y, W, 4, 'F');
    y += 15;

    // Logo
    var logoImg = document.getElementById('shop-logo');
    var logoAdded = false;
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0 && logoImg.style.display !== 'none') {
      try {
        var ratio = logoImg.naturalHeight / logoImg.naturalWidth;
        var imgW = 30; var imgH = imgW * ratio;
        doc.addImage(logoImg, 'PNG', 14, y - 5, imgW, imgH);
        logoAdded = true;
      } catch (e) { console.warn(e); }
    }
    if (!logoAdded) {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(shop.toUpperCase(), 14, y + 2);
    }

    // Encabezado derecho
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 168, 181);
    doc.text('ORDEN DE SERVICIO', W - 14, y, { align: 'right' });
    doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text('N. Orden: ' + t(order.id), W - 14, y + 5, { align: 'right' });
    doc.text('Fecha: ' + utils.formatDate(order.createdAt), W - 14, y + 10, { align: 'right' });
    if (copyLabel) {
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(220, 38, 38);
      doc.text(t(copyLabel), W - 14, y + 14, { align: 'right' });
    }
    y += 16;

    // Linea separadora
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.5);
    doc.line(14, y, W - 14, y); y += 4;

    // Funciones auxiliares
    var drawBox = function (x, yPos, w, h, title) {
      doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, yPos, w, h, 2, 2, 'FD');
      doc.setFillColor(241, 245, 249); doc.roundedRect(x, yPos, w, 6, 2, 2, 'F');
      doc.rect(x, yPos + 4, w, 2, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(71, 85, 105);
      doc.text(t(title).toUpperCase(), x + 3, yPos + 4);
      doc.line(x, yPos + 6, x + w, yPos + 6);
    };

    var writeField = function (x, yPos, label, val) {
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
      doc.text(t(label) + ':', x, yPos);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
      doc.text(t(val) || '-', x + 20, yPos);
    };

    // Fila 1: Cliente y Dispositivo
    var clientBoxH = 22;
    if (order.clientCedula || order.clientRuc) clientBoxH = 28;
    drawBox(14, y, 88, clientBoxH, 'Cliente');
    writeField(17, y + 11, 'Nombre', order.clientName);
    writeField(17, y + 16, 'Telefono', order.clientPhone);
    var nextY = y + 21;
    if (order.clientCedula) {
      writeField(17, nextY, 'Cedula', order.clientCedula);
      nextY += 5;
    } else if (order.clientRuc) {
      writeField(17, nextY, 'RUC', order.clientRuc);
      nextY += 5;
    }
    // Only draw Entrega if there's no Cedula/RUC or we can fit it. Actually, just fit it next to Telefon if needed, or add +5 height.
    // Let's just draw it at the end
    writeField(17, nextY, 'Entrega', order.dueDate ? utils.formatDate(order.dueDate) : 'No definida');
    if (order.clientCedula || order.clientRuc) {
      // Adjust clientBoxH to accommodate
      clientBoxH = nextY - y + 5;
      // Redraw box to be bigger? No, drawBox already drew it.
    }

    drawBox(108, y, 88, 28, 'Dispositivo'); // Make Dispositivo same max height
    writeField(111, y + 11, 'Tipo', order.deviceType);

    // Status Badge
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    var statusColors = {
      'Nuevo Ingreso': [59, 130, 246],
      'Diagnostico': [234, 179, 8],
      'En Reparacion': [168, 85, 247],
      'Esperando Piezas': [249, 115, 22],
      'Listo para Entrega': [34, 197, 94]
    };
    var sColor = statusColors[t(order.status || '')] || statusColors[order.status] || [100, 116, 139];
    doc.setFillColor(sColor[0], sColor[1], sColor[2]);
    doc.roundedRect(111, y + 14, 30, 5, 1, 1, 'F');
    doc.text(t(order.status || 'Sin estado'), 126, y + 17.5, { align: 'center' });
    y += 24;

    // Fila 2: Detalles tecnicos
    if ((veh && (veh.brand || veh.vin || veh.dtcCode)) || (ac && (ac.brand || ac.model))) {
      var acBoxH = 14;
      if (ac && ac.components) {
        var compLabelsAll = { tarjetaEvap: 'Tarj.Evap.', tarjetaCond: 'Tarj.Cond.', sensorEvap: 'Sensor Evap.', sensorCond: 'Sensor Cond.', ventilador: 'Ventilador', display: 'Display' };
        var activosAll = Object.entries(ac.components).filter(function (kv) { return kv[1]; }).map(function (kv) { return compLabelsAll[kv[0]] || kv[0]; });
        if (ac.errorCode || activosAll.length > 0) acBoxH = 22;
      }
      drawBox(14, y, 182, acBoxH, veh ? 'Datos del Vehiculo' : 'Datos del Equipo A/C');
      if (veh) {
        var vName = [veh.brand, veh.model, veh.year].filter(Boolean).join(' ');
        writeField(17, y + 11, 'Vehiculo', vName || '-');
        writeField(80, y + 11, 'VIN', veh.vin || '-');
        doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text('DTC:', 140, y + 11);
        doc.setFont('courier', 'bold'); doc.setTextColor(217, 119, 6);
        doc.text(t(veh.dtcCode) || '-', 148, y + 11);
      } else if (ac) {
        writeField(17, y + 11, 'Equipo', [ac.brand, ac.model].filter(Boolean).join(' ') || '-');
        writeField(80, y + 11, 'Capacidad', ac.btu || '-');
        writeField(140, y + 11, 'Tecnologia', ac.tech || '-');
        if (ac.errorCode) {
          doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139); doc.text('Error:', 17, y + 18);
          doc.setFont('courier', 'bold'); doc.setTextColor(220, 38, 38); doc.text(t(ac.errorCode), 27, y + 18);
        }
        if (ac.components) {
          var compLabels2 = { tarjetaEvap: 'Tarj.Evap.', tarjetaCond: 'Tarj.Cond.', sensorEvap: 'Sensor Evap.', sensorCond: 'Sensor Cond.', ventilador: 'Ventilador', display: 'Display' };
          var activos = Object.entries(ac.components).filter(function (kv) { return kv[1]; }).map(function (kv) { return compLabels2[kv[0]] || kv[0]; });
          if (activos.length) {
            doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
            doc.text('Componentes:', ac.errorCode ? 50 : 17, y + 18);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
            doc.text(activos.join(', '), ac.errorCode ? 70 : 37, y + 18);
          }
        }
      }
      y += acBoxH + 2;
    } else if (order.deviceDesc) {
      drawBox(14, y, 182, 14, 'Descripcion del Dispositivo');
      writeField(17, y + 11, 'Descripcion', order.deviceDesc);
      y += 16;
    }

    // Fila 3: Falla y Notas
    var faultText = t(order.reportedFault || 'No registrada');
    var notesText = t(order.technicalNotes || '');
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    var splitFault = doc.splitTextToSize(faultText, 176);
    var faultBoxH = Math.max(12 + (splitFault.length * 3.5), 16);
    drawBox(14, y, 182, faultBoxH, 'Falla Reportada');
    doc.setTextColor(15, 23, 42); doc.text(splitFault, 17, y + 10);
    y += faultBoxH + 2;

    if (notesText) {
      var splitNotes = doc.splitTextToSize(notesText, 176);
      var notesBoxH = Math.max(12 + (splitNotes.length * 3.5), 16);
      drawBox(14, y, 182, notesBoxH, 'Notas Tecnicas / Observaciones');
      doc.text(splitNotes, 17, y + 10);
      y += notesBoxH + 2;
    }

    // Fila 4: Costos
    if (order.budget > 0) {
      y += 2;
      doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, 182, 16, 2, 2, 'FD');
      var c1 = 14 + 182 / 6; var c2 = 14 + (182 / 2); var c3 = 14 + 182 * (5 / 6);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
      doc.text('Costo Total', c1, y + 5, { align: 'center' });
      doc.text('Anticipo', c2, y + 5, { align: 'center' });
      doc.text('Saldo Pendiente', c3, y + 5, { align: 'center' });
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); doc.text(utils.formatCurrency(order.budget), c1, y + 12, { align: 'center' });
      doc.setTextColor(5, 150, 105); doc.text(utils.formatCurrency(order.downPayment), c2, y + 12, { align: 'center' });
      doc.setTextColor(220, 38, 38); doc.text(utils.formatCurrency(bal), c3, y + 12, { align: 'center' });
      doc.setDrawColor(226, 232, 240);
      doc.line(14 + 182 / 3, y + 3, 14 + 182 / 3, y + 13);
      doc.line(14 + (182 / 3) * 2, y + 3, 14 + (182 / 3) * 2, y + 13);
      y += 20;
    }

    // Firmas
    y = startY + 125;
    doc.setDrawColor(148, 163, 184); doc.setLineWidth(0.4);
    doc.line(24, y + 8, 84, y + 8);
    doc.line(126, y + 8, 186, y + 8);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text('Firma del Cliente', 54, y + 12, { align: 'center' });
    doc.text('Sello y Firma del Taller', 156, y + 12, { align: 'center' });
    doc.setFontSize(6); doc.setTextColor(148, 163, 184);
    var warrantyDays = (order.deviceType === 'Tarjeta A/C') ? '30 dias' : '3 meses';
    doc.text('Terminos y Condiciones: ' + warrantyDays + ' de garantia sobre la reparacion. La garantia no cubre humedad o intervencion ajena. Equipo no retirado despues de 90 dias sera desechado.', W / 2, y + 18, { align: 'center', maxWidth: 180 });
  },

  generate(order, openWA = false) {
    if (typeof window.jspdf === 'undefined') {
      toast.show('jsPDF no cargado', 'Verifica tu conexion a internet.', 'error'); return;
    }
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'letter' });
    this._drawReceiptSection(doc, order, 0, null);
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();
    doc.setFillColor(0, 168, 181); doc.rect(0, H - 4, W, 4, 'F');
    doc.setFontSize(7); doc.setTextColor(100, 116, 139);
    doc.text('Generado el ' + utils.formatDate(new Date(), true), 14, H - 6);
    var filename = order.id + '_' + (order.clientName || 'cliente').replace(/\s+/g, '_') + '.pdf';
    doc.save(filename);
    toast.show('PDF generado', filename + ' descargado.', 'success');
    if (openWA) {
      setTimeout(function () {
        var msg = waModule.template1_Ingreso(order);
        var phone = waModule.buildPhone(order.clientPhone || '');
        var url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
        window.open(url, '_blank', 'noopener,noreferrer');
        toast.show('WhatsApp abierto', 'Adjunta el PDF descargado en la conversacion.', 'info', 6000);
      }, 800);
    }
  },

  printDouble(order) {
    if (typeof window.jspdf === 'undefined') {
      toast.show('jsPDF no cargado', 'Verifica tu conexion a internet.', 'error'); return;
    }
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'letter' });
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();
    this._drawReceiptSection(doc, order, 0, 'COPIA TALLER');
    var midY = H / 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(0, midY, W, midY);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 180, 180);
    doc.text('- CORTAR AQUI -', W / 2, midY - 1, { align: 'center' });
    this._drawReceiptSection(doc, order, midY, 'COPIA CLIENTE');
    doc.autoPrint();
    var blobURL = doc.output('bloburl');
    window.open(blobURL, '_blank');
    toast.show('Imprimiendo', 'Se abrio el dialogo de impresion con 2 copias.', 'info');
  }
};

window.pdfModule = pdfModule;
