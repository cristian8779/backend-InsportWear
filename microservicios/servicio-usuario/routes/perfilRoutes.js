const express = require("express");
const {
  obtenerPerfil,
  actualizarImagenPerfil,
  eliminarImagenPerfil,
  crearPerfil,
  actualizarPerfil,
} = require("../controller/perfilController");

const { verificarToken } = require("../middlewares/authMiddleware");
const uploadUsuario = require("../middlewares/uploadUsuario");

const router = express.Router();

/**
 * 🚀 Crear perfil desde el microservicio de autenticación
 * Esta ruta es interna, no requiere token
 */
router.post("/", crearPerfil);

/**
 * 👤 Obtener el perfil del usuario autenticado
 */
router.get("/", verificarToken, obtenerPerfil);

/**
 * 🖼️ Subir o actualizar la imagen de perfil
 * Usamos POST para evitar errores con multipart/form-data
 */
router.post("/imagen", verificarToken, uploadUsuario.single("imagen"), actualizarImagenPerfil);

/**
 * 🗑️ Eliminar la imagen de perfil del usuario
 */
router.delete("/imagen", verificarToken, eliminarImagenPerfil);

/**
 * 📝 Actualizar datos del perfil: nombre, dirección o teléfono
 */
router.put("/datos", verificarToken, actualizarPerfil);

module.exports = router;
