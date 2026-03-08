const Lot = require('../models/lot.model');

const lotController = {
  async getAll(req, res, next) {
    try {
      const lots = await Lot.getAll();
      res.json(lots);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const lot = await Lot.getById(parseInt(req.params.id));
      if (!lot) return res.status(404).json({ error: 'Lot non trouvé' });
      res.json(lot);
    } catch (err) { next(err); }
  },

  async getSituation(req, res, next) {
    try {
      const data = await Lot.getSituation();
      res.json(data);
    } catch (err) { next(err); }
  },

  async getSituationById(req, res, next) {
    try {
      const data = await Lot.getSituationById(parseInt(req.params.id));
      if (!data) return res.status(404).json({ error: 'Lot non trouvé' });
      res.json(data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const lot = await Lot.create(req.body);
      res.status(201).json(lot);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const lot = await Lot.update(parseInt(req.params.id), req.body);
      if (!lot) return res.status(404).json({ error: 'Lot non trouvé' });
      res.json(lot);
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const deleted = await Lot.delete(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: 'Lot non trouvé' });
      res.status(204).send();
    } catch (err) { next(err); }
  },
};

module.exports = lotController;
