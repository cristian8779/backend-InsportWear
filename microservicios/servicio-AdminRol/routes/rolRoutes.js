// routes/rolRoutes.js
const express = require("express");
const router = express.Router();
const {
  invitarCambioRol,
  confirmarInvitacionRol,
  listarInvitacionesRol,
} = require("../controllers/rolController");
const verificarToken = require("../middlewares/verificarToken");
const esSuperAdmin = require("../middlewares/esSuperAdmin");
const limitarInvitacion = require("../middlewares/limitarInvitacion");

router.post("/invitar", verificarToken, esSuperAdmin, limitarInvitacion, invitarCambioRol);
router.post("/confirmar", confirmarInvitacionRol);
router.get("/invitaciones", verificarToken, esSuperAdmin, listarInvitacionesRol);

module.exports = router;
