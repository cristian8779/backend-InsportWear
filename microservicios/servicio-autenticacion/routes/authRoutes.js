const express = require('express');
const {
  registrar,
  login,
  renovarToken,
  verificarToken,
  obtenerCredencialPorId,
  emailExiste,
} = require('../controllers/authController');

const {
  listarAdminsInterno,
  eliminarAdminInterno
} = require('../controllers/adminInternoController');

// ✅ Nuevo controlador para obtener usuario por email
const {
  obtenerUsuarioPorEmail
} = require('../controllers/usuarioAuth.controller');

// ✅ Nuevo controlador separado para cambiar rol
const {
  cambiarRolUsuarioPorCorreo
} = require('../controllers/cambiarRolUsuarioPorCorreo'); // <== Asegúrate que la ruta sea correcta

// ✅ Nuevo controlador para transferencia de SuperAdmin
const {
  transferirSuperAdmin
} = require('../controllers/transferenciaSuperAdmin'); // <== Asegúrate que el archivo exista y el nombre coincida

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

// ✅ NUEVA ruta: Obtener usuario por email (uso interno para cambio de rol)
router.get('/usuarios/:email', obtenerUsuarioPorEmail);

// ✅ NUEVA ruta: Cambiar rol usando nuevo controller
router.put('/usuarios/rol', verificarToken, cambiarRolUsuarioPorCorreo);

// ✅ NUEVA ruta: Transferencia de SuperAdmin
router.put('/usuarios/transferencia-superadmin', verificarToken, transferirSuperAdmin);

// --------------------------
// 🔐 Rutas internas (solo accesibles con token válido)
// --------------------------

// Listar todos los administradores (uso interno)
router.get('/interno/admins', verificarToken, listarAdminsInterno);

// Eliminar un administrador por su ID (uso interno)
router.delete('/interno/admins/:id', verificarToken, eliminarAdminInterno);

module.exports = router;
