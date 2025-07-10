const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Credenciales = require("../models/Credenciales");
const resend = require("../config/resend");
require("dotenv").config();
const generarPlantillaBienvenida = require("../utils/plantillaBienvenida");
const { actualizarRolDeUsuario } = require("../services/gestionRolesService");

// ✅ Registrar nuevo usuario
const registrar = async (req, res) => {
  try {
    const { email, password, rol, nombre } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({
        mensaje: "Por favor completa todos los campos: nombre, correo electrónico y contraseña.",
      });
    }

    const emailLimpio = email.trim().toLowerCase();
    const existe = await Credenciales.findOne({ email: emailLimpio });
    if (existe) {
      return res.status(400).json({
        mensaje: "Ya existe una cuenta registrada con este correo. Intenta iniciar sesión o utiliza otro correo.",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula y un número.",
      });
    }

    if (rol === "superAdmin") {
      const yaHay = await Credenciales.findOne({ rol: "superAdmin" });
      if (yaHay) {
        return res.status(403).json({
          mensaje: "Ya existe un superadministrador en el sistema. Solo puede haber uno.",
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const nuevaCredencial = new Credenciales({
      email: emailLimpio,
      password: passwordHash,
      rol: rol || "usuario",
    });

    await nuevaCredencial.save();

    if (!process.env.USUARIO_SERVICE_URL) {
      console.error("❌ USUARIO_SERVICE_URL no está definida");
      return res.status(500).json({ mensaje: "Error interno de configuración del servidor." });
    }

    let usuarioCreado;
    try {
      const url = `${process.env.USUARIO_SERVICE_URL}/api/perfil`;
      const respuesta = await axios.post(url, {
        nombre: nombre.trim(),
        credenciales: nuevaCredencial._id,
      });

      usuarioCreado = respuesta.data;
    } catch (error) {
      await Credenciales.findByIdAndDelete(nuevaCredencial._id);
      return res.status(500).json({
        mensaje: "Ocurrió un problema al crear tu perfil. Intenta registrarte nuevamente.",
      });
    }

    try {
      await resend.emails.send({
        from: "Soporte <soporte@soportee.store>",
        to: emailLimpio,
        subject: "Bienvenido a la plataforma",
        html: generarPlantillaBienvenida(nombre),
      });
    } catch (error) {
      console.warn("⚠️ Error al enviar correo de bienvenida:", error.message);
    }

    const accessToken = jwt.sign(
      { id: usuarioCreado._id, rol: nuevaCredencial.rol },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: usuarioCreado._id, rol: nuevaCredencial.rol },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    nuevaCredencial.refreshToken = refreshToken;
    await nuevaCredencial.save();

    res.status(201).json({
      mensaje: "Tu cuenta fue creada exitosamente.",
      accessToken,
      refreshToken,
      usuario: {
        nombre: usuarioCreado.nombre,
        email: nuevaCredencial.email,
        rol: nuevaCredencial.rol,
      },
    });
  } catch (err) {
    console.error("❌ Error general en registro:", err.message);
    res.status(500).json({
      mensaje: "Ocurrió un error al registrar tu cuenta. Intenta nuevamente más tarde.",
    });
  }
};

// ✅ Iniciar sesión
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        mensaje: "Por favor, ingresa tu correo electrónico y contraseña.",
      });
    }

    const credencial = await Credenciales.findOne({ email: email.trim().toLowerCase() });
    if (!credencial) {
      return res.status(400).json({ mensaje: "Correo o contraseña incorrectos." });
    }

    const esValida = await bcrypt.compare(password, credencial.password);
    if (!esValida) {
      return res.status(400).json({ mensaje: "Correo o contraseña incorrectos." });
    }

    if (!process.env.USUARIO_SERVICE_URL) {
      return res.status(500).json({ mensaje: "Error de configuración del servidor." });
    }

    let usuario;
    try {
      const url = `${process.env.USUARIO_SERVICE_URL}/api/usuario/credencial/${credencial._id}`;
      const respuesta = await axios.get(url);
      usuario = respuesta.data;
    } catch (error) {
      return res.status(500).json({
        mensaje: "No se pudo acceder a tu perfil. Intenta nuevamente más tarde.",
      });
    }

    const accessToken = jwt.sign(
      { id: usuario._id, rol: credencial.rol },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: usuario._id, rol: credencial.rol },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    credencial.refreshToken = refreshToken;
    await credencial.save();

    res.json({
      mensaje: "Has iniciado sesión correctamente.",
      accessToken,
      refreshToken,
      usuario: {
        nombre: usuario.nombre,
        email: credencial.email,
        rol: credencial.rol,
      },
    });
  } catch (err) {
    console.error("❌ Error general en login:", err.message);
    res.status(500).json({
      mensaje: "Ocurrió un error al iniciar sesión. Por favor, intenta nuevamente.",
    });
  }
};

// ✅ Renovar token
const renovarToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ mensaje: "No se proporcionó el token de renovación." });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const credencial = await Credenciales.findById(decoded.id);

    if (!credencial || credencial.refreshToken !== refreshToken) {
      return res.status(403).json({
        mensaje: "Token inválido. Por favor, vuelve a iniciar sesión.",
      });
    }

    const nuevoAccessToken = jwt.sign(
      { id: decoded.id, rol: decoded.rol },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      mensaje: "Tu sesión ha sido renovada correctamente.",
      accessToken: nuevoAccessToken,
    });
  } catch (err) {
    console.error("❌ Error al renovar token:", err.message);
    res.status(403).json({ mensaje: "Token expirado o inválido. Inicia sesión nuevamente." });
  }
};

// ✅ Verificar token JWT
const verificarToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ mensaje: "No tienes autorización para acceder a este recurso." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      mensaje: "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.",
    });
  }
};

// ✅ Obtener credencial por ID
const obtenerCredencialPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const credencial = await Credenciales.findById(id).select("email rol");

    if (!credencial) {
      return res.status(404).json({ mensaje: "No se encontró ninguna credencial con ese ID." });
    }

    res.json(credencial);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudo consultar la información solicitada." });
  }
};

// ✅ Cambiar rol de un usuario por correo
const cambiarRolUsuarioPorCorreo = async (req, res) => {
  const { email, nuevoRol } = req.body;
  const rolSolicitante = req.usuario?.rol;

  if (!email || !nuevoRol) {
    return res.status(400).json({ mensaje: "Debes proporcionar el correo del usuario y el nuevo rol." });
  }

  const resultado = await actualizarRolDeUsuario({ email, nuevoRol, rolSolicitante });

  return res.status(resultado.status).json({
    ok: resultado.ok,
    mensaje: resultado.mensaje,
    ...(resultado.error && { error: resultado.error }),
  });
};

module.exports = {
  registrar,
  login,
  renovarToken,
  verificarToken,
  obtenerCredencialPorId,
  cambiarRolUsuarioPorCorreo,
};
