const jwt = require("jsonwebtoken");
const Credenciales = require("../models/Credenciales");
const RolRequest = require("../models/RolRequest");
const generarPlantillaRol = require("../utils/plantillaCambioRol");
const resend = require("../config/resend");

const BASE_URL = "https://crud-master-api-uf7o.onrender.com";

// ✅ Enviar invitación de cambio de rol
const invitarCambioRol = async (req, res) => {
  const { email, nuevoRol } = req.body;

  if (!email || !nuevoRol)
    return res.status(400).json({ mensaje: "Debes proporcionar un email válido y un nuevo rol." });

  const rolesPermitidos = ["admin", "superAdmin"];
  if (!rolesPermitidos.includes(nuevoRol))
    return res.status(400).json({ mensaje: "El rol especificado no es válido." });

  if (req.usuario.rol !== "superAdmin")
    return res.status(403).json({ mensaje: "Solo el SuperAdmin puede enviar invitaciones de rol." });

  const credencial = await Credenciales.findOne({ email });
  if (!credencial)
    return res.status(404).json({ mensaje: "No existe ningún usuario registrado con ese correo." });

  const yaExiste = await RolRequest.findOne({ email, estado: "pendiente" });
  if (yaExiste)
    return res.status(409).json({ mensaje: "Ya existe una invitación pendiente para este correo." });

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
    mensaje: `La invitación ha sido enviada correctamente al correo ${email}.`,
    ...(process.env.NODE_ENV !== "production" && { link }),
  });
};

// ✅ Confirmar invitación desde el correo
const confirmarInvitacionRol = async (req, res) => {
  const token = req.body.token || req.query.token;

  if (!token) return res.status(400).send("Token requerido para confirmar el cambio de rol.");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const solicitud = await RolRequest.findOne({ token });

    if (!solicitud)
      return res.status(404).send("No se encontró ninguna invitación con ese token.");

    if (solicitud.estado === "confirmado")
      return res.status(400).send("Esta invitación ya fue confirmada anteriormente.");

    if (solicitud.expiracion < new Date()) {
      solicitud.estado = "expirado";
      await solicitud.save();
      return res.status(400).send("El enlace ha expirado.");
    }

    await Credenciales.updateOne({ email: solicitud.email }, { rol: solicitud.nuevoRol });
    solicitud.estado = "confirmado";
    await solicitud.save();

    return res.redirect(`${process.env.FRONTEND_URL}/rol-confirmado?rol=${solicitud.nuevoRol}`);
  } catch (error) {
    return res.status(401).send("El token proporcionado es inválido o ha sido alterado.");
  }
};

// ✅ Ver todas las invitaciones
const listarInvitacionesRol = async (req, res) => {
  if (req.usuario.rol !== "superAdmin")
    return res.status(403).json({ mensaje: "Acceso denegado. Solo el SuperAdmin puede ver las invitaciones." });

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
    console.error("Error al listar invitaciones:", error);
    return res.status(500).json({ mensaje: "Error al obtener las invitaciones." });
  }
};

module.exports = {
  invitarCambioRol,
  confirmarInvitacionRol,
  listarInvitacionesRol,
};
