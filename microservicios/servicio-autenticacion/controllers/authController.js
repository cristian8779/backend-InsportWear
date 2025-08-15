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
        mensaje: "Por favor, asegúrate de completar todos los campos: nombre, correo electrónico y contraseña.",
      });
    }

    const emailLimpio = email.trim().toLowerCase();
    const existe = await Credenciales.findOne({ email: emailLimpio });
    if (existe) {
      return res.status(400).json({
        mensaje: "Este correo ya está registrado. Si ya tienes cuenta, por favor inicia sesión o usa otro correo.",
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
      return res.status(500).json({ mensaje: "Error interno del servidor. Estamos trabajando para solucionarlo." });
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
        mensaje: "Tuvimos un inconveniente al crear tu perfil. Por favor intenta registrarte nuevamente.",
      });
    }

    try {
      await resend.emails.send({
        from: "InsportWear <soporte@soportee.store>",
        to: emailLimpio,
        subject: "Bienvenido a InsportWear",
        html: generarPlantillaBienvenida(nombre),
      });
    } catch (error) {
      console.warn("⚠️ Error al enviar correo de bienvenida:", error.message);
    }

    // ✅ Incluir nombre y email en el token
    const accessToken = jwt.sign(
      { 
        id: usuarioCreado._id, 
        nombre: usuarioCreado.nombre, // ✅ Agregar nombre
        email: emailLimpio, 
        rol: nuevaCredencial.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
      { 
        id: usuarioCreado._id, 
        nombre: usuarioCreado.nombre, // ✅ Agregar nombre
        email: emailLimpio, 
        rol: nuevaCredencial.rol 
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    nuevaCredencial.refreshToken = refreshToken;
    await nuevaCredencial.save();

    res.status(201).json({
      mensaje: "¡Tu cuenta ha sido creada con éxito! 🎉",
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
      mensaje: "Ups... Ocurrió un error al crear tu cuenta. Por favor, intenta nuevamente más tarde.",
    });
  }
};

// ✅ Iniciar sesión
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        mensaje: "Por favor, ingresa tu correo y contraseña.",
      });
    }

    const credencial = await Credenciales.findOne({ email: email.trim().toLowerCase() });
    if (!credencial) {
      return res.status(400).json({ mensaje: "Correo o contraseña incorrectos. Verifica e intenta nuevamente." });
    }

    const esValida = await bcrypt.compare(password, credencial.password);
    if (!esValida) {
      return res.status(400).json({ mensaje: "Correo o contraseña incorrectos. Intenta nuevamente." });
    }

    if (!process.env.USUARIO_SERVICE_URL) {
      return res.status(500).json({ mensaje: "Error interno del servidor. Vuelve a intentarlo más tarde." });
    }

    let usuario;
    try {
      const url = `${process.env.USUARIO_SERVICE_URL}/api/usuario/credencial/${credencial._id}`;
      const respuesta = await axios.get(url);
      usuario = respuesta.data;
    } catch (error) {
      return res.status(500).json({
        mensaje: "No pudimos acceder a tu perfil en este momento. Intenta más tarde.",
      });
    }

    // ✅ Incluir nombre y email en el token
    const accessToken = jwt.sign(
      { 
        id: usuario._id, 
        nombre: usuario.nombre, // ✅ Agregar nombre
        email: credencial.email, 
        rol: credencial.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
      { 
        id: usuario._id, 
        nombre: usuario.nombre, // ✅ Agregar nombre
        email: credencial.email, 
        rol: credencial.rol 
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    credencial.refreshToken = refreshToken;
    await credencial.save();

    res.json({
      mensaje: "¡Inicio de sesión exitoso! 👋",
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
      return res.status(400).json({ mensaje: "Token de sesión no proporcionado." });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const credencial = await Credenciales.findById(decoded.id);

    if (!credencial || credencial.refreshToken !== refreshToken) {
      return res.status(403).json({
        mensaje: "Tu sesión no es válida. Por favor, vuelve a iniciar sesión.",
      });
    }

    // ✅ Mantener nombre y email en el nuevo token
    const nuevoAccessToken = jwt.sign(
      { 
        id: decoded.id, 
        nombre: decoded.nombre, // ✅ Mantener nombre
        email: decoded.email, 
        rol: decoded.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      mensaje: "Sesión renovada exitosamente.",
      accessToken: nuevoAccessToken,
    });
  } catch (err) {
    console.error("❌ Error al renovar token:", err.message);
    res.status(403).json({ mensaje: "Tu sesión ha expirado. Inicia sesión nuevamente para continuar." });
  }
};

// ✅ Verificar token JWT
const verificarToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  
  console.log(`🔑 [verificarToken] Token recibido: ${token}`);
  
  if (!token) {
    return res.status(401).json({ mensaje: "Acceso no autorizado. Inicia sesión para continuar." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ [verificarToken] Token verificado. Payload:`, decoded);
    
    req.usuario = decoded; // Ahora incluirá id, nombre, email y rol
    next();
  } catch (err) {
    console.error(`🚫 [verificarToken] Error:`, err.message);
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
      return res.status(404).json({ mensaje: "No encontramos una cuenta con ese ID." });
    }

    res.json(credencial);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudo obtener la información. Intenta más tarde." });
  }
};

// ✅ Verificar si un email ya está registrado
const emailExiste = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ mensaje: "Por favor, proporciona un correo válido." });
    }

    const emailLimpio = email.trim().toLowerCase();
    const credencial = await Credenciales.findOne({ email: emailLimpio });

    return res.status(200).json(
      credencial
        ? {
            existe: true,
            mensaje: "Ya existe una cuenta registrada con este correo electrónico. Si ya tienes una cuenta, inicia sesión."
          }
        : { existe: false }
    );
  } catch (error) {
    console.error("❌ Error verificando email:", error.message);
    res.status(500).json({ mensaje: "Hubo un error al verificar el correo. Intenta más tarde." });
  }
};

module.exports = {
  registrar,
  login,
  renovarToken,
  verificarToken,
  obtenerCredencialPorId,
  emailExiste,
};
