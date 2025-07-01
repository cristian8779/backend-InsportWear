const express = require('express');
const { 
  crearProducto, 
  obtenerProductos, 
  actualizarProducto, 
  eliminarProducto 
} = require('../controllers/productoController');
const { verificarToken } = require('../controllers/authController'); // ← CORREGIDO
const upload = require('../middlewares/upload');

const router = express.Router();

// Subir imagen usando Cloudinary
router.post('/upload', verificarToken, upload.single('imagen'), (req, res) => {
  if (req.file) {
    return res.status(200).json({ mensaje: 'Imagen subida correctamente', url: req.file.path });
  } else {
    return res.status(400).json({ mensaje: 'No se ha subido ninguna imagen' });
  }
});

// Rutas para productos
router.post('/', verificarToken, upload.single('imagen'), crearProducto);
router.get('/', obtenerProductos);
router.put('/:id', verificarToken, upload.single('imagen'), actualizarProducto);
router.delete('/:id', verificarToken, eliminarProducto);

module.exports = router;
