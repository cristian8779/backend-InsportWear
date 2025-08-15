const RolRequest = require("../models/RolRequest");
const generarPlantillaRol = require("../utils/plantillaCambioRol");
const resend = require("../config/resend");
const axios = require("axios");

const AUTH_URL = process.env.AUTH_URL;

// 🔧 Obtener usuario externo por email
const getUsuarioPorEmail = async (email) => {
  console.log(`📡 Buscando usuario por email: ${email}`);
  if (!AUTH_URL) {
    console.error("❌ AUTH_URL no está definido");
    return null;
  }
  try {
    const response = await axios.get(`${AUTH_URL}/usuarios/${email}`, { timeout: 3000 });
    return response.data.usuario;
  } catch (error) {
    console.error("❌ Error al contactar el servicio de autenticación:", error?.response?.data?.mensaje || error.message);
    return null;
  }
};

const invitarCambioRol = async (req, res) => {
  try {
    const { email: rawEmail, nuevoRol } = req.body || {};
    if (!rawEmail || !nuevoRol) {
      return res.status(400).json({ mensaje: "Debes proporcionar un correo electrónico y un rol válido." });
    }

    const email = String(rawEmail).trim().toLowerCase();
    const rolesPermitidos = ["admin"]; 
       if (!rolesPermitidos.includes(nuevoRol)) {
       return res.status(400).json({ mensaje: "Solo se puede invitar al rol 'admin'." });
    }

    if (!req.usuario || req.usuario.rol !== "superAdmin") {
      return res.status(403).json({ mensaje: "Solo el SuperAdmin puede enviar invitaciones." });
    }

    const credencial = await getUsuarioPorEmail(email);
    if (!credencial) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (credencial.rol === nuevoRol) {
      return res.status(400).json({ mensaje: `El usuario ya tiene el rol de ${nuevoRol}.` });
    }

    const yaExiste = await RolRequest.findOne({ email, estado: "pendiente" });
    if (yaExiste) {
      return res.status(409).json({ mensaje: "Este usuario ya tiene una invitación pendiente." });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 5 * 60 * 1000);

    await new RolRequest({ email, nuevoRol, codigo, expiracion, estado: "pendiente" }).save();

    await resend.emails.send({
      from: "InsportWear <soporte@soportee.store>",
      to: email,
      subject: `Código para cambio de rol a: ${nuevoRol}`,
      html: generarPlantillaRol(credencial.nombre || email, nuevoRol, codigo),
    });

    return res.status(200).json({
      mensaje: `✅ Código enviado correctamente a ${email}.`,
      email,
      nuevoRol,
      expiracion: expiracion.toISOString(),
    });
  } catch (err) {
    console.error("💥 Error inesperado:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

const confirmarCodigoRol = async (req, res) => {
  try {
    if (!req.usuario?.email) {
      return res.status(401).json({ mensaje: "Usuario no autenticado." });
    }

    const codigo = String(req.body?.codigo ?? "").trim();
    if (!codigo) {
      return res.status(400).json({ mensaje: "Falta el código." });
    }

    const email = req.usuario.email.trim().toLowerCase();
    const solicitud = await RolRequest.findOne({ email, codigo, estado: "pendiente" });

    if (!solicitud) {
      return res.status(404).json({ mensaje: "Código inválido o no coincide." });
    }

    if (solicitud.expiracion < new Date()) {
      solicitud.estado = "expirado";
      await solicitud.save();
      return res.status(400).json({ mensaje: "⏰ El código ha expirado." });
    }

    await axios.put(
      `${AUTH_URL}/usuarios/rol`,
      { email, nuevoRol: solicitud.nuevoRol, esConfirmacionInvitacion: true },
      { headers: { Authorization: req.headers.authorization, 'Content-Type': 'application/json' }, timeout: 5000 }
    );

    solicitud.estado = "confirmado";
    await solicitud.save();

    return res.status(200).json({ mensaje: `✅ Tu rol fue actualizado a "${solicitud.nuevoRol}".` });
  } catch (err) {
    console.error("💥 Error inesperado:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

const rechazarInvitacionRol = async (req, res) => {
  try {
    if (!req.usuario?.email) {
      return res.status(401).json({ mensaje: "Debes estar autenticado." });
    }

    const solicitud = await RolRequest.findOne({ email: req.usuario.email, estado: "pendiente" });
    if (!solicitud) {
      return res.status(404).json({ mensaje: "No tienes invitaciones pendientes." });
    }

    solicitud.estado = "cancelado";
    await solicitud.save();
    return res.status(200).json({ mensaje: "❌ Has cancelado la invitación." });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno al cancelar la invitación." });
  }
};

const cancelarInvitacionPorSuperAdmin = async (req, res) => {
  try {
    if (!req.usuario || req.usuario.rol !== "superAdmin") {
      return res.status(403).json({ mensaje: "Solo el SuperAdmin puede cancelar invitaciones." });
    }

    const { email } = req.params;
    const solicitud = await RolRequest.findOne({ email: String(email).toLowerCase(), estado: "pendiente" });
    if (!solicitud) {
      return res.status(404).json({ mensaje: "No se encontró invitación pendiente." });
    }

    solicitud.estado = "cancelado";
    await solicitud.save();
    return res.status(200).json({ mensaje: `❌ Invitación para ${email} cancelada.` });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno al cancelar la invitación." });
  }
};

const listarInvitacionesRol = async (req, res) => {
  try {
    if (!req.usuario || req.usuario.rol !== "superAdmin") {
      return res.status(403).json({ mensaje: "Solo el SuperAdmin puede ver las invitaciones." });
    }

    const solicitudes = await RolRequest.find().sort({ createdAt: -1 });
    return res.status(200).json({ invitaciones: solicitudes });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al obtener las invitaciones." });
  }
};

const verificarInvitacionPendiente = async (req, res) => {
  try {
    if (!req.usuario?.email) {
      return res.status(401).json({ pendiente: false, mensaje: "Debes estar autenticado." });
    }

    const solicitud = await RolRequest.findOne({
      email: req.usuario.email,
      estado: "pendiente",
      expiracion: { $gt: new Date() },
    });

    if (!solicitud) {
      return res.status(200).json({ pendiente: false, mensaje: "No tienes invitaciones pendientes." });
    }

    return res.status(200).json({
      pendiente: true,
      nuevoRol: solicitud.nuevoRol,
      expiracion: solicitud.expiracion,
      mensaje: `Tienes una invitación pendiente para ser ${solicitud.nuevoRol}.`,
    });
  } catch (error) {
    return res.status(500).json({ pendiente: false, mensaje: "Error interno al verificar la invitación." });
  }
};

const eliminarTodasInvitaciones = async (req, res) => {
  try {
    if (!req.usuario || req.usuario.rol !== "superAdmin") {
      return res.status(403).json({ mensaje: "Solo el SuperAdmin puede eliminar todas las invitaciones." });
    }

    if (req.body?.confirmacion !== "ELIMINAR TODO") {
      return res.status(400).json({ mensaje: "Debes escribir exactamente 'ELIMINAR TODO' para confirmar." });
    }

    const resultado = await RolRequest.deleteMany({});
    return res.status(200).json({ mensaje: `Se eliminaron ${resultado.deletedCount} invitaciones.` });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno al eliminar las invitaciones." });
  }
};

module.exports = {
  invitarCambioRol,
  confirmarCodigoRol,
  rechazarInvitacionRol,
  cancelarInvitacionPorSuperAdmin,
  listarInvitacionesRol,
  verificarInvitacionPendiente,
  eliminarTodasInvitaciones
};
