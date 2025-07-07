const express = require('express');
const {
  crearCategoria,
  obtenerCategorias,
  obtenerCategoriaPorId, // ✅ Importado correctamente
  actualizarCategoria,
  eliminarCategoria
} = require('../controllers/categoriaController');

const verificarToken = require('../middlewares/verificarToken');
const esAdminOSuperAdmin = require('../middlewares/esAdminOSuperAdmin');
const uploadCategoria = require('../middlewares/uploadCategoria');

const router = express.Router();

// 🆕 Crear categoría
router.post(
  '/',
  verificarToken,
  uploadCategoria.single('imagen'),
  esAdminOSuperAdmin,
  crearCategoria
);

// 🔁 Actualizar categoría
router.put(
  '/:id',
  verificarToken,
  uploadCategoria.single('imagen'),
  esAdminOSuperAdmin,
  actualizarCategoria
);

// ❌ Eliminar categoría
router.delete(
  '/:id',
  verificarToken,
  esAdminOSuperAdmin,
  eliminarCategoria
);

// 📥 Obtener todas las categorías (acceso público)
router.get('/', obtenerCategorias);

// 🧐 Obtener una categoría por ID
router.get('/:id', obtenerCategoriaPorId);

module.exports = router;
