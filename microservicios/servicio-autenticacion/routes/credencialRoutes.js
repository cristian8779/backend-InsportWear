const express = require("express");
const {
  obtenerCredencialPorEmail,
  actualizarPassword
} = require("../controllers/credencialController");

const router = express.Router();

router.get("/by-email/:email", obtenerCredencialPorEmail);
router.put("/:id/password", actualizarPassword);

module.exports = router;
