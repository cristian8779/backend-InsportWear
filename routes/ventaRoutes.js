const express = require("express");
const router = express.Router();
const ventaController = require("../controllers/ventaController");
const { verificarToken, verificarAdmin } = require("../middlewares/authMiddleware");

// Rutas para ventas
router.post("/", verificarToken, ventaController.crearVenta);
router.get("/usuario", verificarToken, ventaController.obtenerVentasUsuario);

// ✅ Poner esta ruta ANTES de "/" para evitar conflicto
router.get("/exportar-excel", verificarToken, verificarAdmin, ventaController.exportarVentasExcel);

// Ruta para obtener todas las ventas con filtros
router.get("/", verificarToken, verificarAdmin, ventaController.obtenerTodasLasVentas);

// Actualizar estado de una venta
router.put("/:id", verificarToken, verificarAdmin, ventaController.actualizarEstadoVenta);

module.exports = router;
