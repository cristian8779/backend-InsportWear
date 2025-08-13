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
      mensaje: "No recibimos el token de Google. Intenta iniciar sesión de nuevo.",
    });
  }

  try {
    // Verificar token de Google
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
        mensaje: "No pudimos obtener tu correo desde Google. Intenta con otra cuenta.",
      });
    }

    let credencial = await Credenciales.findOne({ email });
    let usuario = null;

    if (credencial) {
      // 🔹 Si no tiene campo "metodo" pero su password es GOOGLE_LOGIN, lo actualizamos
      if (!credencial.metodo && credencial.password === "GOOGLE_LOGIN") {
        credencial.metodo = "google";
        await credencial.save();
      }

      // Si el método de registro no fue Google, bloquear
      if (credencial.metodo !== "google") {
        return res.status(400).json({
          mensaje:
            "Este correo ya está registrado con contraseña. Por favor, inicia sesión usando tu correo y contraseña.",
        });
      }

      // Buscar usuario en el microservicio por ID de credenciales
      const respuesta = await axios.get(
    `${process.env.USUARIO_SERVICE_URL}/api/usuario/credencial/${credencial._id}`
   );

      usuario = respuesta.data;
    } else {
      // 🔹 Crear nueva credencial para login con Google
      credencial = new Credenciales({
        email,
        password: "GOOGLE_LOGIN",
        rol: "usuario",
        metodo: "google",
      });
      await credencial.save();

      // Crear perfil del usuario con la imagen de Google
      const respuesta = await axios.post(`${process.env.USUARIO_SERVICE_URL}/api/usuario`, {
        nombre,
        imagenPerfil: picture,
        credenciales: credencial._id,
      });

      usuario = respuesta.data;

      // Enviar correo de bienvenida
      await resend.emails.send({
        from: "InsportWear <soporte@soportee.store>",
        to: email,
        subject: "¡Bienvenido a InsportWear!",
        html: generarPlantillaBienvenida(nombre),
      });
    }

    // Firmar token JWT
    const token = jwt.sign(
        { id: credencial._id, rol: credencial.rol, email: credencial.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      mensaje: "Inicio de sesión exitoso con Google ✅",
      token,
      usuario: {
        nombre: usuario.nombre,
        email: credencial.email,
        rol: credencial.rol,
        foto: usuario.imagenPerfil,
      },
    });
  } catch (error) {
    console.error("❌ Error verificando token de Google:", error);
    return res.status(401).json({
      mensaje:
        "No pudimos iniciar sesión con Google. El token no es válido o ha expirado. Intenta nuevamente.",
      error: error.message,
    });
  }
};

module.exports = {
  loginGoogle,
};
