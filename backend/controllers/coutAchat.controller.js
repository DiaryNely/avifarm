const CoutAchat = require('../models/coutAchat.model');

const coutAchatController = {
  async getAll(req, res, next) {
    try {
      const data = await CoutAchat.getAll();
      res.json(data);
    } catch (err) { next(err); }
  },

  async getByLot(req, res, next) {
    try {
      const data = await CoutAchat.getByLot(parseInt(req.params.lotId));
      if (!data) return res.status(404).json({ error: "Coût d'achat non trouvé" });
      res.json(data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await CoutAchat.getById(parseInt(req.params.id));
      if (!data) return res.status(404).json({ error: "Coût d'achat non trouvé" });
      res.json(data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await CoutAchat.create(req.body);
      res.status(201).json(data);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await CoutAchat.update(parseInt(req.params.id), req.body);
      if (!data) return res.status(404).json({ error: "Coût d'achat non trouvé" });
      res.json(data);
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const deleted = await CoutAchat.delete(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: "Coût d'achat non trouvé" });
      res.status(204).send();
    } catch (err) { next(err); }
  },
};

module.exports = coutAchatController;
