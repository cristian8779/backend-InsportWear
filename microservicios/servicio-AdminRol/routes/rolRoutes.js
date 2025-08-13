// routes/rolRoutes.js
const express = require("express");
const router = express.Router();

// ✅ IMPORTACIÓN CORRECTA desde rolController
const {
  invitarCambioRol,
  confirmarCodigoRol,
  verificarInvitacionPendiente,
  rechazarInvitacionRol
} = require("../controllers/rolController");

// Middlewares
const verificarToken = require("../middlewares/verificarToken");
const esSuperAdmin = require("../middlewares/esSuperAdmin");
const limitarInvitacion = require("../middlewares/limitarInvitacion");
const limitarInvitacionPendiente = require("../middlewares/limitarInvitacionPendiente");

/**
 * ✅ Ruta para enviar invitación de cambio de rol
 * POST /api/rol/invitar - Solo un SuperAdmin puede enviarla
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
 * POST /api/rol/confirmar - El usuario debe estar logueado
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
 * ✅ Ruta para verificar si el usuario logueado tiene una invitación pendiente
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
 * ✅ Ruta para rechazar una invitación
 * POST /api/rol/rechazar - El usuario logueado puede cancelar su invitación pendiente
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

module.exports = router;