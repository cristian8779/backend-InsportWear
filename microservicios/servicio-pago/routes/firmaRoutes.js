const express = require('express');
const router = express.Router();
const { generarFirma } = require('../controllers/firmaController');

router.post('/generar-firma', generarFirma);

module.exports = router;
