const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
});

// --- CONFIGURACIÓN ---
const NUMERO_XANDZIK = '527297609470@c.us'; // Tu ID de WhatsApp
const URL_PYTHON = 'http://localhost:8000/api/chat'; 

client.on('qr', qr => {
    console.log('ESCANEAME, SEÑOR XANDZIK:');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Guatzik está en línea en su número real.');
});

client.on('message', async msg => {
    // ESTA LÍNEA ES CLAVE: Le dirá en la terminal el ID real
    console.log(`[LOG] Mensaje de: ${msg.from} | Texto: ${msg.body}`);

    // Agregamos ambas variantes del número por seguridad
    const autorizados = ['5217297609470@c.us', '527297609470@c.us'];

    if (autorizados.includes(msg.from)) {
        console.log('--- Autorizado. Consultando a Guatzik... ---');
        try {
            const res = await axios.post(URL_PYTHON, { texto: msg.body });
            msg.reply(res.data.respuesta);
        } catch (err) {
            console.error('Error en el cerebro Python:', err.message);
            msg.reply('Señor, mi conexión interna falló. Revise el script de Python.');
        }
    }
});

client.initialize();
