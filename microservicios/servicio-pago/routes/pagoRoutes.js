const express = require("express");
const router = express.Router();
const pagoController = require("../controllers/pagoController");

// POST /api/pagos/confirmar
router.post("/confirmar", pagoController.confirmarPago);

module.exports = router;
