const express = require('express');
const {
  registrar,
  login,
  renovarToken,
  verificarToken,
  obtenerCredencialPorId,
  cambiarRolUsuarioPorCorreo,
  emailExiste, // ✅ agregamos verificación de email
} = require('../controllers/authController');

const {
  listarAdminsInterno,
  eliminarAdminInterno
} = require('../controllers/adminInternoController');

const router = express.Router();

// --------------------------
// 🔓 Rutas públicas (accesibles sin autenticación)
// --------------------------

// Registro de usuario
router.post('/registrar', registrar);

// Inicio de sesión
router.post('/login', login);

// Renovar accessToken con refreshToken
router.post('/refresh', renovarToken);

// Verificar validez del token JWT
router.get('/verificar', verificarToken, (req, res) => {
  res.json({
    mensaje: "Token válido ✅",
    usuario: req.usuario,
  });
});

// Verificar si un correo ya está registrado
router.post('/email-existe', emailExiste);

// Obtener credencial por ID (uso interno por microservicios)
router.get('/credencial/:id', obtenerCredencialPorId);

// Cambiar rol de usuario (puede usarse desde el panel interno o por invitación)
router.put('/usuarios/rol', verificarToken, cambiarRolUsuarioPorCorreo);

// --------------------------
// 🔐 Rutas internas (solo accesibles con token válido)
// --------------------------

// Listar todos los administradores (uso interno)
router.get('/interno/admins', verificarToken, listarAdminsInterno);

// Eliminar un administrador por su ID (uso interno)
router.delete('/interno/admins/:id', verificarToken, eliminarAdminInterno);

module.exports = router;
