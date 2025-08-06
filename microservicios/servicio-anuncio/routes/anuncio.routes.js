const router = require("express").Router();
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/anuncioController");
const uploadAnuncio = require('../middlewares/uploadAnuncio'); // Middleware para subir imágenes

// ✅ Obtener hasta 3 anuncios activos (público)
router.get("/activos", ctrl.obtenerActivos);

// ✅ Crear anuncio (requiere auth y subida de imagen)
router.post("/", auth, uploadAnuncio.single("imagen"), ctrl.crearAnuncio);

// ✅ Eliminar anuncio (requiere auth)
router.delete("/:id", auth, ctrl.eliminarAnuncio);

// ✅ Listar productos y categorías (uso interno o admin panel)
router.get("/productos", ctrl.obtenerProductos);     // ⬅️ CORREGIDO
router.get("/categorias", ctrl.obtenerCategorias);   // ⬅️ CORREGIDO

module.exports = router;
