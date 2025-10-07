const router = require("express").Router();
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/anuncioController");
const uploadAnuncio = require('../middlewares/uploadAnuncio');

// ✅ RUTAS PÚBLICAS
// Obtener anuncios activos para mostrar en la app
router.get("/activos", ctrl.obtenerActivos);

// ✅ RUTAS DE ADMINISTRACIÓN (requieren autenticación)
// Obtener todos los anuncios con filtros (activo, programado, expirado)
router.get("/", auth, ctrl.obtenerTodos);

// Crear anuncio (requiere auth y subida de imagen)
router.post("/", auth, uploadAnuncio.single("imagen"), ctrl.crearAnuncio);

// Eliminar anuncio (requiere auth)
router.delete("/:id", auth, ctrl.eliminarAnuncio);

// ✅ RUTAS PARA OBTENER PRODUCTOS Y CATEGORÍAS
router.get("/productos", ctrl.obtenerProductos);
router.get("/categorias", ctrl.obtenerCategorias);

module.exports = router;