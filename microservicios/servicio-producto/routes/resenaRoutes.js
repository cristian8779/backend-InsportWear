const express = require('express');
const router = express.Router();

const {
  crearResena,
  obtenerResenasPorProducto,
  actualizarResena,
  eliminarResena
} = require('../controllers/resenaController');

const verificarToken = require('../middlewares/verificarToken'); // ✅ CORRECTO

// Crear reseña para un producto
router.post('/producto/:productoId', verificarToken, crearResena);

// Obtener reseñas de un producto
router.get('/producto/:productoId', obtenerResenasPorProducto);

// Actualizar reseña por ID
router.put('/id/:id', verificarToken, actualizarResena);

// Eliminar reseña por ID
router.delete('/producto/:productoId/:id', verificarToken, eliminarResena);


module.exports = router;
