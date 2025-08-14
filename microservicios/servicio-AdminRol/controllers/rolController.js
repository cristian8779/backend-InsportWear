const RolRequest = require("../models/RolRequest");
const generarPlantillaRol = require("../utils/plantillaCambioRol");
const resend = require("../config/resend");
const axios = require("axios");
const jwt = require("jsonwebtoken"); // ⬅️ para extraer datos del token si falta req.usuario

const AUTH_URL = process.env.AUTH_URL;
const JWT_SECRET = process.env.JWT_SECRET;

// 🔧 Obtener usuario externo por email
const getUsuarioPorEmail = async (email) => {
  console.log(`📡 [getUsuarioPorEmail] Buscando usuario por email: ${email}`);
  if (!AUTH_URL) {
    console.error("❌ [getUsuarioPorEmail] AUTH_URL no está definido en el archivo .env");
    return null;
  }

  try {
    const response = await axios.get(`${AUTH_URL}/usuarios/${email}`, { timeout: 3000 });
    console.log(`✅ [getUsuarioPorEmail] Usuario encontrado:`, response.data.usuario);
    return response.data.usuario;
  } catch (error) {
    console.error(
      "❌ [getUsuarioPorEmail] Error al contactar el servicio de autenticación:",
      error?.response?.data?.mensaje || error.message
    );
    return null;
  }
};

