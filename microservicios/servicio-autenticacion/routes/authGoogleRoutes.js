const express = require("express");
const router = express.Router();
const { loginGoogle, checkGoogleUser } = require("../controllers/authGoogle.controller");

// Solo define la ruta relativa
router.post("/", loginGoogle);
router.post('/check', checkGoogleUser);

module.exports = router;