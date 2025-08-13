const Usuario = require("../models/Usuario");
const Recuperacion = require("../models/Recuperacion");
const axios = require("axios");
const { Resend } = require("resend");
const generarPlantillaCodigoReset = require("../utils/generarPlantillaCodigoReset");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Enviar código al correo
const enviarCodigoResetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ mensaje: "Por favor, ingresa tu correo electrónico para continuar." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ mensaje: "El correo que ingresaste no tiene un formato válido. Verifica y vuelve a intentarlo." });
    }

    // Obtener credencial
    let credencial;
    try {
      const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/credencial/by-email/${email.trim().toLowerCase()}`);
      credencial = response.data;
    } catch (error) {
      return res.status(404).json({ mensaje: "No encontramos ninguna cuenta asociada a ese correo. Asegúrate de haberlo escrito correctamente." });
    }

    const usuario = await Usuario.findOne({ credenciales: credencial._id }).populate("recuperacion");

    if (!usuario) {
      return res.status(404).json({ mensaje: "Ocurrió un error al buscar tu perfil. Intenta de nuevo más tarde." });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000); // Código de 6 dígitos
    const expiracion = Date.now() + 5 * 60 * 1000; // 5 minutos

    let recuperacion = usuario.recuperacion;

    if (!recuperacion) {
      recuperacion = new Recuperacion();
      await recuperacion.save();
      usuario.recuperacion = recuperacion._id;
      await usuario.save();
    } else {
      // ❗ Evitar múltiples códigos activos (limpiar anteriores)
      recuperacion.codigoVerificacion = undefined;
      recuperacion.codigoExpira = undefined;
    }

    // 👮‍♂️ Limitar intentos por usuario
    if (recuperacion.intentosFallidos && recuperacion.intentosFallidos >= 5) {
      return res.status(429).json({ mensaje: "Has excedido el número de intentos permitidos. Intenta nuevamente en unos minutos." });
    }

    recuperacion.codigoVerificacion = codigo;
    recuperacion.codigoExpira = expiracion;
    recuperacion.intentosFallidos = 0;
    await recuperacion.save();

    await resend.emails.send({
       from: "InsportWear <soporte@soportee.store>",
      to: [credencial.email],
      subject: "Tu código para restablecer la contraseña",
      html: generarPlantillaCodigoReset(usuario.nombre || "usuario", codigo),
    });

    return res.json({ mensaje: "¡Listo! Te enviamos un código a tu correo. Revisa tu bandeja de entrada (y la carpeta de spam) y escríbelo aquí para continuar." });
  } catch (error) {
    console.error("Error en enviarCodigoResetPassword:", error);
    return res.status(500).json({ mensaje: "Tuvimos un problema al enviar el código. Intenta nuevamente en unos minutos.", error: error.message });
  }
};

// Verificar código
const verificarCodigoReset = async (req, res) => {
  try {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
      return res.status(400).json({ mensaje: "Por favor, ingresa tu correo y el código que recibiste para continuar." });
    }

    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/credencial/by-email/${email.trim().toLowerCase()}`);
    const credencial = response.data;

    const usuario = await Usuario.findOne({ credenciales: credencial._id }).populate("recuperacion");
    if (!usuario || !usuario.recuperacion) {
      return res.status(404).json({ mensaje: "No encontramos tu cuenta o el código aún no ha sido solicitado. Intenta de nuevo desde el inicio." });
    }

    const { codigoVerificacion, codigoExpira } = usuario.recuperacion;

    if (parseInt(codigo) !== parseInt(codigoVerificacion)) {
      usuario.recuperacion.intentosFallidos = (usuario.recuperacion.intentosFallidos || 0) + 1;
      await usuario.recuperacion.save();
      return res.status(400).json({ mensaje: "El código ingresado es incorrecto. Revisa nuevamente o solicita uno nuevo." });
    }

    if (Date.now() > codigoExpira) {
      return res.status(400).json({ mensaje: "El código ya expiró. Solicita uno nuevo para continuar." });
    }

    usuario.recuperacion.intentosFallidos = 0;
    await usuario.recuperacion.save();

    return res.json({ mensaje: "✅ ¡Código verificado correctamente! Ahora puedes establecer una nueva contraseña." });
  } catch (error) {
    console.error("Error en verificarCodigoReset:", error);
    return res.status(500).json({ mensaje: "No pudimos verificar el código en este momento. Intenta de nuevo más tarde.", error: error.message });
  }
};

// Cambiar contraseña después de verificar el código
const cambiarPasswordConCodigo = async (req, res) => {
  try {
    const { email, codigo, nuevaPassword } = req.body;

    if (!email || !codigo || !nuevaPassword) {
      return res.status(400).json({ mensaje: "Todos los campos son necesarios para restablecer tu contraseña." });
    }

    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/credencial/by-email/${email.trim().toLowerCase()}`);
    const credencial = response.data;

    const usuario = await Usuario.findOne({ credenciales: credencial._id }).populate("recuperacion");
    if (!usuario || !usuario.recuperacion) {
      return res.status(404).json({ mensaje: "No encontramos tu perfil. Verifica que los datos sean correctos e inténtalo otra vez." });
    }

    const { codigoVerificacion, codigoExpira } = usuario.recuperacion;

    if (parseInt(codigo) !== parseInt(codigoVerificacion) || Date.now() > codigoExpira) {
      return res.status(400).json({ mensaje: "El código que ingresaste no es válido o ya expiró. Solicita uno nuevo si es necesario." });
    }

    // Validar seguridad de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(nuevaPassword)) {
      return res.status(400).json({ mensaje: "La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número." });
    }

    // Actualizar contraseña
    await axios.put(`${process.env.AUTH_SERVICE_URL}/api/auth/credencial/${usuario.credenciales}/password`, {
      nuevaPassword,
    });

    // Limpiar código
    usuario.recuperacion.codigoVerificacion = undefined;
    usuario.recuperacion.codigoExpira = undefined;
    usuario.recuperacion.intentosFallidos = 0;
    await usuario.recuperacion.save();

    return res.json({ mensaje: "🎉 ¡Contraseña actualizada correctamente! Ya puedes iniciar sesión con tu nueva clave." });
  } catch (error) {
    console.error("Error en cambiarPasswordConCodigo:", error);
    return res.status(500).json({ mensaje: "Ocurrió un error al cambiar la contraseña. Por favor, intenta nuevamente.", error: error.message });
  }
};

module.exports = {
  enviarCodigoResetPassword,
  verificarCodigoReset,
  cambiarPasswordConCodigo,
};