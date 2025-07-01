const express = require('express');
const {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  obtenerResumenCarrito
} = require('../controllers/carritoController');
const verificarToken = require('../middlewares/verificarToken');

const router = express.Router();

router.get('/carrito', verificarToken, obtenerCarrito); // Obtener carrito completo
router.get('/carrito/resumen', verificarToken, obtenerResumenCarrito); // ✅ Obtener resumen del carrito
router.post('/carrito', verificarToken, agregarAlCarrito); // Agregar producto al carrito
router.put('/carrito', verificarToken, actualizarCantidad); // Actualizar cantidad
router.delete('/carrito', verificarToken, eliminarDelCarrito); // Eliminar producto

module.exports = router;
