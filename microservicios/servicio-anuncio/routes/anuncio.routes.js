const router = require("express").Router();
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/anuncioController");
const uploadAnuncio = require('../middlewares/uploadAnuncio'); // <- nuevo upload específico

router.get("/activos", ctrl.obtenerActivos);
router.post("/", auth, uploadAnuncio.single("imagen"), ctrl.crearAnuncio);
router.delete("/:id", auth, ctrl.eliminarAnuncio);

module.exports = router;
