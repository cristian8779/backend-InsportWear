const express = require("express");
const {
  obtenerPerfil,
  actualizarImagenPerfil,
  eliminarImagenPerfil,
} = require("../controllers/perfilController");

const { verificarToken } = require("../middlewares/authMiddleware");
const uploadUsuario = require("../middlewares/uploadUsuario");

const router = express.Router();

// Perfil del usuario autenticado
router.get("/", verificarToken, obtenerPerfil);

// Actualizar imagen de perfil
router.put("/imagen", verificarToken, uploadUsuario.single("imagen"), actualizarImagenPerfil);

// Eliminar imagen de perfil
router.delete("/imagen", verificarToken, eliminarImagenPerfil);

module.exports = router;
