const express = require("express");
const router = express.Router();
const { loginGoogle } = require("../controllers/authGoogle.controller");

// Solo define la ruta relativa
router.post("/", loginGoogle);

module.exports = router;
