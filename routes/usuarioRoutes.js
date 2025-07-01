// routes/usuarioRoutes.js
const express = require("express");
const {
  obtenerUsuarios,
  actualizarUsuario,
  eliminarUsuario
} = require("../controllers/usuarioController");

const { verificarToken, verificarAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// 🔒 Gestión de usuarios (solo admins pueden ver y actualizar cualquier usuario)
// Eliminar usuario también puede ser hecho por el mismo usuario (validación en el controlador)
router.get("/usuarios", verificarToken, verificarAdmin, obtenerUsuarios);
router.put("/usuarios/:id", verificarToken, verificarAdmin, actualizarUsuario);
router.delete("/usuarios/:id", verificarToken, eliminarUsuario);

module.exports = router;