// ✅ Enviar código para cambio de rol (solo SuperAdmin)
const invitarCambioRol = async (req, res) => {
  console.log("📩 [invitarCambioRol] Body recibido:", req.body);
  try {
    const { email: rawEmail, nuevoRol } = req.body || {};

    if (!rawEmail || !nuevoRol) {
      console.warn("⚠️ [invitarCambioRol] Falta email o nuevo rol");
      return res.status(400).json({ mensaje: "Debes proporcionar un correo electrónico y un rol válido." });
    }

    const email = String(rawEmail).trim().toLowerCase();
    const rolesPermitidos = ["admin", "superAdmin"];

    if (!rolesPermitidos.includes(nuevoRol)) {
      console.warn(`⚠️ [invitarCambioRol] Rol inválido: ${nuevoRol}`);
      return res.status(400).json({ mensaje: "Rol inválido. Solo se permite 'admin' o 'superAdmin'." });
    }

    // ✅ Solo el SuperAdmin puede invitar
    if (!req.usuario || req.usuario.rol !== "superAdmin") {
      console.warn("🚫 [invitarCambioRol] Usuario no autorizado");
      return res.status(403).json({ mensaje: "Solo el SuperAdmin puede enviar invitaciones de cambio de rol." });
    }

    // 🚫 Verificar límite de superAdmin y admin existentes
    try {
      const { data } = await axios.get(`${AUTH_URL}/usuarios`, { timeout: 4000 });
      const usuarios = data?.usuarios || [];

      const totalSuperAdmins = usuarios.filter(u => u.rol === "superAdmin").length;
      const totalAdmins = usuarios.filter(u => u.rol === "admin").length;

      if (nuevoRol === "superAdmin" && totalSuperAdmins >= 2) {
        return res.status(400).json({ mensaje: "No se pueden crear más de 2 superAdmin." });
      }

      if (nuevoRol === "admin" && totalAdmins >= 5) {
        return res.status(400).json({ mensaje: "No se pueden crear más de 5 admin." });
      }
    } catch (error) {
      console.error("❌ [invitarCambioRol] Error al verificar límites de roles:", error.message);
      return res.status(500).json({ mensaje: "No se pudo verificar la cantidad de roles actuales." });
    }

    const credencial = await getUsuarioPorEmail(email);
    if (!credencial) {
      console.warn("⚠️ [invitarCambioRol] Usuario no encontrado:", email);
      return res.status(404).json({ mensaje: "No se encontró un usuario con ese correo electrónico." });
    }

    const yaExiste = await RolRequest.findOne({ email, estado: "pendiente" });
    if (yaExiste) {
      console.warn(`⚠️ [invitarCambioRol] Ya existe invitación pendiente para ${email}`);
      return res.status(409).json({ mensaje: "Este usuario ya tiene una invitación pendiente." });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 15 * 60 * 1000);

    await new RolRequest({ email, nuevoRol, codigo, expiracion, estado: "pendiente" }).save();

    try {
      console.log(`📨 [invitarCambioRol] Enviando correo a ${email} con código: ${codigo}`);
      await resend.emails.send({
        from: "InsportWear <soporte@soportee.store>",
        to: email,
        subject: `Código para cambio de rol a: ${nuevoRol}`,
        html: generarPlantillaRol(credencial.nombre || email, nuevoRol, codigo),
      });
      console.log(`✅ [invitarCambioRol] Código enviado a ${email}`);
      return res.status(200).json({
        mensaje: `✅ Código enviado correctamente a ${email}.`,
        expiracion: expiracion.toISOString(),
      });
    } catch (error) {
      console.error("❌ [invitarCambioRol] Error al enviar el correo:", error.message);
      return res.status(500).json({ mensaje: "Error al enviar el correo. Intenta nuevamente." });
    }
  } catch (err) {
    console.error("💥 [invitarCambioRol] Error inesperado:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// ✅ Confirmar código (usuario debe estar logueado)
const confirmarCodigoRol = async (req, res) => {
  console.log("🔑 [confirmarCodigoRol] Body recibido:", req.body);

  try {
    if (!req.usuario) {
      console.error("🚫 [confirmarCodigoRol] req.usuario no está definido.");
      return res.status(401).json({ mensaje: "Usuario no autenticado. Verifica tu token." });
    }

    if (!req.usuario.email) {
      console.error("🚫 [confirmarCodigoRol] El token no contiene email");
      return res.status(400).json({ mensaje: "Token inválido: falta email." });
    }

    const rawCodigo = req.body?.codigo;
    const codigo = String(rawCodigo ?? "").trim();
    if (!codigo) {
      console.warn("⚠️ [confirmarCodigoRol] Código no proporcionado");
      return res.status(400).json({ mensaje: "Falta el código recibido en el correo." });
    }

    const sanitizedEmail = String(req.usuario.email).trim().toLowerCase();
    console.log(`👤 [confirmarCodigoRol] Usuario autenticado: ${sanitizedEmail}`);

    const solicitud = await RolRequest.findOne({
      email: sanitizedEmail,
      codigo,
      estado: "pendiente",
    });

    if (!solicitud) {
      console.warn(`⚠️ [confirmarCodigoRol] Código inválido para ${sanitizedEmail}`);
      return res.status(404).json({ mensaje: "Código inválido o no coincide con tu invitación." });
    }

    if (solicitud.expiracion < new Date()) {
      console.warn(`⏰ [confirmarCodigoRol] Código expirado para ${sanitizedEmail}`);
      solicitud.estado = "expirado";
      await solicitud.save();
      return res.status(400).json({ mensaje: "⏰ El código ha expirado." });
    }

    if (!AUTH_URL) {
      console.error("❌ [confirmarCodigoRol] AUTH_URL no definido");
      return res.status(500).json({ mensaje: "Configuración inválida: falta AUTH_URL." });
    }

    try {
      console.log(`🔄 [confirmarCodigoRol] Actualizando rol a ${solicitud.nuevoRol}`);
      await axios.put(
        `${AUTH_URL}/usuarios/rol`,
        { 
          email: sanitizedEmail, 
          nuevoRol: solicitud.nuevoRol,
          esConfirmacionInvitacion: true
        },
        { 
          timeout: 5000, 
          headers: { 
            Authorization: req.headers.authorization,
            'Content-Type': 'application/json'
          } 
        }
      );
      console.log(`✅ [confirmarCodigoRol] Rol actualizado correctamente`);
    } catch (error) {
      console.error("⚠️ [confirmarCodigoRol] Error al actualizar el rol:");
      return res.status(502).json({ 
        mensaje: "No se pudo confirmar el cambio de rol en el servicio de autenticación.",
        detalle: error.response?.data?.mensaje || "Error de comunicación"
      });
    }

    solicitud.estado = "confirmado";
    await solicitud.save();

    console.log(`✅ [confirmarCodigoRol] Rol actualizado correctamente a ${solicitud.nuevoRol}`);
    return res.status(200).json({ mensaje: `✅ Tu rol fue actualizado a "${solicitud.nuevoRol}".` });
  } catch (err) {
    console.error("💥 [confirmarCodigoRol] Error inesperado:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// ✅ Rechazar invitación
const rechazarInvitacionRol = async (req, res) => {
  console.log("🚫 [rechazarInvitacionRol] Body/Headers:", { body: req.body, headers: req.headers });
  try {
    if (!req.usuario?.email) {
      console.warn("🚫 [rechazarInvitacionRol] Usuario no autenticado o sin email");
      return res.status(401).json({ mensaje: "Debes estar autenticado." });
    }

    const solicitud = await RolRequest.findOne({ email: req.usuario.email, estado: "pendiente" });
    if (!solicitud) {
      console.warn("⚠️ [rechazarInvitacionRol] No hay invitaciones pendientes");
      return res.status(404).json({ mensaje: "No tienes invitaciones pendientes." });
    }

    solicitud.estado = "cancelado";
    await solicitud.save();
    console.log("✅ [rechazarInvitacionRol] Invitación cancelada");
    return res.status(200).json({ mensaje: "❌ Has cancelado la invitación." });
  } catch (error) {
    console.error("❌ [rechazarInvitacionRol] Error:", error.message);
    return res.status(500).json({ mensaje: "Error interno al cancelar la invitación." });
  }
};

// ✅ Cancelar invitación (SuperAdmin)
const cancelarInvitacionPorSuperAdmin = async (req, res) => {
  console.log("🛑 [cancelarInvitacionPorSuperAdmin] Params:", req.params);
  try {
    if (!req.usuario || req.usuario.rol !== "superAdmin") {
      console.warn("🚫 [cancelarInvitacionPorSuperAdmin] No autorizado");
      return res.status(403).json({ mensaje: "Solo el SuperAdmin puede cancelar invitaciones." });
    }

    const { email } = req.params;
    if (!email) {
      console.warn("⚠️ [cancelarInvitacionPorSuperAdmin] Falta email");
      return res.status(400).json({ mensaje: "Falta el email en los parámetros." });
    }

    const solicitud = await RolRequest.findOne({ email: String(email).toLowerCase(), estado: "pendiente" });
    if (!solicitud) {
      console.warn("⚠️ [cancelarInvitacionPorSuperAdmin] No hay invitación pendiente");
      return res.status(404).json({ mensaje: "No se encontró invitación pendiente." });
    }

    solicitud.estado = "cancelado";
    await solicitud.save();
    console.log(`✅ [cancelarInvitacionPorSuperAdmin] Invitación para ${email} cancelada`);
    return res.status(200).json({ mensaje: `❌ Invitación para ${email} cancelada.` });
  } catch (error) {
    console.error("❌ [cancelarInvitacionPorSuperAdmin] Error:", error.message);
    return res.status(500).json({ mensaje: "Error interno al cancelar la invitación." });
  }
};

// ✅ Listar invitaciones
const listarInvitacionesRol = async (req, res) => {
  console.log("📜 [listarInvitacionesRol] Solicitud recibida");
  try {
    if (!req.usuario || req.usuario.rol !== "superAdmin") {
      console.warn("🚫 [listarInvitacionesRol] No autorizado");
      return res.status(403).json({ mensaje: "Solo el SuperAdmin puede ver las invitaciones." });
    }

    const solicitudes = await RolRequest.find().sort({ createdAt: -1 });
    const resultado = solicitudes.map((s) => ({
      email: s.email,
      nuevoRol: s.nuevoRol,
      estado: s.estado,
      expiracion: s.expiracion,
      fechaSolicitud: s.createdAt,
    }));

    console.log(`✅ [listarInvitacionesRol] ${resultado.length} invitaciones encontradas`);
    return res.status(200).json({ invitaciones: resultado });
  } catch (error) {
    console.error("❌ [listarInvitacionesRol] Error:", error.message);
    return res.status(500).json({ mensaje: "Error al obtener las invitaciones." });
  }
};

// ✅ Ver invitación pendiente
const rolPendiente = async (req, res) => {
  console.log("⏳ [rolPendiente] Verificando invitación pendiente");
  try {
    if (!req.usuario?.email) {
      console.warn("🚫 [rolPendiente] Usuario no autenticado o sin email");
      return res.status(401).json({ pendiente: false, mensaje: "Debes estar autenticado." });
    }

    const solicitud = await RolRequest.findOne({
      email: req.usuario.email,
      estado: "pendiente",
      expiracion: { $gt: new Date() },
    });

    if (!solicitud) {
      console.log("ℹ️ [rolPendiente] No hay invitaciones pendientes");
      return res.status(200).json({ pendiente: false, mensaje: "No tienes invitaciones pendientes." });
    }

    console.log(`✅ [rolPendiente] Invitación pendiente: ${solicitud.nuevoRol}`);
    return res.status(200).json({
      pendiente: true,
      nuevoRol: solicitud.nuevoRol,
      expiracion: solicitud.expiracion,
      mensaje: `Tienes una invitación pendiente para ser ${solicitud.nuevoRol}.`,
    });
  } catch (error) {
    console.error("❌ [rolPendiente] Error:", error.message);
    return res.status(500).json({ pendiente: false, mensaje: "Error interno al verificar la invitación." });
  }
};

// ✅ Eliminar TODAS las invitaciones (SuperAdmin + Confirmación de seguridad)
const eliminarTodasInvitaciones  = async (req, res) => {
  console.log("⚠️ [eliminarTodasLasInvitaciones] Solicitud recibida");

  try {
    if (!req.usuario || req.usuario.rol !== "superAdmin") {
      console.warn("🚫 [eliminarTodasLasInvitaciones] No autorizado");
      return res.status(403).json({ mensaje: "Solo el SuperAdmin puede eliminar todas las invitaciones." });
    }

    const confirmacion = req.body?.confirmacion;
    if (confirmacion !== "ELIMINAR TODO") {
      console.warn("⚠️ [eliminarTodasLasInvitaciones] Confirmación inválida");
      return res.status(400).json({ mensaje: "Debes escribir exactamente 'ELIMINAR TODO' para confirmar." });
    }

    const resultado = await RolRequest.deleteMany({});
    console.log(`🗑️ [eliminarTodasLasInvitaciones] ${resultado.deletedCount} invitaciones eliminadas`);
    return res.status(200).json({ mensaje: `Se eliminaron ${resultado.deletedCount} invitaciones.` });
  } catch (error) {
    console.error("💥 [eliminarTodasLasInvitaciones] Error:", error.message);
    return res.status(500).json({ mensaje: "Error interno al eliminar las invitaciones." });
  }
};

module.exports = {
  invitarCambioRol,
  confirmarCodigoRol,
  rechazarInvitacionRol,
  cancelarInvitacionPorSuperAdmin,
  listarInvitacionesRol,
  verificarInvitacionPendiente: rolPendiente,
  eliminarTodasInvitaciones , 
};
