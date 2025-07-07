const express = require('express');
const {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  obtenerResumenCarrito,
  vaciarCarrito
} = require('../controllers/carritoController');
const verificarToken = require('../middlewares/verificarToken');
const verificarApiKey = require('../middlewares/verificarApiKey');

const router = express.Router();

// 🔐 Rutas protegidas con token JWT (para frontend)
router.get('/carrito', verificarToken, obtenerCarrito);
router.get('/carrito/resumen', verificarToken, obtenerResumenCarrito);
router.post('/carrito', verificarToken, agregarAlCarrito);
router.put('/carrito', verificarToken, actualizarCantidad);
router.delete('/carrito', verificarToken, eliminarDelCarrito);

// 🔒 Rutas internas protegidas con API Key (para microservicios como pagos)
router.get('/resumen/:userId', verificarApiKey, obtenerResumenCarrito);
router.delete('/vaciar/:userId', verificarApiKey, vaciarCarrito);

module.exports = router;
