const Race = require('../models/race.model');

const raceController = {
  async getAll(req, res, next) {
    try {
      const races = await Race.getAll();
      res.json(races);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const race = await Race.getById(parseInt(req.params.id));
      if (!race) return res.status(404).json({ error: 'Race non trouvée' });
      res.json(race);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const race = await Race.create(req.body);
      res.status(201).json(race);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const race = await Race.update(parseInt(req.params.id), req.body);
      if (!race) return res.status(404).json({ error: 'Race non trouvée' });
      res.json(race);
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const deleted = await Race.delete(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: 'Race non trouvée' });
      res.status(204).send();
    } catch (err) { next(err); }
  },
};

module.exports = raceController;
