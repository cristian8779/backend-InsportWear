const express = require('express');
const router = express.Router();
const {
  agregarFavorito,
  obtenerFavoritos,
  eliminarFavorito,
  eliminarFavoritosPorProducto, // 👈 ahora sí lo importamos
} = require('../controllers/favoritoController');
const auth = require('../middlewares/authMiddleware');

// Añadir producto a favoritos
router.post('/', auth.verificarToken, agregarFavorito);

// Obtener favoritos del usuario
router.get('/', auth.verificarToken, obtenerFavoritos);

// Eliminar un favorito (por productoId en el body)
router.delete('/', auth.verificarToken, eliminarFavorito);

// Eliminar TODOS los favoritos de un producto (cuando se borra del catálogo)
router.delete('/producto/:productoId', eliminarFavoritosPorProducto);

module.exports = router;
