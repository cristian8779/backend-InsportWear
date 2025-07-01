// routes/resetPasswordRoutes.js
const express = require("express");
const {
  enviarResetPassword,
  resetearPassword,
  verificarTokenResetPassword,
} = require("../controllers/resetPasswordController");

const router = express.Router();

// Password reset routes
router.post("/forgot-password", enviarResetPassword);
router.get("/reset-password/:token", verificarTokenResetPassword);
router.post("/reset-password/:token", resetearPassword);

module.exports = router;
