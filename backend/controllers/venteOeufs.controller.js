const VenteOeufs = require('../models/venteOeufs.model');

const venteOeufsController = {
  async getAll(req, res, next) {
    try {
      const data = await VenteOeufs.getAll();
      res.json(data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await VenteOeufs.getById(parseInt(req.params.id));
      if (!data) return res.status(404).json({ error: 'Vente non trouvée' });
      res.json(data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await VenteOeufs.create(req.body);
      res.status(201).json(data);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await VenteOeufs.update(parseInt(req.params.id), req.body);
      if (!data) return res.status(404).json({ error: 'Vente non trouvée' });
      res.json(data);
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const deleted = await VenteOeufs.delete(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: 'Vente non trouvée' });
      res.status(204).send();
    } catch (err) { next(err); }
  },
};

module.exports = venteOeufsController;
