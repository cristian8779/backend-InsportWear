const express = require("express");
const router = express.Router();
const ventaController = require("../controllers/ventaController");
const { verificarToken, verificarAdmin } = require("../middlewares/authMiddleware");
const verificarApiKey = require("../middlewares/verificarApiKey");

// 🔐 Rutas protegidas con token de usuario
router.use(verificarToken);

// 📦 Crear nueva venta (usuarios autenticados)
router.post("/", ventaController.crearVenta);

// 👤 Obtener ventas del usuario autenticado
router.get("/usuario", ventaController.obtenerVentasUsuario);

// 🧾 Exportar a Excel (solo Admin o SuperAdmin)
router.get("/exportar-excel", verificarAdmin, ventaController.exportarVentasExcel);

// 🗂️ Obtener todas las ventas con filtros (solo Admin o SuperAdmin)
router.get("/", verificarAdmin, ventaController.obtenerTodasLasVentas);

// 🔄 Actualizar estado de venta (solo Admin o SuperAdmin)
router.put("/:id", verificarAdmin, ventaController.actualizarEstadoVenta);

// ❌ Eliminar una venta (solo Admin o SuperAdmin)
router.delete("/:id", verificarAdmin, ventaController.eliminarVenta);

// 🔐 Ruta interna para microservicios (crear venta desde pagos con API key)
router.post("/crear", verificarApiKey, ventaController.crearVentaDesdePago);

module.exports = router;
