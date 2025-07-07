const Usuario = require("../models/Usuario");
const Recuperacion = require("../models/Recuperacion");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const axios = require("axios");
const { Resend } = require("resend");
const generarPlantillaResetPassword = require("../utils/generarPlantillaResetPassword");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Enviar email de restablecimiento de contraseña
const enviarResetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ mensaje: "Por favor, ingresa un correo electrónico." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ mensaje: "El correo electrónico no tiene un formato válido." });
    }

    // 🔁 Obtener credencial desde servicio de autenticación
    let credencial;
    try {
      const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/credencial/by-email/${email.trim().toLowerCase()}`);
      credencial = response.data;
    } catch (error) {
      return res.status(404).json({ mensaje: "No encontramos una cuenta asociada a ese correo." });
    }

    const usuario = await Usuario.findOne({ credenciales: credencial._id }).populate("recuperacion");

    if (!usuario) {
      return res.status(404).json({ mensaje: "No pudimos encontrar tu perfil de usuario." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiracion = Date.now() + 10 * 60 * 1000;

    let recuperacion = usuario.recuperacion;

    if (!recuperacion) {
      recuperacion = new Recuperacion();
      await recuperacion.save();
      usuario.recuperacion = recuperacion._id;
      await usuario.save();
    }

    recuperacion.resetToken = token;
    recuperacion.resetTokenExpira = expiracion;
    await recuperacion.save();

    await resend.emails.send({
      from: "soporte@soportee.store",
      to: [credencial.email],
      subject: "Solicitud para restablecer tu contraseña",
      html: generarPlantillaResetPassword(usuario.nombre || "usuario", token),
    });

    return res.json({
      mensaje: "Te enviamos un correo con instrucciones para restablecer tu contraseña. Por favor, revisa tu bandeja de entrada (y la carpeta de spam).",
    });
  } catch (error) {
    console.error("Error en enviarResetPassword:", error);
    return res.status(500).json({ mensaje: "Tuvimos un problema al enviar el correo. Intenta nuevamente más tarde.", error: error.message });
  }
};

// Validar token antes de mostrar formulario de reset
const verificarTokenResetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const recuperacion = await Recuperacion.findOne({
      resetToken: token,
      resetTokenExpira: { $gt: Date.now() },
    });

    if (!recuperacion) {
      return res.status(400).json({
        mensaje: "El enlace de restablecimiento ya no es válido. Solicita uno nuevo desde el formulario.",
      });
    }

    return res.json({ mensaje: "Token válido. Puedes continuar con el cambio de contraseña." });
  } catch (error) {
    console.error("Error en verificarTokenResetPassword:", error);
    return res.status(500).json({ mensaje: "Hubo un problema al verificar el token. Intenta de nuevo.", error: error.message });
  }
};

// Cambiar la contraseña
const resetearPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { nuevaPassword } = req.body;

    if (!nuevaPassword) {
      return res.status(400).json({ mensaje: "Por favor, ingresa una nueva contraseña." });
    }

    const recuperacion = await Recuperacion.findOne({
      resetToken: token,
      resetTokenExpira: { $gt: Date.now() },
    });

    if (!recuperacion) {
      return res.status(400).json({
        mensaje: "Este enlace ya expiró o no es válido. Vuelve a solicitar uno nuevo.",
      });
    }

    const usuario = await Usuario.findOne({ recuperacion: recuperacion._id });

    if (!usuario || !usuario.credenciales) {
      return res.status(404).json({ mensaje: "No se pudo encontrar al usuario asociado al token." });
    }

    // Validar seguridad de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(nuevaPassword)) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener mínimo 8 caracteres, incluyendo una letra mayúscula, una minúscula y un número.",
      });
    }

    try {
      await axios.put(`${process.env.AUTH_SERVICE_URL}/api/auth/credencial/${usuario.credenciales}/password`, {
        nuevaPassword,
      });
    } catch (err) {
      return res.status(500).json({ mensaje: "No se pudo actualizar la contraseña. Intenta nuevamente." });
    }

    // Limpiar token usado
    recuperacion.resetToken = undefined;
    recuperacion.resetTokenExpira = undefined;
    await recuperacion.save();

    return res.json({ mensaje: "¡Tu contraseña ha sido actualizada con éxito! Ya puedes iniciar sesión con ella." });
  } catch (error) {
    console.error("Error en resetearPassword:", error);
    return res.status(500).json({ mensaje: "Hubo un error al procesar tu solicitud. Inténtalo de nuevo más tarde.", error: error.message });
  }
};

module.exports = {
  enviarResetPassword,
  verificarTokenResetPassword,
  resetearPassword,
};
