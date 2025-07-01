const Usuario = require("../models/Usuario");
const Credenciales = require("../models/Credenciales");
const Recuperacion = require("../models/Recuperacion");

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Resend } = require("resend");
const generarPlantillaResetPassword = require("../utils/generarPlantillaResetPassword");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Enviar email de restablecimiento de contraseña
const enviarResetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ mensaje: "El correo es obligatorio" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ mensaje: "Correo electrónico inválido" });
    }

    const credencial = await Credenciales.findOne({ email: email.trim().toLowerCase() });
    if (!credencial) {
      return res.status(404).json({ mensaje: "Correo no encontrado" });
    }

    const usuario = await Usuario.findOne({ credenciales: credencial._id }).populate("recuperacion");

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
      subject: "Restablecer contraseña",
      html: generarPlantillaResetPassword(usuario.nombre || "usuario", token),
    });

    return res.json({ mensaje: "Correo de restablecimiento enviado" });
  } catch (error) {
    console.error("Error en enviarResetPassword:", error);
    return res.status(500).json({ mensaje: "Error al enviar el correo", error: error.message });
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
      return res.status(400).json({ mensaje: "Token inválido o expirado" });
    }

    return res.json({ mensaje: "Token válido" });
  } catch (error) {
    console.error("Error en verificarTokenResetPassword:", error);
    return res.status(500).json({ mensaje: "Error del servidor", error: error.message });
  }
};

// Cambiar la contraseña
const resetearPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { nuevaPassword } = req.body;

    if (!nuevaPassword) {
      return res.status(400).json({ mensaje: "La nueva contraseña es obligatoria" });
    }

    const recuperacion = await Recuperacion.findOne({
      resetToken: token,
      resetTokenExpira: { $gt: Date.now() },
    });

    if (!recuperacion) {
      return res.status(400).json({ mensaje: "Token inválido o expirado" });
    }

    const usuario = await Usuario.findOne({ recuperacion: recuperacion._id }).populate("credenciales");

    if (!usuario || !usuario.credenciales) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(nuevaPassword)) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.credenciales.password = await bcrypt.hash(nuevaPassword, salt);
    await usuario.credenciales.save();

    recuperacion.resetToken = undefined;
    recuperacion.resetTokenExpira = undefined;
    await recuperacion.save();

    return res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error en resetearPassword:", error);
    return res.status(500).json({ mensaje: "Error al restablecer la contraseña", error: error.message });
  }
};

module.exports = {
  enviarResetPassword,
  verificarTokenResetPassword,
  resetearPassword,
};
