const express = require('express');
const {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  obtenerProductosPorCategoria,
  actualizarProducto,
  eliminarProducto,
  reducirStock,
  reducirStockVariacion
} = require('../controllers/productoController');

const verificarToken = require('../middlewares/verificarToken');
const upload = require('../middlewares/upload');

const router = express.Router();

// 🔐 Middleware para verificar roles admin o superAdmin
const verificarAdminOsuperAdmin = (req, res, next) => {
  if (['admin', 'superAdmin'].includes(req.usuario?.rol)) {
    return next();
  }
  return res.status(403).json({ mensaje: '⛔ No tienes permisos para esta acción.' });
};

// 📤 Subir imagen usando Cloudinary
router.post('/upload', verificarToken, verificarAdminOsuperAdmin, upload.single('imagen'), (req, res) => {
  if (req.file) {
    return res.status(200).json({ mensaje: 'Imagen subida correctamente', url: req.file.path });
  } else {
    return res.status(400).json({ mensaje: 'No se ha subido ninguna imagen' });
  }
});

// 📦 Rutas de productos
router.post('/', verificarToken, verificarAdminOsuperAdmin, upload.single('imagen'), crearProducto);
router.get('/', obtenerProductos);

// ⚠️ Esta va antes para evitar conflicto con '/:id'
router.get('/por-categoria/:id', obtenerProductosPorCategoria);

// ✅ Esta debe ir después y sin verificarToken para permitir acceso desde el carrito
router.get('/:id', obtenerProductoPorId);

router.put('/:id', verificarToken, verificarAdminOsuperAdmin, upload.single('imagen'), actualizarProducto);
router.delete('/:id', verificarToken, verificarAdminOsuperAdmin, eliminarProducto);

// ✅ Rutas nuevas para actualizar stock desde microservicio de ventas o carrito
router.put('/:id/reducir-stock', reducirStock);
router.put('/:id/reducir-stock-variacion', reducirStockVariacion);

module.exports = router;