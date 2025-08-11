const express = require('express');
const {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  obtenerResumenCarrito,
  vaciarCarrito,
  eliminarProductoDeTodosLosCarritos // 👈 importamos
} = require('../controllers/carritoController');
const verificarToken = require('../middlewares/verificarToken');
const verificarApiKey = require('../middlewares/verificarApiKey');

const router = express.Router();

// 🔐 Rutas protegidas con token JWT
router.get('/carrito', verificarToken, obtenerCarrito);
router.get('/carrito/resumen', verificarToken, obtenerResumenCarrito);
router.post('/carrito', verificarToken, agregarAlCarrito);
router.put('/carrito', verificarToken, actualizarCantidad);
router.delete('/carrito', verificarToken, eliminarDelCarrito);

// 🔒 Rutas internas protegidas con API Key
router.get('/resumen/:userId', verificarApiKey, obtenerResumenCarrito);
router.delete('/vaciar/:userId', verificarApiKey, vaciarCarrito);

// 🗑️ Eliminar producto de TODOS los carritos
router.delete('/carrito/eliminar-producto-global/:productoId', verificarApiKey, eliminarProductoDeTodosLosCarritos);

module.exports = router;
