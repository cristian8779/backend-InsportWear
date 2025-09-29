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

// 📌 Importar controladores de SuperAdmin
const {
  transferirSuperAdmin,
  confirmarTransferencia,
  rechazarTransferencia,
  verificarTransferenciaPendiente
} = require("../controllers/transferenciaSuperAdminController");


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

/* =========================
   📌 RUTAS DE SUPERADMIN
   ========================= */

// Iniciar transferencia de SuperAdmin
router.post(
  "/superadmin/transferir",
  (req, res, next) => {
    console.log("🔹 Headers:", req.headers);
    console.log("🔹 Body recibido:", req.body);
    next();
  },
  verificarToken,
  esSuperAdmin,
  transferirSuperAdmin
);

// Confirmar transferencia
router.post(
  "/superadmin/confirmar",
  (req, res, next) => {
    console.log("🔹 Headers:", req.headers);
    console.log("🔹 Body recibido:", req.body);
    next();
  },
  verificarToken,
  confirmarTransferencia
);

// Rechazar transferencia
router.post(
  "/superadmin/rechazar",
  (req, res, next) => {
    console.log("🔹 Headers:", req.headers);
    console.log("🔹 Body recibido:", req.body);
    next();
  },
  verificarToken,
  rechazarTransferencia
);

// Verificar si hay transferencia pendiente
router.get(
  "/superadmin/pendiente",
  (req, res, next) => {
    console.log("🔹 Headers:", req.headers);
    next();
  },
  verificarToken,
  verificarTransferenciaPendiente
);

module.exports = router;
