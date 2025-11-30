// server.js
const app = require('./app');

const PORT = 3030;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API escuchando en: http://172.20.10.2:${PORT}`);
});
