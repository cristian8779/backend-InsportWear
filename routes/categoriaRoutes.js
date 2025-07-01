const express = require('express');
const {
  crearCategoria,
  obtenerCategorias
} = require('../controllers/categoriaController');

const verificarToken = require('../middlewares/verificarToken'); // ✅ sin destructuring
const esAdmin = require('../middlewares/esAdmin');
const uploadCategoria = require('../middlewares/uploadCategoria');

const router = express.Router();

// Crear una nueva categoría (solo admins, con imagen)
router.post(
  '/',
  verificarToken,
  esAdmin,
  uploadCategoria.single('imagen'),
  crearCategoria
);

// Obtener todas las categorías (todos los usuarios)
router.get('/', obtenerCategorias);

module.exports = router;
