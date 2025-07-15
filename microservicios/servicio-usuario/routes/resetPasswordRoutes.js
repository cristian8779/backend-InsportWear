const express = require("express");
const {
  enviarCodigoResetPassword,
  verificarCodigoReset,       // ← nombre correcto
  cambiarPasswordConCodigo,   // ← nombre correcto
} = require("../controller/resetPasswordController");

const router = express.Router();

// Enviar código al correo del usuario
router.post("/forgot-password", enviarCodigoResetPassword);

// Verificar que el código sea correcto y no haya expirado
router.post("/verificar-codigo", verificarCodigoReset);

// Restablecer contraseña después de verificar el código
router.post("/reset-password", cambiarPasswordConCodigo);

module.exports = router;
