const CroissanceRace = require('../models/croissanceRace.model');

const croissanceRaceController = {
  async getAll(req, res, next) {
    try {
      const data = await CroissanceRace.getAll();
      res.json(data);
    } catch (err) { next(err); }
  },

  async getByRace(req, res, next) {
    try {
      const data = await CroissanceRace.getByRace(parseInt(req.params.raceId));
      res.json(data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await CroissanceRace.getById(parseInt(req.params.id));
      if (!data) return res.status(404).json({ error: 'Enregistrement non trouvé' });
      res.json(data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await CroissanceRace.create(req.body);
      res.status(201).json(data);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await CroissanceRace.update(parseInt(req.params.id), req.body);
      if (!data) return res.status(404).json({ error: 'Enregistrement non trouvé' });
      res.json(data);
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const deleted = await CroissanceRace.delete(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: 'Enregistrement non trouvé' });
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async getTableau(req, res, next) {
    try {
      const data = await CroissanceRace.getTableauByRace(parseInt(req.params.raceId));
      res.json(data);
    } catch (err) { next(err); }
  },
};

module.exports = croissanceRaceController;
