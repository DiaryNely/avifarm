const VentePoulets = require('../models/ventePoulets.model');

const ventePouletsController = {
  async getAll(req, res, next) {
    try {
      const data = await VentePoulets.getAll();
      res.json(data);
    } catch (err) { next(err); }
  },

  async getByLot(req, res, next) {
    try {
      const data = await VentePoulets.getByLot(parseInt(req.params.lotId));
      res.json(data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await VentePoulets.getById(parseInt(req.params.id));
      if (!data) return res.status(404).json({ error: 'Vente non trouvée' });
      res.json(data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await VentePoulets.create(req.body);
      res.status(201).json(data);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await VentePoulets.update(parseInt(req.params.id), req.body);
      if (!data) return res.status(404).json({ error: 'Vente non trouvée' });
      res.json(data);
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const deleted = await VentePoulets.delete(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: 'Vente non trouvée' });
      res.status(204).send();
    } catch (err) { next(err); }
  },
};

module.exports = ventePouletsController;
