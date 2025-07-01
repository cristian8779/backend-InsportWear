const express = require("express");
const router = express.Router();
const { verificarToken } = require("../controllers/authController");
const {
  listarAdmins,
  eliminarAdmin,
  listarUsuariosPorRol,
} = require("../controllers/adminController");

router.get("/admins", verificarToken, listarAdmins);
router.delete("/admins/:id", verificarToken, eliminarAdmin);

module.exports = router;
