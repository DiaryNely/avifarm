const Incubation = require('../models/incubation.model');

const incubationController = {
  async getAll(req, res, next) {
    try {
      const data = await Incubation.getAll();
      res.json(data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await Incubation.getById(parseInt(req.params.id));
      if (!data) return res.status(404).json({ error: 'Incubation non trouvée' });
      res.json(data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await Incubation.create(req.body);
      res.status(201).json(data);
    } catch (err) { next(err); }
  },

  async enregistrerEclosion(req, res, next) {
    try {
      const data = await Incubation.enregistrerEclosion(parseInt(req.params.id), req.body);
      res.json(data);
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const deleted = await Incubation.delete(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: 'Incubation non trouvée' });
      res.status(204).send();
    } catch (err) { next(err); }
  },
};

module.exports = incubationController;
