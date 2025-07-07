const express = require('express');
const router = express.Router();

const {
  buscarImagenesGoogle,
  asociarImagenInternetACategoria
} = require('../controllers/googleSearchController'); // o cambiar el nombre del controller si ya lo renombraste

const { verificarToken } = require('../middlewares/authMiddleware');

// Middleware combinado personalizado
const esAdminOSuperAdmin = (req, res, next) => {
  const rol = req.usuario?.rol;
  if (rol === 'admin' || rol === 'superAdmin') {
    return next();
  }
  return res.status(403).json({ mensaje: '🔒 Acceso denegado: solo administradores o super administradores pueden usar esta función.' });
};

// 🔍 Ruta: Buscar imágenes en Google
router.get('/', verificarToken, esAdminOSuperAdmin, buscarImagenesGoogle);

// 🔄 Ruta: Asociar imagen seleccionada a una categoría (por su ID)
router.put('/asociar/:id', verificarToken, esAdminOSuperAdmin, asociarImagenInternetACategoria);

module.exports = router;
