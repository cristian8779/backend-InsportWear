const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
const Credenciales = require("../models/Credenciales");
const generarPlantillaBienvenida = require("../utils/plantillaBienvenida");
const resend = require("../config/resend");

require("dotenv").config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const loginGoogle = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ mensaje: "El idToken es requerido" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email?.toLowerCase().trim();
    const nombre = payload.name || "Usuario";
    const picture = payload.picture || "";

    if (!email) {
      return res.status(400).json({ mensaje: "No se pudo obtener el correo electrónico del token" });
    }

    let credencial = await Credenciales.findOne({ email });
    let usuario;

    if (credencial) {
      if (credencial.metodo !== "google") {
        return res.status(400).json({
          mensaje: "Este correo ya está registrado con contraseña. Iniciá sesión con correo y contraseña.",
        });
      }

      usuario = await Usuario.findOne({ credenciales: credencial._id });
    } else {
      credencial = new Credenciales({
        email,
        password: "GOOGLE_LOGIN",
        rol: "usuario",
        metodo: "google",
      });
      await credencial.save();

      usuario = new Usuario({
        nombre,
        foto: picture,
        credenciales: credencial._id,
      });
      await usuario.save();

      await resend.emails.send({
        from: "Soporte <soporte@soportee.store>",
        to: email,
        subject: "¡Bienvenido a la plataforma!",
        html: generarPlantillaBienvenida(nombre),
      });
    }

    const token = jwt.sign(
      { id: usuario._id, rol: credencial.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      mensaje: "Inicio de sesión con Google exitoso",
      token,
      usuario: {
        nombre: usuario.nombre,
        email: credencial.email,
        rol: credencial.rol,
        foto: usuario.foto,
      },
    });
  } catch (error) {
    console.error("Error verificando token de Google:", error);
    return res.status(401).json({
      mensaje: "Token de Google inválido",
      error: error.message,
    });
  }
};

module.exports = {
  loginGoogle,
};
