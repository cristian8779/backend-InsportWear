const express = require("express");
const router = express.Router();
const { loginGoogle } = require("../controllers/login.controller");

router.post("/auth/google", loginGoogle);

module.exports = router;
