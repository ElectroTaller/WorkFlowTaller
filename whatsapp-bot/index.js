const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Inicializar el cliente de WhatsApp con LocalAuth para guardar la sesión
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "wft-client"
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let isReady = false;

client.on('qr', (qr) => {
    // Genera el código QR en la terminal para ser escaneado
    console.log('----------------------------------------------------');
    console.log('📱 ESCANEA EL SIGUIENTE CÓDIGO QR CON TU WHATSAPP 📱');
    console.log('----------------------------------------------------');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ ¡Cliente de WhatsApp conectado y listo!');
    isReady = true;
});

client.on('authenticated', () => {
    console.log('✅ Autenticación exitosa.');
});

client.on('auth_failure', msg => {
    console.error('❌ Fallo en la autenticación. Hubo un problema con la sesión:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Cliente de WhatsApp desconectado:', reason);
    isReady = false;
});

// Control de spam: guardar última respuesta por número (chatId)
const lastAutoReplies = {}; 
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 horas de espera

client.on('message', async (msg) => {
    // No responder a grupos, a mensajes propios o a mensajes de chat personal consigo mismo (auto-mensajes)
    if (msg.from.endsWith('@g.us') || msg.fromMe || (msg.id && msg.id.fromMe) || msg.from === msg.to) return;

    const text = (msg.body || '').toLowerCase();
    
    // Si es una plantilla del sistema (contiene ElectroTaller o el emoji de la tienda), no responder
    if (text.includes('electrotaller') || text.includes('🏪')) return;
    const hasYuli = text.includes('yuli') || text.includes('yulibeth');
    const hasErick = text.includes('erick');

    if (hasYuli || hasErick) {
        const now = Date.now();
        const lastSent = lastAutoReplies[msg.from] || 0;

        if (now - lastSent > COOLDOWN_MS) {
            let replyText = "";
            if (hasYuli && hasErick) {
                replyText = "Hola, soy el asistente de Yuli y Erick. ¿En qué te puedo asistir en estos momentos?";
            } else if (hasYuli) {
                replyText = "Hola, soy el asistente de Yuli. ¿En qué te puedo asistir en estos momentos?";
            } else {
                replyText = "Hola, soy el asistente de Erick. ¿En qué te puedo asistir en estos momentos?";
            }

            try {
                await msg.reply(replyText);
                lastAutoReplies[msg.from] = now;
                console.log(`🤖 Respuesta automática enviada a ${msg.from} reconociendo mención.`);
            } catch (err) {
                console.error("Error al enviar respuesta automática:", err);
            }
        }
    }
});

client.initialize();

// Endpoint de la API para recibir los mensajes desde app.js
app.post('/send', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ success: false, error: 'El cliente de WhatsApp aún no está listo. Escanea el código QR primero.' });
    }

    try {
        const { phone, message } = req.body;
        
        if (!phone || !message) {
            return res.status(400).json({ success: false, error: 'Se requiere el número de teléfono (phone) y el mensaje (message).' });
        }

        // Remover extensiones (cortar en la primera letra o símbolo #)
        const phoneStr = String(phone || '');
        const phonePart = phoneStr.split(/[a-zA-Z#]/)[0];

        // Formatear el número (remover espacios, símbolos, etc.)
        let formattedPhone = phonePart.replace(/\D/g, ''); 
        
        // Si es un número local de Panamá (7 u 8 dígitos), agregar el código de país 507
        if (formattedPhone.length === 8 || formattedPhone.length === 7) {
            formattedPhone = '507' + formattedPhone;
        }
        
        // Agregar sufijo de cuenta normal (para WhatsApp Business también suele funcionar)
        if (!formattedPhone.endsWith('@c.us')) {
            formattedPhone = `${formattedPhone}@c.us`;
        }

        // Enviar el mensaje directamente (si el número no es válido, el catch capturará el error)
        const response = await client.sendMessage(formattedPhone, message);
        console.log(`📩 Mensaje enviado correctamente a ${phone}`);
        return res.json({ success: true, response });

    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        return res.status(500).json({ success: false, error: error.toString() });
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor local del Bot escuchando en http://localhost:${port}`);
    console.log(`⏳ Esperando a que inicie el navegador de WhatsApp...`);
});
