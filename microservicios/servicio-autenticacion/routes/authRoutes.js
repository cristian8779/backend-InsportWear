const express = require('express');
const {
  registrar,
  login,
  renovarToken, // ✅ nuevo
  verificarToken,
  obtenerCredencialPorId,
  cambiarRolUsuarioPorCorreo
} = require('../controllers/authController');

const {
  listarAdminsInterno,
  eliminarAdminInterno
} = require('../controllers/adminInternoController'); // 👈 nuevo controlador para rutas internas

const router = express.Router();

// --------------------------
// 🔓 Rutas públicas
// --------------------------

// Registro de credenciales
router.post('/registrar', registrar);

// Login de usuario
router.post('/login', login);

// 🔄 Renovar token (refreshToken)
router.post('/refresh', renovarToken); // ✅ nueva ruta

// Verificación de token (útil para frontend)
router.get('/verificar', verificarToken, (req, res) => {
  res.json({
    mensaje: "Token válido.",
    usuario: req.usuario
  });
});

// Obtener credencial por ID (para microservicio de usuario)
router.get('/credencial/:id', obtenerCredencialPorId);

// Cambiar rol de un usuario (por confirmación de invitación o panel interno)
router.put('/usuarios/rol', verificarToken, cambiarRolUsuarioPorCorreo);

// --------------------------
// 🔐 Rutas internas protegidas (uso desde otros microservicios)
// --------------------------

// Listar todos los administradores
router.get('/interno/admins', verificarToken, listarAdminsInterno);

// Eliminar un administrador por ID
router.delete('/interno/admins/:id', verificarToken, eliminarAdminInterno);

module.exports = router;
