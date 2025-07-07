const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Credenciales = require("../models/Credenciales");
const resend = require("../config/resend");
require("dotenv").config();
const generarPlantillaBienvenida = require("../utils/plantillaBienvenida");
const { actualizarRolDeUsuario } = require("../services/gestionRolesService"); // 👉 Importamos el servicio

// ✅ Registrar nuevo usuario
const registrar = async (req, res) => {
  try {
    const { email, password, rol, nombre } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({
        mensaje: "Para registrarte necesitas proporcionar tu nombre, correo electrónico y una contraseña válida.",
      });
    }

    const emailLimpio = email.trim().toLowerCase();
    const existe = await Credenciales.findOne({ email: emailLimpio });
    if (existe) {
      return res.status(400).json({
        mensaje: "Ya existe una cuenta registrada con este correo. Intenta iniciar sesión o usar otro correo.",
      });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[A-Z])(?=.*[a-z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula y un número.",
      });
    }

    if (rol === "superAdmin") {
      const yaHay = await Credenciales.findOne({ rol: "superAdmin" });
      if (yaHay) {
        return res.status(403).json({
          mensaje: "Ya existe un superadministrador registrado en el sistema. Solo puede haber uno.",
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

    // Validar URL de microservicio
    if (!process.env.USUARIO_SERVICE_URL) {
      console.error("❌ USUARIO_SERVICE_URL no está definida");
      return res.status(500).json({ mensaje: "Error interno de configuración." });
    }

    // Crear perfil de usuario en el microservicio
    let usuarioCreado;
    try {
      const url = `${process.env.USUARIO_SERVICE_URL}/api/perfil`;
      console.log("📡 POST ->", url);

      const respuesta = await axios.post(url, {
        nombre: nombre.trim(),
        credenciales: nuevaCredencial._id,
      });

      usuarioCreado = respuesta.data;
    } catch (error) {
      console.error("❌ Error al crear perfil de usuario:", error.message);
      await Credenciales.findByIdAndDelete(nuevaCredencial._id); // rollback
      return res.status(500).json({
        mensaje: "Ocurrió un problema al completar el registro. Intenta nuevamente en unos minutos.",
      });
    }

    // Enviar correo de bienvenida
    try {
      await resend.emails.send({
        from: "Soporte <soporte@soportee.store>",
        to: emailLimpio,
        subject: "Bienvenido a la plataforma",
        html: generarPlantillaBienvenida(nombre),
      });
    } catch (error) {
      console.error("⚠️ Error al enviar correo de bienvenida:", error.message);
    }

    const token = jwt.sign(
      { id: usuarioCreado._id, rol: nuevaCredencial.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      mensaje: "Tu cuenta fue creada exitosamente.",
      token,
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
        mensaje: "Por favor, ingresa tanto tu correo electrónico como tu contraseña para iniciar sesión.",
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

    // Validar URL
    if (!process.env.USUARIO_SERVICE_URL) {
      return res.status(500).json({ mensaje: "Error de configuración del servidor." });
    }

    let usuario;
    try {
      const url = `${process.env.USUARIO_SERVICE_URL}/api/usuario/credencial/${credencial._id}`;
      console.log("📡 GET ->", url);

      const respuesta = await axios.get(url);
      usuario = respuesta.data;
    } catch (error) {
      console.error("❌ Error al obtener perfil del usuario:", error.message);
      return res.status(500).json({
        mensaje: "No se pudo acceder al perfil del usuario. Intenta nuevamente más tarde.",
      });
    }

    const token = jwt.sign(
      { id: usuario._id, rol: credencial.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      mensaje: "Has iniciado sesión correctamente.",
      token,
      usuario: {
        nombre: usuario.nombre,
        email: credencial.email,
        rol: credencial.rol,
      },
    });
  } catch (err) {
    console.error("❌ Error general en login:", err.message);
    res.status(500).json({
      mensaje: "Ocurrió un error al intentar iniciar sesión. Por favor, vuelve a intentarlo más tarde.",
    });
  }
};

// ✅ Verificar token JWT
const verificarToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ mensaje: "No se ha proporcionado un token de acceso." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      mensaje: "El token es inválido o ha expirado. Por favor, inicia sesión nuevamente.",
    });
  }
};

// ✅ Obtener credencial por ID (usada por microservicio)
const obtenerCredencialPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const credencial = await Credenciales.findById(id).select("email rol");

    if (!credencial) {
      return res.status(404).json({ mensaje: "No se encontró ninguna credencial con ese ID." });
    }

    res.json(credencial);
  } catch (error) {
    console.error("❌ Error al obtener credencial:", error.message);
    res.status(500).json({ mensaje: "Error interno al consultar la credencial." });
  }
};

// ✅ Cambiar rol de un usuario por email (usado por microservicio de rol)
const cambiarRolUsuarioPorCorreo = async (req, res) => {
  const { email, nuevoRol } = req.body;
  const rolSolicitante = req.usuario?.rol;

  if (!email || !nuevoRol) {
    return res.status(400).json({ mensaje: "Faltan campos requeridos: email y nuevoRol." });
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
  verificarToken,
  obtenerCredencialPorId,
  cambiarRolUsuarioPorCorreo, // 👈 ¡Nuevo export listo para usarse!
};
