// server.js
const app = require('./app');
const config = require('./config/config');

const PORT = Number(config.app.port || 3030);

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
