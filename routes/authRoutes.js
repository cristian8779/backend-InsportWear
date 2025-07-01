// routes/authRoutes.js
const express = require('express');
const {
  crearUsuario,
  loginUsuario
} = require('../controllers/authController');

const router = express.Router();

// Registro de usuario
router.post('/usuarios', crearUsuario);

// Login de usuario
router.post('/login', loginUsuario);

module.exports = router;
