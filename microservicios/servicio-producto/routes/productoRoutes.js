const express = require('express');
const {
    crearProducto,
    obtenerProductos,
    obtenerProductoPorId,
    obtenerProductosPorCategoria,
    actualizarProducto,
    eliminarProducto,
    reducirStock, // Esto es para el stock del producto principal
    // ⚠️ reducirStockVariacion no debe venir de productoController, sino de variacionController
} = require('../controllers/productoController');

const {
    agregarVariacion,
    obtenerVariaciones,
    eliminarVariacion,
    actualizarVariacion,
    reducirStockVariacion // ✅ Esta sí es del variacionController
} = require('../controllers/variacionController'); // Asegúrate de importar tu controlador de variaciones aquí

const verificarToken = require('../middlewares/verificarToken');
const uploadProducto = require('../middlewares/upload'); // Renombrado para claridad, si solo maneja productos
const uploadVariaciones = require('../middlewares/uploadVariaciones'); // ✅ Este es el middleware para múltiples imágenes de variaciones

const router = express.Router();

// ---
// 🔐 Middleware de Verificación de Roles
// Este middleware nos ayuda a asegurar que solo los usuarios 'admin' o 'superAdmin'
// puedan realizar ciertas acciones importantes, como crear o modificar productos.
// ---
const verificarAdminOsuperAdmin = (req, res, next) => {
    // Si el usuario no está logueado (no hay req.usuario) o su rol no es admin/superAdmin,
    // le negamos el acceso.
    if (!req.usuario || !['admin', 'superAdmin'].includes(req.usuario.rol)) {
        console.log('⛔ Intento de acceso denegado: Usuario no tiene permisos de administrador.');
        return res.status(403).json({ mensaje: '⛔ No tienes permisos para realizar esta acción. ¡Acceso solo para administradores!' });
    }
    // Si todo está bien, le permitimos continuar.
    next();
};

// ---
// 🖼️ Ruta para subir imágenes directamente a Cloudinary (para productos o uso general si aplica)
// Esta ruta es útil si quieres probar la subida de una sola imagen o si tienes un módulo de carga de imágenes separado.
// ---
router.post('/upload-imagen-producto', verificarToken, verificarAdminOsuperAdmin, uploadProducto.single('imagen'), (req, res) => {
    if (req.file) {
        console.log('✅ Imagen subida correctamente a Cloudinary.');
        return res.status(200).json({ mensaje: '✅ ¡Imagen de producto subida con éxito!', url: req.file.path });
    } else {
        console.log('⚠️ No se seleccionó ninguna imagen para subir.');
        return res.status(400).json({ mensaje: '⚠️ ¡Uy! No se ha subido ninguna imagen. Asegúrate de seleccionarla.' });
    }
});


// ---
// 📦 Rutas para la gestión de Productos (la entidad principal)
// Estas rutas manejan la creación, visualización, actualización y eliminación de tus productos base.
// ---

// ➕ Crear un nuevo producto: Requiere token, permisos de admin y una imagen.
router.post('/', verificarToken, verificarAdminOsuperAdmin, uploadProducto.single('imagen'), crearProducto);
console.log('Ruta POST /: Configurada para crear productos (Admin requerido, con imagen).');

// 📄 Obtener todos los productos: Cualquiera puede verlos.
router.get('/', obtenerProductos);
console.log('Ruta GET /: Configurada para obtener todos los productos (Acceso público).');

// 🔍 Obtener productos por categoría: Cualquiera puede verlos.
// Esta ruta debe ir antes de '/:id' para que Express no confunda 'por-categoria' con un ID.
router.get('/por-categoria/:id', obtenerProductosPorCategoria);
console.log('Ruta GET /por-categoria/:id: Configurada para obtener productos por categoría (Acceso público).');

// 👁️ Obtener un producto por su ID: Cualquiera puede ver los detalles de un producto específico.
// Esta debe ir después de las rutas más específicas para evitar conflictos.
router.get('/:id', obtenerProductoPorId);
console.log('Ruta GET /:id: Configurada para obtener un producto específico por ID (Acceso público).');

// 🔄 Actualizar un producto existente: Requiere token, permisos de admin y una imagen (opcional).
router.put('/:id', verificarToken, verificarAdminOsuperAdmin, uploadProducto.single('imagen'), actualizarProducto);
console.log('Ruta PUT /:id: Configurada para actualizar productos (Admin requerido, imagen opcional).');

// 🗑️ Eliminar un producto: Requiere token y permisos de admin.
router.delete('/:id', verificarToken, verificarAdminOsuperAdmin, eliminarProducto);
console.log('Ruta DELETE /:id: Configurada para eliminar productos (Admin requerido).');

// ---
// 📉 Rutas para el Stock del Producto Principal
// Estas rutas son para ajustar el stock del producto general (no de sus variaciones).
// Son ideales para que un microservicio de ventas o un carrito actualice las cantidades.
// ---

// Reducir stock general de un producto: No requiere admin, pero sí un sistema autorizado.
// Aquí no agregué 'verificarToken' porque usualmente los microservicios manejan su propia autenticación interna
// o se integran de forma segura de otra manera. Si tu microservicio de ventas NO usa token, déjalo así.
// Si SÍ usa token, puedes añadir 'verificarToken'.
router.put('/:id/reducir-stock', reducirStock);
console.log('Ruta PUT /:id/reducir-stock: Configurada para reducir stock del producto principal (Ideal para microservicios).');


// ---
// 👕 Rutas para la gestión de Variaciones de Producto
// Estas rutas manejan la adición, visualización, actualización y eliminación de las variantes
// (ej. tallas, colores) de un producto específico.
// ---

// ➕ Agregar una variación a un producto: Requiere token, permisos de admin y permite múltiples imágenes.
router.post('/:productoId/variaciones', verificarToken, verificarAdminOsuperAdmin, uploadVariaciones, agregarVariacion);
console.log('Ruta POST /:productoId/variaciones: Configurada para añadir variaciones (Admin requerido, soporta múltiples imágenes).');

// 📄 Obtener todas las variaciones de un producto: Cualquiera puede verlas y filtrarlas.
router.get('/:productoId/variaciones', obtenerVariaciones);
console.log('Ruta GET /:productoId/variaciones: Configurada para obtener y filtrar variaciones (Acceso público).');

// 🔄 Actualizar una variación específica de un producto: Requiere token, permisos de admin, soporta imágenes.
router.put('/:productoId/variaciones/:id', verificarToken, verificarAdminOsuperAdmin, uploadVariaciones, actualizarVariacion);
console.log('Ruta PUT /:productoId/variaciones/:id: Configurada para actualizar variaciones (Admin requerido, soporta imágenes).');

// 🗑️ Eliminar una variación específica de un producto: Requiere token y permisos de admin.
router.delete('/:productoId/variaciones/:id', verificarToken, verificarAdminOsuperAdmin, eliminarVariacion);
console.log('Ruta DELETE /:productoId/variaciones/:id: Configurada para eliminar variaciones (Admin requerido).');

// 📉 Reducir stock de una variación específica: No requiere admin.
router.put('/:productoId/variaciones/:id/reducir-stock', reducirStockVariacion);
console.log('Ruta PUT /:productoId/variaciones/:id/reducir-stock: Configurada para reducir stock de una variación específica (Ideal para microservicios/carrito).');

// Nueva ruta para agregar una variación a un producto


module.exports = router;