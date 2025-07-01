const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
const Credenciales = require("../models/Credenciales");
const generarPlantillaBienvenida = require("../utils/plantillaBienvenida");
const resend = require("../config/resend");

require("dotenv").config();

// Crear usuario (registro)
const crearUsuario = async (req, res) => {
  try {
    let { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ mensaje: "Correo electrónico no válido" });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[A-Z])(?=.*[a-z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.",
      });
    }

    // 🚨 Permitir solo el primer superAdmin
    if (rol === "superAdmin") {
      const yaExisteSuperAdmin = await Credenciales.findOne({ rol: "superAdmin" });
      if (yaExisteSuperAdmin) {
        return res.status(403).json({
          mensaje: "Ya existe un superAdmin. Usa la invitación de cambio de rol para crear otro.",
        });
      }
    }

    const credencialExistente = await Credenciales.findOne({ email });
    if (credencialExistente) {
      return res.status(400).json({ mensaje: "El usuario ya existe" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevaCredencial = new Credenciales({
      email,
      password: passwordHash,
      rol: rol || "usuario"
    });
    await nuevaCredencial.save();

    const nuevoUsuario = new Usuario({
      nombre: nombre.trim(),
      credenciales: nuevaCredencial._id
    });
    await nuevoUsuario.save();

    await resend.emails.send({
      from: "Soporte <soporte@soportee.store>",
      to: email,
      subject: "¡Registro exitoso!",
      html: generarPlantillaBienvenida(nombre.trim()),
    });

    const token = jwt.sign(
      { id: nuevoUsuario._id, rol: nuevaCredencial.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      mensaje: "Usuario creado",
      usuario: {
        nombre: nuevoUsuario.nombre,
        email: nuevaCredencial.email,
        rol: nuevaCredencial.rol,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al registrar usuario", error: error.message });
  }
};

// Login
const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
    }

    const emailLimpio = email.trim().toLowerCase();
    const credencial = await Credenciales.findOne({ email: emailLimpio });

    if (!credencial) {
      return res.status(400).json({ mensaje: "Usuario no encontrado" });
    }

    const esPasswordValido = await bcrypt.compare(password, credencial.password);
    if (!esPasswordValido) {
      return res.status(400).json({ mensaje: "Contraseña incorrecta" });
    }

    const usuario = await Usuario.findOne({ credenciales: credencial._id });

    const token = jwt.sign(
      { id: usuario._id, rol: credencial.rol },
      process.env.JWT_SECRET,
      { expiresIn: credencial.rol === "admin" ? "30d" : "1h" }
    );

    res.json({
      mensaje: "Login exitoso",
      token,
      usuario: {
        nombre: usuario.nombre,
        email: credencial.email,
        rol: credencial.rol,
      },
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el login", error: error.message });
  }
};

// Middleware para verificar token
const verificarToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ mensaje: "Acceso denegado. Token no proporcionado." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(403).json({ mensaje: "Token inválido o expirado" });
  }
};

module.exports = {
  crearUsuario,
  loginUsuario,
  verificarToken,
};
