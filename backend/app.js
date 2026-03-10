require('dotenv').config();
const express = require('express');
const cors = require('cors');

const raceRoutes              = require('./routes/race.routes');
const croissanceRaceRoutes    = require('./routes/croissanceRace.routes');
const lotRoutes               = require('./routes/lot.routes');
const mortaliteRoutes         = require('./routes/mortalite.routes');
const enregistrementOeufsRoutes = require('./routes/enregistrementOeufs.routes');
const incubationRoutes        = require('./routes/incubation.routes');
const venteOeufsRoutes        = require('./routes/venteOeufs.routes');
const ventePouletsRoutes      = require('./routes/ventePoulets.routes');
const coutAchatRoutes         = require('./routes/coutAchat.routes');
const simulationRoutes        = require('./routes/simulation.routes');

const app = express();

app.use(cors());
app.use(express.json());

// ── Timing logger ──────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// Routes
app.use('/api/races',               raceRoutes);
app.use('/api/croissance-race',     croissanceRaceRoutes);
app.use('/api/lots',                lotRoutes);
app.use('/api/mortalites',          mortaliteRoutes);
app.use('/api/oeufs',               enregistrementOeufsRoutes);
app.use('/api/incubations',         incubationRoutes);
app.use('/api/vente-oeufs',         venteOeufsRoutes);
app.use('/api/vente-poulets',       ventePouletsRoutes);
app.use('/api/cout-achat',          coutAchatRoutes);
app.use('/api/simulation',          simulationRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({ message: 'API Élevage Poulets opérationnelle' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  const message = status < 500 ? err.message : 'Erreur interne du serveur';
  res.status(status).json({ error: message });
});

module.exports = app;
