// controllers/transferenciaSuperAdminController.js

const RolRequest = require("../models/RolRequest");
const {
  getUsuarioPorEmail,
  enviarInvitacionSuperAdmin,
  crearSolicitudTransferencia,
  actualizarRolUsuario
} = require("../services/superAdminService");
const crypto = require("crypto");

/**
 * 🔧 Helper para obtener el token de autorización
 */
const obtenerToken = (req) => {
  return req.headers.authorization || req.headers.Authorization;
};

/**
 * 🔧 Helper para limpiar solicitudes expiradas
 */
const limpiarSolicitudesExpiradas = async () => {
  await RolRequest.updateMany(
    { 
      estado: "pendiente", 
      expiracion: { $lt: new Date() } 
    },
    { estado: "expirado" }
  );
};

/**
 * 📌 1. Iniciar transferencia de SuperAdmin
 */
const transferirSuperAdmin = async (req, res) => {
  try {
    console.log("🔄 [transferirSuperAdmin] Iniciando transferencia...");

    if (!req.usuario || req.usuario.rol !== "superAdmin") {
      return res.status(403).json({
        mensaje: "⚠️ Solo el SuperAdmin actual puede iniciar una transferencia de su rol."
      });
    }

    const { email: rawEmail } = req.body || {};
    if (!rawEmail) {
      return res.status(400).json({
        mensaje: "Por favor, proporciona el correo electrónico del usuario al que deseas transferir el rol."
      });
    }

    const email = String(rawEmail).trim().toLowerCase();
    console.log("📧 [transferirSuperAdmin] Usuario destino:", email);

    // 🧹 Limpiar solicitudes expiradas primero
    await limpiarSolicitudesExpiradas();

    // Verificar si ya hay una transferencia pendiente
    const transferenciaPendiente = await RolRequest.findOne({
      estado: "pendiente",
      nuevoRol: "superAdmin"
    });
    if (transferenciaPendiente) {
      return res.status(409).json({
        mensaje: "Ya existe una transferencia de SuperAdmin en curso. Debes cancelarla o esperar a que finalice."
      });
    }

    // Verificar usuario destino
    const usuarioDestino = await getUsuarioPorEmail(email);
    if (!usuarioDestino) {
      return res.status(404).json({
        mensaje: "No se encontró ningún usuario registrado con ese correo electrónico."
      });
    }
    if (usuarioDestino.rol === "superAdmin") {
      return res.status(400).json({
        mensaje: "Ese usuario ya es SuperAdmin, no es necesario transferir el rol."
      });
    }

    // Generar un código de 6 dígitos seguro
    const codigo = crypto.randomInt(100000, 1000000).toString();
   const expiracion = new Date(Date.now() + 5 * 60 * 1000); 


    // Guardar solicitud en base de datos
    await crearSolicitudTransferencia(email, req.usuario.email, codigo, expiracion);

    // Enviar invitación
    await enviarInvitacionSuperAdmin(email, codigo);

    return res.status(200).json({
      mensaje: `✅ Invitación enviada a ${email}. El usuario tendrá 2 horas para aceptarla usando el código recibido.`,
      expiracion: expiracion.toISOString()
    });
  } catch (err) {
    console.error("[transferirSuperAdmin] Error:", err);
    return res.status(500).json({
      mensaje: "❌ Error interno al iniciar la transferencia de SuperAdmin."
    });
  }
};

/**
 * 📌 2. Confirmar transferencia
 */
