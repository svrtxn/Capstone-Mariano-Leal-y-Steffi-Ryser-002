require('dotenv').config();
const config = require('./config');
const app = require('./app');

const PORT = Number(config.app.port || 4000);
app.listen(PORT, () => {
  console.log(`🔥 API escuchando en http://localhost:${PORT}`);
});
