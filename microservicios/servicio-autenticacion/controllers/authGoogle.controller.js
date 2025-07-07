const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Credenciales = require("../models/Credenciales");
const generarPlantillaBienvenida = require("../utils/plantillaBienvenida");
const resend = require("../config/resend");
require("dotenv").config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const loginGoogle = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      mensaje: "No se recibió el token de Google. Asegúrate de haber iniciado sesión correctamente.",
    });
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
      return res.status(400).json({
        mensaje: "No se pudo obtener el correo electrónico desde el token de Google.",
      });
    }

    let credencial = await Credenciales.findOne({ email });
    let usuario = null;

    if (credencial) {
      if (credencial.metodo !== "google") {
        return res.status(400).json({
          mensaje: "Ya existe una cuenta registrada con este correo usando contraseña. Inicia sesión de forma tradicional.",
        });
      }

      // Buscar usuario desde microservicio por ID de credenciales
      const respuesta = await axios.get(`${process.env.USUARIO_SERVICE_URL}/api/usuario/por-credencial/${credencial._id}`);
      usuario = respuesta.data;
    } else {
      // Crear credencial nueva
      credencial = new Credenciales({
        email,
        password: "GOOGLE_LOGIN",
        rol: "usuario",
        metodo: "google",
      });
      await credencial.save();

      // Crear perfil del usuario
      const respuesta = await axios.post(`${process.env.USUARIO_SERVICE_URL}/api/usuario`, {
        nombre,
        imagenPerfil: picture,
        credenciales: credencial._id,
      });

      usuario = respuesta.data;

      // Enviar correo de bienvenida
      await resend.emails.send({
        from: "Soporte <soporte@soportee.store>",
        to: email,
        subject: "Bienvenido a la plataforma",
        html: generarPlantillaBienvenida(nombre),
      });
    }

    // Firmar token
    const token = jwt.sign(
      { id: credencial._id, rol: credencial.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      mensaje: "Has iniciado sesión correctamente con tu cuenta de Google.",
      token,
      usuario: {
        nombre: usuario.nombre,
        email: credencial.email,
        rol: credencial.rol,
        foto: usuario.imagenPerfil,
      },
    });
  } catch (error) {
    console.error("Error verificando token de Google:", error);
    return res.status(401).json({
      mensaje: "El token de Google no es válido o ha expirado. Intenta iniciar sesión nuevamente.",
      error: error.message,
    });
  }
};

module.exports = {
  loginGoogle,
};
