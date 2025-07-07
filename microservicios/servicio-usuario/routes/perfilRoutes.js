const express = require("express");
const {
  obtenerPerfil,
  actualizarImagenPerfil,
  eliminarImagenPerfil,
  crearPerfil, // <-- importante: nueva función para registrar perfil desde auth
} = require("../controller/perfilController");

const { verificarToken } = require("../middlewares/authMiddleware");
const uploadUsuario = require("../middlewares/uploadUsuario");

const router = express.Router();

// Ruta para crear perfil desde microservicio de autenticación
// No requiere token porque es llamada interna
router.post("/", crearPerfil);

// Obtener perfil del usuario autenticado
router.get("/", verificarToken, obtenerPerfil);

// Actualizar imagen de perfil
router.put("/imagen", verificarToken, uploadUsuario.single("imagen"), actualizarImagenPerfil);

// Eliminar imagen de perfil
router.delete("/imagen", verificarToken, eliminarImagenPerfil);

module.exports = router;
