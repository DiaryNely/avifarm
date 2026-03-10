const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/simulation.controller');

router.get('/',         ctrl.getDate);
router.put('/',         ctrl.setDate);
router.post('/advance', ctrl.advance);
router.post('/reset',   ctrl.reset);

module.exports = router;
