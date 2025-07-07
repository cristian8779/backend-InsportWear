// routes/favoritoRoutes.js
const express = require('express');
const router = express.Router();
const favoritoController = require('../controllers/favoritoController');
const auth = require('../middlewares/authMiddleware');

router.post('/', auth.verificarToken, favoritoController.agregarFavorito);
router.get('/', auth.verificarToken, favoritoController.obtenerFavoritos);
router.delete('/', auth.verificarToken, favoritoController.eliminarFavorito);

module.exports = router;