const confirmarTransferencia = async (req, res) => {
  try {
    console.log("🔄 [confirmarTransferencia] Confirmando transferencia...");

    if (!req.usuario?.email) {
      return res.status(401).json({
        mensaje: "Debes iniciar sesión antes de confirmar una transferencia."
      });
    }

    const { codigo } = req.body || {};
    if (!codigo) {
      return res.status(400).json({
        mensaje: "Por favor, ingresa el código de verificación que recibiste por correo."
      });
    }

    const token = obtenerToken(req);
    if (!token) {
      return res.status(401).json({
        mensaje: "Token de autorización requerido."
      });
    }

    const emailUsuario = String(req.usuario.email).toLowerCase();

    const solicitud = await RolRequest.findOne({
      email: emailUsuario,
      codigo,
      estado: "pendiente",
      nuevoRol: "superAdmin"
    });

    if (!solicitud) {
      return res.status(404).json({
        mensaje: "El código ingresado no es válido o no tienes una invitación pendiente."
      });
    }

    if (solicitud.expiracion < new Date()) {
      solicitud.estado = "expirado";
      await solicitud.save();
      return res.status(400).json({
        mensaje: "⏳ El código ha expirado. Solicita al SuperAdmin que inicie nuevamente el proceso."
      });
    }

    console.log("🔑 [confirmarTransferencia] Ejecutando transferencia vía servicio de autenticación...");

    // ✅ Llamada única que transfiere y actualiza roles en el servicio de autenticación
    await actualizarRolUsuario(emailUsuario, solicitud.solicitante, token);

    solicitud.estado = "confirmado";
    await solicitud.save();

    return res.status(200).json({
      mensaje: `🎉 Has aceptado la transferencia. Ahora eres el nuevo SuperAdmin y ${solicitud.solicitante} ha pasado a ser un usuario estándar.`
    });
  } catch (err) {
    console.error("[confirmarTransferencia] Error:", err);
    return res.status(500).json({
      mensaje: "❌ Error interno al confirmar la transferencia."
    });
  }
};

/**
 * 📌 3. Rechazar transferencia
 */
const rechazarTransferencia = async (req, res) => {
  try {
    if (!req.usuario?.email) {
      return res.status(401).json({
        mensaje: "Debes iniciar sesión para rechazar la transferencia."
      });
    }

    const email = String(req.usuario.email).toLowerCase();
    const solicitud = await RolRequest.findOne({
      email,
      estado: "pendiente",
      nuevoRol: "superAdmin"
    });

    if (!solicitud) {
      return res.status(404).json({
        mensaje: "No tienes ninguna transferencia pendiente para rechazar."
      });
    }

    solicitud.estado = "rechazado";
    await solicitud.save();

    return res.status(200).json({
      mensaje: "🚫 Has rechazado la transferencia de SuperAdmin. El SuperAdmin actual conservará su rol."
    });
  } catch (err) {
    console.error("[rechazarTransferencia] Error:", err);
    return res.status(500).json({
      mensaje: "❌ Error interno al rechazar la transferencia."
    });
  }
};

/**
 * 📌 4. Verificar transferencia pendiente
 */
const verificarTransferenciaPendiente = async (req, res) => {
  try {
    if (!req.usuario?.email) {
      return res.status(401).json({
        mensaje: "Debes iniciar sesión para verificar transferencias."
      });
    }

    await limpiarSolicitudesExpiradas();

    const email = String(req.usuario.email).toLowerCase();
    const solicitud = await RolRequest.findOne({
      email,
      estado: "pendiente",
      nuevoRol: "superAdmin",
      expiracion: { $gt: new Date() }
    });

    if (!solicitud) {
      return res.status(200).json({
        pendiente: false,
        mensaje: "No tienes ninguna transferencia pendiente en este momento."
      });
    }

    return res.status(200).json({
      pendiente: true,
      expiracion: solicitud.expiracion,
      solicitante: solicitud.solicitante,
      mensaje: `Tienes una invitación para ser SuperAdmin de ${solicitud.solicitante}. Expira el ${solicitud.expiracion.toLocaleString()}.`
    });
  } catch (err) {
    console.error("[verificarTransferenciaPendiente] Error:", err);
    return res.status(500).json({
      mensaje: "❌ Error interno al verificar la transferencia."
    });
  }
};

module.exports = {
  transferirSuperAdmin,
  confirmarTransferencia,
  rechazarTransferencia,
  verificarTransferenciaPendiente
};
