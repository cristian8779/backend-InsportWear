const RolRequest = require("../models/RolRequest");
const generarPlantillaRol = require("../utils/plantillaTransferenciaSuperAdmin.js");
const resend = require("../config/resend");
const axios = require("axios");

const AUTH_URL = process.env.AUTH_URL;

// 🔍 Obtener usuario por email desde servicio externo
const getUsuarioPorEmail = async (email) => {
  try {
    const response = await axios.get(`${AUTH_URL}/usuarios/${email}`, { timeout: 3000 });
    return response.data.usuario || null;
  } catch (error) {
    console.error("[getUsuarioPorEmail] Error:", error?.response?.data?.mensaje || error.message);
    return null;
  }
};

// 📧 Enviar invitación por email
const enviarInvitacionSuperAdmin = async (emailDestino, codigoGenerado) => {
  await resend.emails.send({
    from: "InsportWear <soporte@soportee.store>",
    to: emailDestino,
    subject: "Invitación para ser el nuevo SuperAdmin",
    html: generarPlantillaRol(emailDestino, codigoGenerado)
  });
};

// 💾 Crear solicitud de transferencia
const crearSolicitudTransferencia = async (emailDestino, emailSolicitante, codigoGenerado, expiracion) => {
  await new RolRequest({
    email: emailDestino,
    nuevoRol: "superAdmin",
    codigo: codigoGenerado,
    expiracion,
    estado: "pendiente",
    solicitante: emailSolicitante
  }).save();
};

const actualizarRolUsuario = async (emailNuevoSuperAdmin, emailAntiguoSuperAdmin, token) => {
  console.log("🔄 [actualizarRolUsuario] Iniciando...");
  console.log("📧 Nuevo SuperAdmin recibido:", emailNuevoSuperAdmin);
  console.log("📧 Antiguo SuperAdmin recibido:", emailAntiguoSuperAdmin);
  console.log("🔑 Token presente:", !!token);

  const esEmailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!token) throw new Error("[actualizarRolUsuario] No se recibió token válido");
  if (!emailNuevoSuperAdmin || !emailAntiguoSuperAdmin) {
    throw new Error("[actualizarRolUsuario] Faltan correos");
  }
  if (!esEmailValido(emailAntiguoSuperAdmin)) {
    throw new Error(`[actualizarRolUsuario] emailAntiguoSuperAdmin inválido: ${emailAntiguoSuperAdmin}`);
  }
  if (!esEmailValido(emailNuevoSuperAdmin)) {
    throw new Error(`[actualizarRolUsuario] emailNuevoSuperAdmin inválido: ${emailNuevoSuperAdmin}`);
  }

  console.log("🔑 [actualizarRolUsuario] Token válido, llamando API transferencia-superadmin...");

  try {
    const response = await axios.put(
      `${AUTH_URL}/usuarios/transferencia-superadmin`,
      { emailNuevoSuperAdmin, emailAntiguoSuperAdmin },
      { headers: { Authorization: token } }
    );

    console.log("✅ [actualizarRolUsuario] Transferencia completada con éxito:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 [actualizarRolUsuario] Error en petición:", error?.response?.data || error.message);
    throw error;
  }
};



module.exports = {
  getUsuarioPorEmail,
  enviarInvitacionSuperAdmin,
  crearSolicitudTransferencia,
  actualizarRolUsuario
};
