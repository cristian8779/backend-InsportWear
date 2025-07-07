const router = require("express").Router();
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/anuncioController");

router.get("/activos", ctrl.obtenerActivos);
router.post("/", auth, ctrl.crearAnuncio);
router.delete("/:id", auth, ctrl.eliminarAnuncio);

module.exports = router;
