const express = require("express");
const router = express.Router();

// ✅ IMPORTACIÓN CORRECTA desde rolController
const {
  invitarCambioRol,
  confirmarCodigoRol,
  verificarInvitacionPendiente,
  rechazarInvitacionRol,
  listarInvitacionesRol,
  cancelarInvitacionPorSuperAdmin, // 👈 AGREGADO - Faltaba esta importación
  eliminarTodasInvitaciones
} = require("../controllers/rolController");

// Middlewares
const verificarToken = require("../middlewares/verificarToken");
const esSuperAdmin = require("../middlewares/esSuperAdmin");
const limitarInvitacion = require("../middlewares/limitarInvitacion");
const limitarInvitacionPendiente = require("../middlewares/limitarInvitacionPendiente");

/**
 * ✅ Ruta para enviar invitación de cambio de rol
 * POST /api/rol/invitar
 */
router.post(
  "/invitar",
  (req, res, next) => {
    console.log("📩 [POST] /api/rol/invitar");
    console.log("🔹 Headers:", req.headers);
    console.log("🔹 Body recibido:", req.body);
    next();
  },
  verificarToken,
  esSuperAdmin,
  limitarInvitacion,
  limitarInvitacionPendiente,
  invitarCambioRol
);

/**
 * ✅ Ruta para confirmar el código de invitación
 * POST /api/rol/confirmar
 */
router.post(
  "/confirmar",
  (req, res, next) => {
    console.log("🔑 [POST] /api/rol/confirmar");
    console.log("🔹 Headers:", req.headers);
    console.log("🔹 Body recibido:", req.body);
    next();
  },
  verificarToken,
  confirmarCodigoRol
);

/**
 * ✅ Ruta para verificar invitación pendiente
 * GET /api/rol/pendiente
 */
router.get(
  "/pendiente",
  (req, res, next) => {
    console.log("⏳ [GET] /api/rol/pendiente");
    console.log("🔹 Headers:", req.headers);
    next();
  },
  verificarToken,
  verificarInvitacionPendiente
);

/**
 * ✅ Ruta para rechazar invitación
 * POST /api/rol/rechazar
 */
router.post(
  "/rechazar",
  (req, res, next) => {
    console.log("🚫 [POST] /api/rol/rechazar");
    console.log("🔹 Headers:", req.headers);
    console.log("🔹 Body recibido:", req.body);
    next();
  },
  verificarToken,
  rechazarInvitacionRol
);

/**
 * ✅ Ruta para listar invitaciones
 * GET /api/rol/invitaciones
 */
router.get(
  "/invitaciones",
  (req, res, next) => {
    console.log("📜 [GET] /api/rol/invitaciones");
    console.log("🔹 Headers:", req.headers);
    next();
  },
  verificarToken,
  esSuperAdmin,
  listarInvitacionesRol
);

/**
 * ✅ Ruta para cancelar invitación específica por SuperAdmin
 * DELETE /api/rol/cancelar/:email
 */
router.delete(
  "/cancelar/:email",
  (req, res, next) => {
    console.log("🛑 [DELETE] /api/rol/cancelar/:email");
    console.log("🔹 Headers:", req.headers);
    console.log("🔹 Params:", req.params);
    next();
  },
  verificarToken,
  esSuperAdmin,
  cancelarInvitacionPorSuperAdmin
);

/**
 * 🚨 Ruta para eliminar TODAS las invitaciones (solo SuperAdmin con confirmación)
 * DELETE /api/rol/invitaciones/todas
 */
router.delete(
  "/invitaciones/todas",
  (req, res, next) => {
    console.log("⚠️ [DELETE] /api/rol/invitaciones/todas");
    console.log("🔹 Headers:", req.headers);
    console.log("🔹 Body recibido:", req.body);

    if (req.body.confirmacion !== "ELIMINAR TODO") {
      return res.status(400).json({
        error: "Debes enviar { confirmacion: 'ELIMINAR TODO' } para continuar"
      });
    }
    next();
  },
  verificarToken,
  esSuperAdmin,
  eliminarTodasInvitaciones
);

module.exports = router;