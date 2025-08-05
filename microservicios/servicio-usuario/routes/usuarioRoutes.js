const express = require("express");
const router = express.Router();

const {
  crearUsuario,
  obtenerUsuarioPorCredencial,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
} = require("../controller/usuario.controller");

const {
  obtenerUsuariosPorCredenciales // ✅ Nuevo controlador para uso interno
} = require("../controller/interno.controller");

const verificarToken = require("../middlewares/verificarToken");

// Crear usuario (desde autenticación)
router.post("/", crearUsuario);

// Obtener usuario por ID de credencial
router.get("/credencial/:id", obtenerUsuarioPorCredencial);

// ✅ Nueva ruta: Obtener usuario por su _id (para microservicio de reseñas)
router.get("/:id", obtenerUsuarioPorId);

// Actualizar datos del usuario
router.put("/:id", verificarToken, actualizarUsuario);

// Eliminar usuario
router.delete("/:id", verificarToken, eliminarUsuario);

// ✅ Ruta interna: obtener usuarios por credenciales (uso entre microservicios)
router.post("/interno/usuarios-por-credenciales", obtenerUsuariosPorCredenciales);

module.exports = router;
