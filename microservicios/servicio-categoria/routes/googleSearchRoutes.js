const express = require('express');
const router = express.Router();

const {
  buscarImagenesGoogle,
  asociarImagenInternetACategoria,
  obtenerCuotaBusqueda // ← nuevo controlador agregado
} = require('../controllers/googleSearchController');

const { verificarToken } = require('../middlewares/authMiddleware');

// Middleware combinado personalizado
const esAdminOSuperAdmin = (req, res, next) => {
  const rol = req.usuario?.rol;
  if (rol === 'admin' || rol === 'superAdmin') {
    return next();
  }
  return res.status(403).json({
    mensaje: '🔒 Acceso denegado: solo administradores o super administradores pueden usar esta función.'
  });
};

// 🔍 Ruta: Buscar imágenes en Google
router.get('/', verificarToken, esAdminOSuperAdmin, buscarImagenesGoogle);

// 🔄 Ruta: Asociar imagen seleccionada a una categoría (por su ID)
router.put('/asociar/:id', verificarToken, esAdminOSuperAdmin, asociarImagenInternetACategoria);

// 📊 Ruta: Obtener el estado actual de la cuota de búsqueda diaria
router.get('/cuota', verificarToken, esAdminOSuperAdmin, obtenerCuotaBusqueda);

module.exports = router;
