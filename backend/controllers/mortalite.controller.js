const Mortalite = require('../models/mortalite.model');

const mortaliteController = {
  async getAll(req, res, next) {
    try {
      const data = await Mortalite.getAll();
      res.json(data);
    } catch (err) { next(err); }
  },

  async getByLot(req, res, next) {
    try {
      const data = await Mortalite.getByLot(parseInt(req.params.lotId));
      res.json(data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await Mortalite.getById(parseInt(req.params.id));
      if (!data) return res.status(404).json({ error: 'Mortalité non trouvée' });
      res.json(data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await Mortalite.create(req.body);
      res.status(201).json(data);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await Mortalite.update(parseInt(req.params.id), req.body);
      if (!data) return res.status(404).json({ error: 'Mortalité non trouvée' });
      res.json(data);
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const deleted = await Mortalite.delete(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: 'Mortalité non trouvée' });
      res.status(204).send();
    } catch (err) { next(err); }
  },
};

module.exports = mortaliteController;
