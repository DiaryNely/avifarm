const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lot.controller');

router.get('/',                   ctrl.getAll);
router.get('/situation',          ctrl.getSituation);
router.get('/:id',                ctrl.getById);
router.get('/:id/situation',      ctrl.getSituationById);
router.post('/',                  ctrl.create);
router.put('/:id',                ctrl.update);
router.delete('/:id',             ctrl.delete);

module.exports = router;
