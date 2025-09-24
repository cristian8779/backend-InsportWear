const express = require("express");
const router = express.Router();
const ventaController = require("../controllers/ventaController");
const { verificarToken, verificarAdmin } = require("../middlewares/authMiddleware");
const verificarApiKey = require("../middlewares/verificarApiKey");

// 🔐 Ruta interna para microservicios (crear venta desde pagos con API key)
router.post("/crear", verificarApiKey, ventaController.crearVentaDesdePago);

// 🔎 Buscar venta por referencia (usado desde servicio de pagos)
router.get("/referencia/:referenciaPago", verificarApiKey, ventaController.buscarPorReferencia);

// 🔐 Rutas protegidas con token de usuario
router.use(verificarToken);

// 👤 Obtener ventas del usuario autenticado
router.get("/usuario", ventaController.obtenerVentasUsuario);

// 🗂️ Obtener todas las ventas con filtros (solo Admin o SuperAdmin)
router.get("/", verificarAdmin, ventaController.obtenerTodasLasVentas);

// ❌ Eliminar una venta (solo Admin o SuperAdmin)
router.delete("/:id", verificarAdmin, ventaController.eliminarVenta);


module.exports = router;
