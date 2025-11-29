// server.js
const app = require('./app');

// Usa SIEMPRE el puerto 3030 mientras tanto
const PORT = 3030;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API escuchando en: http://192.168.100.4:${PORT}`);
});
