require('dotenv').config();
const config = require('./config');
const app = require('./app');

const PORT = Number(config.app.port || 8080);
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
