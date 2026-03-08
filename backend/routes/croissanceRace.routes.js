const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/croissanceRace.controller');

router.get('/',                          ctrl.getAll);
router.get('/race/:raceId/tableau',      ctrl.getTableau);
router.get('/race/:raceId',              ctrl.getByRace);
router.get('/:id',                       ctrl.getById);
router.post('/',                  ctrl.create);
router.put('/:id',                ctrl.update);
router.delete('/:id',             ctrl.delete);

module.exports = router;
