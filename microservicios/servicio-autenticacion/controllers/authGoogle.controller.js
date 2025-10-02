const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Credenciales = require("../models/Credenciales");
const generarPlantillaBienvenida = require("../utils/plantillaBienvenida");
const resend = require("../config/resend");
require("dotenv").config();

// ✅ CRITICAL: Debe coincidir con Flutter (GOOGLE_CLIENT_ID_WEB)
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID_WEB);

console.log('🔑 Google Client ID configurado:', process.env.GOOGLE_CLIENT_ID_WEB ? 'SI' : 'NO');

// Endpoint para verificar si un usuario existe sin crearlo
const checkGoogleUser = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      mensaje: "Token requerido para verificación",
    });
  }

  try {
    // Verificar token de Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID_WEB, // ✅ Usar la misma variable
    });

    const payload = ticket.getPayload();
    const email = payload.email?.toLowerCase().trim();

    if (!email) {
      return res.status(400).json({
        mensaje: "No se pudo obtener el email del token",
      });
    }

    // Verificar si existe credencial con este email
    const credencial = await Credenciales.findOne({ email });
    
    return res.json({
      exists: !!credencial,
      email: email
    });

  } catch (error) {
    console.error("❌ Error verificando usuario Google:", error);
    return res.status(400).json({
      mensaje: "Token inválido",
      error: error.message,
    });
  }
};

const loginGoogle = async (req, res) => {
  const { idToken, terminosAceptados } = req.body;

  if (!idToken) {
    return res.status(400).json({
      mensaje: "No recibimos el token de Google. Intenta iniciar sesión de nuevo.",
    });
  }

  try {
    console.log('🔍 Verificando token de Google...');
    console.log('Token (primeros 30):', idToken.substring(0, 30));
    console.log('Client ID usado:', process.env.GOOGLE_CLIENT_ID_WEB);
    
    // ✅ Verificar token de Google con la variable correcta
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID_WEB, // ✅ CRITICAL: Debe coincidir con Flutter
    });

    const payload = ticket.getPayload();
    console.log('✅ Token verificado exitosamente para:', payload.email);
    
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
    let esUsuarioNuevo = false;

    if (credencial) {
      // Usuario existente
      console.log('👤 Usuario existente encontrado:', email);
      
      // Si no tiene campo "metodo" pero su password es GOOGLE_LOGIN, lo actualizamos
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
      // Usuario nuevo - verificar términos aceptados
      esUsuarioNuevo = true;
      console.log('🆕 Usuario nuevo detectado:', email);
      
      if (!terminosAceptados) {
        console.log('⚠️ Términos no aceptados, solicitando aceptación');
        return res.status(400).json({
          mensaje: "Debes aceptar los términos y condiciones para crear una cuenta nueva.",
          requiereTerminos: true
        });
      }

      console.log('✅ Términos aceptados, creando nueva cuenta...');

      // Crear nueva credencial para login con Google
      credencial = new Credenciales({
        email,
        password: "GOOGLE_LOGIN",
        rol: "usuario",
        metodo: "google",
        terminosAceptados: true,
        fechaAceptacionTerminos: new Date()
      });
      await credencial.save();

      // Crear perfil del usuario con la imagen de Google
      const respuesta = await axios.post(`${process.env.USUARIO_SERVICE_URL}/api/usuario`, {
        nombre,
        imagenPerfil: picture,
        credenciales: credencial._id,
        terminosAceptados: true,
        fechaAceptacionTerminos: new Date()
      });

      usuario = respuesta.data;
      console.log('✅ Usuario creado exitosamente:', usuario._id);

      // Enviar correo de bienvenida solo para usuarios nuevos
      try {
        await resend.emails.send({
          from: "InsportWear <soporte@soportee.store>",
          to: email,
          subject: "¡Bienvenido a InsportWear!",
          html: generarPlantillaBienvenida(nombre),
        });
        console.log('📧 Email de bienvenida enviado');
      } catch (emailError) {
        console.error("⚠️ Error enviando email de bienvenida:", emailError);
        // No fallar el registro por error de email
      }
    }

    // Firmar tokens igual que en registrar/login
    const accessToken = jwt.sign(
      {
        id: usuario._id, // usar ID del perfil
        nombre: usuario.nombre,
        email: credencial.email,
        rol: credencial.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
      {
        id: usuario._id,
        nombre: usuario.nombre,
        email: credencial.email,
        rol: credencial.rol,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Guardar refreshToken en credencial
    credencial.refreshToken = refreshToken;
    await credencial.save();

    const mensajeExito = esUsuarioNuevo 
      ? "Registro exitoso con Google ✅ ¡Bienvenido a InsportWear!"
      : "Inicio de sesión exitoso con Google ✅";

    console.log('✅ Login Google completado exitosamente');

    return res.json({
      mensaje: mensajeExito,
      token: accessToken, // ✅ También enviar como "token" para compatibilidad
      accessToken,
      refreshToken,
      esUsuarioNuevo,
      usuario: {
        nombre: usuario.nombre,
        email: credencial.email,
        rol: credencial.rol,
        foto: usuario.imagenPerfil,
      },
    });
  } catch (error) {
    console.error("❌ Error completo en loginGoogle:", error);
    console.error("Stack trace:", error.stack);
    
    return res.status(401).json({
      mensaje:
        "No pudimos iniciar sesión con Google. El token no es válido o ha expirado. Intenta nuevamente.",
      error: error.message,
    });
  }
};

module.exports = {
  loginGoogle,
  checkGoogleUser,
};