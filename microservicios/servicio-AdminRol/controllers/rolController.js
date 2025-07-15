const RolRequest = require("../models/RolRequest");
const generarPlantillaRol = require("../utils/plantillaCambioRol");
const resend = require("../config/resend");
const axios = require("axios");

const AUTH_URL = process.env.AUTH_URL;

// 🔧 Obtener usuario externo por email
const getUsuarioPorEmail = async (email) => {
  try {
    const response = await axios.get(`${AUTH_URL}/usuarios/${email}`, {
      timeout: 3000,
    });
    return response.data.usuario;
  } catch (error) {
    console.error("❌ Error al contactar el servicio de autenticación:", error.message);
    return null;
  }
};

// ✅ Enviar código para cambio de rol
const invitarCambioRol = async (req, res) => {
  const rawEmail = req.body.email;
  const nuevoRol = req.body.nuevoRol;

  if (!rawEmail || !nuevoRol) {
    return res.status(400).json({
      mensaje: "Debes proporcionar un correo electrónico y un rol válido.",
    });
  }

  const email = rawEmail.trim().toLowerCase();
  const rolesPermitidos = ["admin", "superAdmin"];

  if (!rolesPermitidos.includes(nuevoRol)) {
    return res.status(400).json({
      mensaje: "Rol inválido. Solo se permite 'admin' o 'superAdmin'.",
    });
  }

  if (req.usuario.rol !== "superAdmin") {
    return res.status(403).json({
      mensaje: "Acceso denegado. Solo el SuperAdmin puede enviar invitaciones de cambio de rol.",
    });
  }

  const credencial = await getUsuarioPorEmail(email);
  if (!credencial) {
    return res.status(404).json({
      mensaje: "No se encontró un usuario registrado con ese correo electrónico.",
    });
  }

  const yaExiste = await RolRequest.findOne({ email, estado: "pendiente" });
  if (yaExiste) {
    return res.status(409).json({
      mensaje: "Este usuario ya tiene una invitación pendiente. Espera a que se confirme o expire.",
    });
  }

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const expiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

  await new RolRequest({
    email,
    nuevoRol,
    codigo,
    expiracion,
    estado: "pendiente",
  }).save();

  await resend.emails.send({
    from: "Soporte <soporte@soportee.store>",
    to: email,
    subject: `Código para cambio de rol a: ${nuevoRol}`,
    html: generarPlantillaRol(credencial.nombre || email, nuevoRol, codigo),
  });

  console.log(`📨 Código enviado a ${email} para cambio de rol a ${nuevoRol}`);

  return res.status(200).json({
    mensaje: `✅ El código fue enviado correctamente a ${email}. El usuario tiene 5 minutos para ingresarlo y confirmar el cambio.`,
    expiracion: expiracion.toISOString(),
  });
};

// ✅ Confirmar código desde app o web
const confirmarCodigoRol = async (req, res) => {
  const { email, codigo } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({
      mensaje: "Faltan datos. Proporcione el correo electrónico y el código recibido.",
    });
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const solicitud = await RolRequest.findOne({ email: sanitizedEmail, codigo, estado: "pendiente" });

  if (!solicitud) {
    return res.status(404).json({
      mensaje: "El código es inválido, ya fue utilizado o no coincide con el correo ingresado.",
    });
  }

  if (solicitud.expiracion < new Date()) {
    solicitud.estado = "expirado";
    await solicitud.save();
    return res.status(400).json({
      mensaje: "⏰ El código ha expirado. Solicite una nueva invitación.",
    });
  }

  try {
    await axios.put(`${AUTH_URL}/usuarios/rol`, {
      email: sanitizedEmail,
      nuevoRol: solicitud.nuevoRol,
    }, { timeout: 3000 });
  } catch (error) {
    console.error("⚠️ Error al actualizar el rol:", error.response?.data || error.message);
    return res.status(502).json({
      mensaje: "No se pudo confirmar el cambio de rol en este momento. Intente nuevamente más tarde.",
    });
  }

  solicitud.estado = "confirmado";
  await solicitud.save();

  return res.status(200).json({
    mensaje: `✅ El rol del usuario fue actualizado correctamente a "${solicitud.nuevoRol}".`,
  });
};

// ✅ Ver todas las invitaciones
const listarInvitacionesRol = async (req, res) => {
  if (req.usuario.rol !== "superAdmin") {
    return res.status(403).json({
      mensaje: "Acceso denegado. Solo el SuperAdmin puede ver las invitaciones.",
    });
  }

  try {
    const solicitudes = await RolRequest.find().sort({ createdAt: -1 });

    const resultado = solicitudes.map((s) => ({
      email: s.email,
      nuevoRol: s.nuevoRol,
      estado: s.estado,
      expiracion: s.expiracion,
      fechaSolicitud: s.createdAt,
    }));

    return res.status(200).json({ invitaciones: resultado });
  } catch (error) {
    console.error("❌ Error al obtener las invitaciones:", error);
    return res.status(500).json({
      mensaje: "Hubo un problema al cargar las invitaciones. Intente nuevamente más tarde.",
    });
  }
};

module.exports = {
  invitarCambioRol,
  confirmarCodigoRol,
  listarInvitacionesRol,
};
