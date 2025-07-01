const express = require('express');
const router = express.Router();

const { buscarImagenesGoogle } = require('../controllers/googleSearchController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Middleware combinado personalizado
const esAdminOSuperAdmin = (req, res, next) => {
  const rol = req.usuario?.rol;
  if (rol === 'admin' || rol === 'superAdmin') {
    return next();
  }
  return res.status(403).json({ mensaje: '🔒 Acceso denegado: solo administradores o super administradores pueden usar esta función.' });
};

// Ruta protegida: solo admin o superAdmin pueden buscar imágenes por internet
router.get('/', verificarToken, esAdminOSuperAdmin, buscarImagenesGoogle);

module.exports = router;
