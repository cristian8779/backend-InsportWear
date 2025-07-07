const router = require("express").Router();
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/anuncioController");
const upload = require('../middlewares/upload');


router.get("/activos", ctrl.obtenerActivos);
router.post("/", auth, upload.single("imagen"), ctrl.crearAnuncio);
router.delete("/:id", auth, ctrl.eliminarAnuncio);

module.exports = router;
