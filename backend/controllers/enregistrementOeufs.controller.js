const EnregistrementOeufs = require('../models/enregistrementOeufs.model');

const enregistrementOeufsController = {
  async getAll(req, res, next) {
    try {
      const data = await EnregistrementOeufs.getAll();
      res.json(data);
    } catch (err) { next(err); }
  },

  async getByLot(req, res, next) {
    try {
      const data = await EnregistrementOeufs.getByLot(parseInt(req.params.lotId));
      res.json(data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await EnregistrementOeufs.getById(parseInt(req.params.id));
      if (!data) return res.status(404).json({ error: 'Enregistrement non trouvé' });
      res.json(data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await EnregistrementOeufs.create(req.body);
      res.status(201).json(data);
    } catch (err) {
      if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
      if (err.status) return res.status(err.status).json({ error: err.error });
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const data = await EnregistrementOeufs.update(parseInt(req.params.id), req.body);
      if (!data) return res.status(404).json({ error: 'Enregistrement non trouvé' });
      res.json(data);
    } catch (err) {
      if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const deleted = await EnregistrementOeufs.delete(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: 'Enregistrement non trouvé' });
      res.status(204).send();
    } catch (err) {
      if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
      next(err);
    }
  },
};

module.exports = enregistrementOeufsController;
