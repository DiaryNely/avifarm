require('dotenv').config();
const app = require('./app');
const { getPool, closePool } = require('./config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  await getPool(); // Vérifier la connexion SQL Server au démarrage
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

process.on('SIGINT',  async () => { await closePool(); process.exit(0); });
process.on('SIGTERM', async () => { await closePool(); process.exit(0); });

start().catch(err => {
  console.error('Erreur de démarrage :', err.message);
  process.exit(1);
});
