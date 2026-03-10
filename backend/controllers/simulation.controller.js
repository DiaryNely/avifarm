const sim = require('../simulation');

exports.getDate = (req, res) => {
  res.json({ date: sim.getDate().toISOString() });
};

exports.setDate = (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Le champ "date" est requis.' });
  sim.setDate(date);
  res.json({ date: sim.getDate().toISOString() });
};

exports.advance = (req, res) => {
  const { days } = req.body;
  if (!days || typeof days !== 'number') return res.status(400).json({ error: 'Le champ "days" (nombre) est requis.' });
  const d = sim.getDate();
  d.setDate(d.getDate() + days);
  sim.setDate(d);
  res.json({ date: sim.getDate().toISOString() });
};

exports.reset = (req, res) => {
  sim.reset();
  res.json({ date: sim.getDate().toISOString() });
};
