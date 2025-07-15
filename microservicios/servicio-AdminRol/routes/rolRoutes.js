// routes/rolRoutes.js
const express = require("express");
const router = express.Router();

// Controladores
const {
  invitarCambioRol,
  confirmarCodigoRol, // ✅ nombre correcto
  listarInvitacionesRol,
} = require("../controllers/rolController");

// Middlewares
const verificarToken = require("../middlewares/verificarToken");
const esSuperAdmin = require("../middlewares/esSuperAdmin");
const limitarInvitacion = require("../middlewares/limitarInvitacion");

// ✅ Ruta para enviar invitación de cambio de rol (solo SuperAdmin)
router.post(
  "/invitar",
  verificarToken,
  esSuperAdmin,
  limitarInvitacion,
  invitarCambioRol
);

// ✅ Ruta para confirmar el código de la invitación (usuario lo introduce en la app)
router.post("/confirmar", confirmarCodigoRol);

// ✅ Ruta para ver todas las invitaciones (solo SuperAdmin)
router.get(
  "/invitaciones",
  verificarToken,
  esSuperAdmin,
  listarInvitacionesRol
);

module.exports = router;
