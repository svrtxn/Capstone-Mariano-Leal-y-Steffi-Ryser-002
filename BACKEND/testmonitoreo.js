// testMonitoreo.js
const { iniciarMonitoreo } = require('./src/services/monitoreoGlucosaService');

const usuarioId = 123; // Cambia por un usuario real de prueba
const intervalo = 10 * 1000; // 10 segundos para prueba rápida

// Inicia el monitoreo
const detenerMonitoreo = iniciarMonitoreo(usuarioId, intervalo);

// Opcional: detener el monitoreo después de 1 minuto
setTimeout(() => {
  detenerMonitoreo();
  console.log('✅ Prueba de monitoreo finalizada.');
}, 60 * 1000);
