// routes/rolRoutes.js
const express = require("express");
const router = express.Router();

// Controladores
const {
  invitarCambioRol,
  confirmarCodigoRol,
  listarInvitacionesRol,
  verificarInvitacionPendiente, // ✅ Ver si hay invitación
  rechazarInvitacionRol         // ✅ Rechazar invitación pendiente
} = require("../controllers/rolController");

// Middlewares
const verificarToken = require("../middlewares/verificarToken");
const esSuperAdmin = require("../middlewares/esSuperAdmin");
const limitarInvitacion = require("../middlewares/limitarInvitacion");
const limitarInvitacionPendiente = require("../middlewares/limitarInvitacionPendiente");


/**
 * ✅ Ruta para enviar invitación de cambio de rol
 * Solo un SuperAdmin puede enviarla.
 */
router.post(
  "/invitar",
  verificarToken,
  esSuperAdmin,
  limitarInvitacion,
  limitarInvitacionPendiente,
  invitarCambioRol
);

/**
 * ✅ Ruta para confirmar el código de invitación
 * El usuario ingresa el código en la app o web para aceptar el cambio de rol.
 */
router.post("/confirmar", confirmarCodigoRol);

/**
 * ✅ Ruta para ver todas las invitaciones
 * Solo accesible para SuperAdmin.
 */
router.get(
  "/invitaciones",
  verificarToken,
  esSuperAdmin,
  listarInvitacionesRol
);

/**
 * ✅ Ruta para verificar si el usuario logueado
 * tiene una invitación pendiente.
 */
router.get(
  "/pendiente",
  verificarToken,
  verificarInvitacionPendiente
);

/**
 * ✅ Ruta para rechazar una invitación
 * El usuario logueado puede cancelar la invitación pendiente.
 */
router.post(
  "/rechazar",
  verificarToken,
  rechazarInvitacionRol
);

module.exports = router;
