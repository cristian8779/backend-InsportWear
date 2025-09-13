const express = require("express");
const router = express.Router();
const pagoController = require("../controllers/pagoController");
const { authMiddleware } = require("../middlewares/auth");


// POST /api/pagos/confirmar
router.post("/confirmar", authMiddleware, pagoController.confirmarPago);

module.exports = router;
