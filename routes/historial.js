const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialController');
const { verificarToken } = require('../middlewares/authMiddleware'); // ✅ Importamos solo la función

// Protege todas las rutas con autenticación
router.use(verificarToken);

// 👉 Agregar un producto al historial
router.post('/', historialController.agregarAlHistorial);

// 👉 Obtener historial agrupado por fecha (Hoy, Ayer, etc.)
router.get('/', historialController.obtenerHistorialAgrupadoPorFecha);

// 👉 Eliminar un solo producto del historial
router.delete('/:id', historialController.eliminarDelHistorial);

// 👉 Borrar todo el historial del usuario
router.delete('/', historialController.borrarHistorialCompleto);

module.exports = router;
