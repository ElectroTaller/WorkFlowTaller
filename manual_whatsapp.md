# Manual de Instalación y Uso: Bot de WhatsApp Automático

Este manual te guiará para encender el "motor" que enviará los mensajes de WhatsApp automáticamente en segundo plano.

## Paso 1: Instalar Node.js (Si no lo tienes)
1. Ve a [nodejs.org](https://nodejs.org/).
2. Descarga e instala la versión **LTS** (Recomendada para la mayoría de usuarios).
3. Instálalo como cualquier otro programa de Windows (siguiente, siguiente, finalizar).

## Paso 2: Instalar las dependencias del Bot
Solo necesitas hacer esto **una vez**.

1. Abre la carpeta de tu proyecto: `G:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller\whatsapp-bot`
2. En esa carpeta, haz **clic derecho** en un espacio vacío y selecciona **Abrir en Terminal** (o abre PowerShell y navega hasta esa ruta usando el comando `cd`).
3. Escribe ÚNICAMENTE el siguiente comando y presiona Enter:
   npm install

   *Espera un par de minutos a que descargue las librerías necesarias.*

## Paso 3: Encender el Bot y Escanear el QR
Este es el proceso para encender el servidor que enviará los mensajes.

1. En la misma ventana de terminal, escribe ÚNICAMENTE:
   npm start

2. La terminal te mostrará un mensaje indicando que está esperando al navegador.
3. Después de unos segundos, aparecerá un **Código QR gigante** hecho de texto en tu pantalla negra de la terminal.
4. Abre WhatsApp en tu celular principal (el del taller).
5. Ve a **Dispositivos Vinculados** -> **Vincular un dispositivo**.
6. Escanea el código QR de la pantalla.
7. La terminal dirá `✅ ¡Cliente de WhatsApp conectado y listo!`.

## Paso 4: ¡Usar tu aplicación!
Con esa ventana de terminal negra **abierta y minimizada**, ve a tu navegador y usa tu sistema WorkFlowTaller como siempre.
Ahora, cuando muevas una tarjeta a "En Reparación" o presiones el botón de "WhatsApp" en una orden, la página intentará enviarlo a través de tu bot.

Si miras la ventana negra de la terminal, verás los registros de cada vez que envíe un mensaje: `📩 Mensaje enviado correctamente a XXXXX`.

---
> **Nota:** Si alguna vez apagas la computadora o cierras la ventana negra, tendrás que repetir el **Paso 3** (abrir terminal y escribir `npm start`) para volver a encenderlo. Por lo general, no tendrás que volver a escanear el QR, ya que la sesión queda guardada.
