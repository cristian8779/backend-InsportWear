const jwt = require("jsonwebtoken");
const RolRequest = require("../models/RolRequest");
const generarPlantillaRol = require("../utils/plantillaCambioRol");
const resend = require("../config/resend");
const axios = require("axios");

const BASE_URL = "https://crud-master-api-uf7o.onrender.com";
const AUTH_URL = process.env.AUTH_URL ;

// 🔧 Función para consultar usuario externo con timeout + fallback
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

// ✅ Enviar invitación de cambio de rol
const invitarCambioRol = async (req, res) => {
  const { email, nuevoRol } = req.body;

  if (!email || !nuevoRol) {
    return res.status(400).json({ mensaje: "Por favor, proporciona un correo electrónico y un rol válido." });
  }

  const rolesPermitidos = ["admin", "superAdmin"];
  if (!rolesPermitidos.includes(nuevoRol)) {
    return res.status(400).json({ mensaje: "El rol que estás intentando asignar no es válido. Verifica e intenta nuevamente." });
  }

  if (req.usuario.rol !== "superAdmin") {
    return res.status(403).json({ mensaje: "No tienes permisos suficientes para enviar esta invitación. Solo el SuperAdmin puede hacerlo." });
  }

  const credencial = await getUsuarioPorEmail(email);

  if (!credencial) {
    return res.status(404).json({ mensaje: "No pudimos encontrar un usuario registrado con ese correo. Verifica la dirección y vuelve a intentarlo." });
  }

  const yaExiste = await RolRequest.findOne({ email, estado: "pendiente" });
  if (yaExiste) {
    return res.status(409).json({ mensaje: "Ya hay una invitación activa pendiente para este usuario. Espera a que sea confirmada o caduque." });
  }

  const token = jwt.sign({ email, nuevoRol }, process.env.JWT_SECRET, { expiresIn: "5m" });
  const expiracion = new Date(Date.now() + 5 * 60 * 1000);

  await new RolRequest({
    email,
    nuevoRol,
    token,
    expiracion,
    estado: "pendiente",
  }).save();

  const link = `${BASE_URL}/confirmar-rol.html?token=${token}`;

  await resend.emails.send({
    from: "Soporte <soporte@soportee.store>",
    to: email,
    subject: `Cambio de rol solicitado: ${nuevoRol}`,
    html: generarPlantillaRol(credencial.nombre || email, nuevoRol, link),
  });

  console.log(`📨 Invitación enviada a ${email} para cambiar a rol ${nuevoRol}`);

  return res.status(200).json({
    mensaje: `✅ Invitación enviada correctamente a ${email}. El usuario tiene 5 minutos para confirmar el cambio de rol.`,
    ...(process.env.NODE_ENV !== "production" && { link }),
  });
};

// ✅ Confirmar invitación desde el correo
const confirmarInvitacionRol = async (req, res) => {
  const token = req.body.token || req.query.token;

  if (!token) {
    return res.status(400).send("Falta el token. Por favor, accede desde el enlace que recibiste por correo.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const solicitud = await RolRequest.findOne({ token });

    if (!solicitud) {
      return res.status(404).send("No pudimos encontrar una invitación válida con este enlace. Es posible que ya haya sido usada o eliminada.");
    }

    if (solicitud.estado === "confirmado") {
      return res.status(400).send("Este enlace ya fue utilizado. Si necesitas otro cambio de rol, solicita una nueva invitación.");
    }

    if (solicitud.expiracion < new Date()) {
      solicitud.estado = "expirado";
      await solicitud.save();
      return res.status(400).send("⏰ Este enlace ha expirado. Solicita una nueva invitación para continuar.");
    }

    try {
      await axios.put(`${AUTH_URL}/usuarios/rol`, {
        email: solicitud.email,
        nuevoRol: solicitud.nuevoRol,
      }, { timeout: 3000 });
    } catch (error) {
      console.error("⚠️ Error al actualizar rol en autenticación:", error.message);
      return res.status(502).send("No pudimos confirmar el cambio de rol en este momento. Por favor, intenta más tarde.");
    }

    solicitud.estado = "confirmado";
    await solicitud.save();

    return res.redirect(`${process.env.FRONTEND_URL}/rol-confirmado?rol=${solicitud.nuevoRol}`);
  } catch (error) {
    return res.status(401).send("⚠️ El enlace que estás usando no es válido o ha sido modificado. Solicita uno nuevo si el problema persiste.");
  }
};

// ✅ Ver todas las invitaciones
const listarInvitacionesRol = async (req, res) => {
  if (req.usuario.rol !== "superAdmin") {
    return res.status(403).json({ mensaje: "Acceso restringido. Solo el SuperAdmin puede ver esta información." });
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
    return res.status(500).json({ mensaje: "Hubo un problema al cargar las invitaciones. Intenta nuevamente más tarde." });
  }
};

module.exports = {
  invitarCambioRol,
  confirmarInvitacionRol,
  listarInvitacionesRol,
};
