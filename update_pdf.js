const fs = require('fs');
const file = 'g:\\Mi unidad\\Microcontroladores Proyectos\\WorkFlowTaller\\app.js';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('const pdfModule = {'));
const endIdx = lines.findIndex(l => l.includes('const eventController = {'));

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find boundaries");
  process.exit(1);
}

const newPdfModule = `const pdfModule = {
  getConfig() {
    try { return JSON.parse(localStorage.getItem('wft_firebase_config')) || {}; } catch { return {}; }
  },

  _drawReceiptSection(doc, order, startY, copyLabel) {
    const cfg = this.getConfig();
    const shop = cfg.shopName || 'ELECTROTALLER';
    const veh = order.vehicleData;
    const ac = order.acData;
    const bal = (Number(order.budget) || 0) - (Number(order.downPayment) || 0);

    const W = doc.internal.pageSize.getWidth();
    const accentColor = [0, 168, 181]; // Cyan/Teal
    let y = startY;

    // Barra superior decorativa
    doc.setFillColor(...accentColor);
    doc.rect(0, y, W, 4, 'F');

    y += 15;
    
    // Logo
    const logoImg = document.getElementById('shop-logo');
    let logoAdded = false;
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0 && logoImg.style.display !== 'none') {
      try {
        const ratio = logoImg.naturalHeight / logoImg.naturalWidth;
        const imgW = 30; // Un poco mas pequeno para caber bien
        const imgH = imgW * ratio;
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

    // Información a la derecha (Orden de servicio)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text('ORDEN DE SERVICIO', W - 14, y, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(\`N° Orden: \${order.id}\`, W - 14, y + 5, { align: 'right' });
    doc.text(\`Fecha: \${utils.formatDate(order.createdAt)}\`, W - 14, y + 10, { align: 'right' });
    if (copyLabel) {
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      doc.text(copyLabel, W - 14, y + 15, { align: 'right' });
    }

    y += 18;

    // Línea separadora
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, y, W - 14, y);
    y += 4;

    // Funciones auxiliares
    const drawBox = (x, yPos, w, h, title) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, yPos, w, h, 2, 2, 'FD');
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x, yPos, w, 6, 2, 2, 'F');
      doc.rect(x, yPos + 4, w, 2, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(title.toUpperCase(), x + 3, yPos + 4);
      doc.line(x, yPos + 6, x + w, yPos + 6);
    };

    const writeField = (x, yPos, label, val) => {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(label + ':', x, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(String(val || '—'), x + 20, yPos);
    };

    // Fila 1: Cliente y Dispositivo
    drawBox(14, y, 88, 22, 'Cliente');
    writeField(17, y + 11, 'Nombre', order.clientName);
    writeField(17, y + 16, 'Teléfono', order.clientPhone);
    writeField(17, y + 21, 'Entrega', order.dueDate ? utils.formatDate(order.dueDate) : 'No definida');

    drawBox(108, y, 88, 22, 'Dispositivo');
    writeField(111, y + 11, 'Tipo', order.deviceType);
    
    // Status Badge
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const statusColors = {
      'Nuevo Ingreso': [59, 130, 246],
      'Diagnóstico': [234, 179, 8],
      'En Reparación': [168, 85, 247],
      'Esperando Piezas': [249, 115, 22],
      'Listo para Entrega': [34, 197, 94],
    };
    doc.setFillColor(...(statusColors[order.status] || [100, 116, 139]));
    doc.roundedRect(111, y + 14, 30, 5, 1, 1, 'F');
    doc.text(order.status || 'Sin estado', 111 + 15, y + 17.5, { align: 'center' });

    y += 24;

    // Fila 2: Detalles técnicos
    if ((veh && (veh.brand || veh.vin || veh.dtcCode)) || (ac && (ac.brand || ac.model))) {
      let acBoxH = 14;
      if (ac) {
        const compLabelsAll = { tarjetaEvap:'Tarj. Evap.', tarjetaCond:'Tarj. Cond.', sensorEvap:'Sensor Evap.', sensorCond:'Sensor Cond.', ventilador:'Ventilador', display:'Display' };
        const activosAll = ac.components ? Object.entries(ac.components).filter(([,v])=>v).map(([k])=>compLabelsAll[k]||k) : [];
        if (ac.errorCode || activosAll.length > 0) acBoxH = 22;
      }
      drawBox(14, y, 182, acBoxH, veh ? 'Datos del Vehículo' : 'Datos del Equipo A/C');
      if (veh) {
        const vName = [veh.brand, veh.model, veh.year].filter(Boolean).join(' ');
        writeField(17, y + 11, 'Vehículo', vName || '—');
        writeField(80, y + 11, 'VIN', veh.vin || '—');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('DTC:', 140, y + 11);
        doc.setFont('courier', 'bold');
        doc.setTextColor(217, 119, 6);
        doc.text(veh.dtcCode || '—', 140 + 8, y + 11);
      } else if (ac) {
        writeField(17, y + 11, 'Equipo', [ac.brand, ac.model].filter(Boolean).join(' ') || '—');
        writeField(80, y + 11, 'Capacidad', ac.btu || '—');
        writeField(140, y + 11, 'Tecnología', ac.tech || '—');
        if (ac.errorCode) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 116, 139);
          doc.text('Error:', 17, y + 18);
          doc.setFont('courier', 'bold');
          doc.setTextColor(220, 38, 38);
          doc.text(ac.errorCode, 17 + 10, y + 18);
        }
        if (ac.components) {
          const compLabels = { tarjetaEvap:'Tarj. Evap.', tarjetaCond:'Tarj. Cond.', sensorEvap:'Sensor Evap.', sensorCond:'Sensor Cond.', ventilador:'Ventilador', display:'Display' };
          const activos = Object.entries(ac.components).filter(([,v])=>v).map(([k])=>compLabels[k]||k);
          if (activos.length) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('Componentes:', ac.errorCode ? 50 : 17, y + 18);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(15, 23, 42);
            doc.text(activos.join(', '), (ac.errorCode ? 50 : 17) + 20, y + 18);
          }
        }
      }
      y += acBoxH + 2;
    } else if (order.deviceDesc) {
      drawBox(14, y, 182, 14, 'Detalle del Dispositivo');
      writeField(17, y + 11, 'Descripción', order.deviceDesc);
      y += 16;
    }

    // Fila 3: Falla y Notas (mas compacto)
    const faultText = order.reportedFault || 'No registrada';
    const notesText = order.technicalNotes || '';
    
    doc.setFontSize(8);
    const splitFault = doc.splitTextToSize(faultText, 176);
    const faultBoxH = Math.max(12 + (splitFault.length * 3.5), 16);
    
    drawBox(14, y, 182, faultBoxH, 'Falla Reportada');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(splitFault, 17, y + 10);
    y += faultBoxH + 2;

    if (notesText) {
      const splitNotes = doc.splitTextToSize(notesText, 176);
      const notesBoxH = Math.max(12 + (splitNotes.length * 3.5), 16);
      drawBox(14, y, 182, notesBoxH, 'Notas Técnicas / Observaciones');
      doc.text(splitNotes, 17, y + 10);
      y += notesBoxH + 2;
    }

    // Fila 4: Costos
    if (order.budget > 0) {
      y += 2;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, 182, 16, 2, 2, 'FD');
      
      const c1 = 14 + 182/6;
      const c2 = 14 + (182/2);
      const c3 = 14 + 182 * (5/6);

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Costo Total', c1, y + 5, { align: 'center' });
      doc.text('Anticipo', c2, y + 5, { align: 'center' });
      doc.text('Saldo Pendiente', c3, y + 5, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(utils.formatCurrency(order.budget), c1, y + 12, { align: 'center' });
      doc.setTextColor(5, 150, 105);
      doc.text(utils.formatCurrency(order.downPayment), c2, y + 12, { align: 'center' });
      doc.setTextColor(220, 38, 38);
      doc.text(utils.formatCurrency(bal), c3, y + 12, { align: 'center' });
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14 + 182/3, y + 3, 14 + 182/3, y + 13);
      doc.line(14 + (182/3)*2, y + 3, 14 + (182/3)*2, y + 13);
      y += 20;
    }

    // Firmas
    y = startY + 125; // Posición fija inferior de la mitad
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.4);
    doc.line(24, y + 10, 84, y + 10);
    doc.line(126, y + 10, 186, y + 10);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Firma del Cliente', 54, y + 14, { align: 'center' });
    doc.text('Sello y Firma del Taller', 156, y + 14, { align: 'center' });
    
    // Términos
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('Términos y Condiciones: 30 días de garantía sobre la reparación. La garantía no cubre humedad o intervención. Equipo no retirado después de 90 días será desechado.', W/2, y + 21, { align: 'center', maxWidth: 180 });
  },

  generate(order, openWA = false) {
    if (typeof window.jspdf === 'undefined') {
      toast.show('jsPDF no cargado', 'Verifica tu conexión a internet.', 'error');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    
    this._drawReceiptSection(doc, order, 0, null);

    // Footer bottom color bar
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    doc.setFillColor(0, 168, 181);
    doc.rect(0, H - 4, W, 4, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(\`Generado el \${utils.formatDate(new Date(), true)}\`, 14, H - 6);

    const filename = \`\${order.id}_\${(order.clientName || 'cliente').replace(/\\s+/g, '_')}.pdf\`;
    doc.save(filename);
    toast.show('PDF generado', \`\${filename} descargado.\`, 'success');

    if (openWA) {
      setTimeout(() => {
        const msg = waModule.template1_Ingreso(order);
        const phone = waModule.buildPhone(order.clientPhone || '');
        const url = \`https://wa.me/\${phone}?text=\${encodeURIComponent(msg)}\`;
        window.open(url, '_blank', 'noopener,noreferrer');
        toast.show('WhatsApp abierto', 'Adjunta el PDF descargado en la conversación.', 'info', 6000);
      }, 800);
    }
  },

  printDouble(order) {
    if (typeof window.jspdf === 'undefined') {
      toast.show('jsPDF no cargado', 'Verifica tu conexión a internet.', 'error');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    
    // Mitad superior: Taller
    this._drawReceiptSection(doc, order, 0, 'COPIA TALLER');

    // Línea punteada de corte en el medio
    const midY = H / 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(0, midY, W, midY);
    doc.setLineDashPattern([], 0); // reset

    // Icono tijeras (texto simple)
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('✂', 5, midY + 1.5);

    // Mitad inferior: Cliente
    this._drawReceiptSection(doc, order, midY, 'COPIA CLIENTE');

    // AutoPrint
    doc.autoPrint();

    // Abrir en nueva pestaña que ejecutará el Print Dialog
    const blobURL = doc.output('bloburl');
    window.open(blobURL, '_blank');
    toast.show('Imprimiendo', 'Se ha abierto el diálogo de impresión con 2 copias.', 'info');
  }
};
`;

const newLines = lines.slice(0, startIdx).concat([newPdfModule]).concat(lines.slice(endIdx - 1));
fs.writeFileSync(file, newLines.join('\n'), 'utf8');
console.log("PDF module successfully updated");
