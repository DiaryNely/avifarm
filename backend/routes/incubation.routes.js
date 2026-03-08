const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/incubation.controller');

router.get('/',                    ctrl.getAll);
router.get('/:id',                 ctrl.getById);
router.post('/',                   ctrl.create);
router.post('/:id/eclosion',       ctrl.enregistrerEclosion);
router.delete('/:id',              ctrl.delete);

module.exports = router;
