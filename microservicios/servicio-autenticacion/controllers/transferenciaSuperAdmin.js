// controlador/transferenciaSuperAdmin.js
const mongoose = require("mongoose");
const Credenciales = require("../models/Credenciales");

const esEmailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const transferirSuperAdmin = async (req, res) => {
  console.log("🔄 [transferirSuperAdmin] Iniciando transferencia...");

  let { emailNuevoSuperAdmin, emailAntiguoSuperAdmin } = req.body;

  // Si no viene en body, intentar tomar del token
  if (!emailAntiguoSuperAdmin && req.usuario?.email) {
    emailAntiguoSuperAdmin = req.usuario.email;
    console.log("📩 [transferirSuperAdmin] Email antiguo tomado del token:", emailAntiguoSuperAdmin);
  }

  console.log("📧 Email nuevo:", emailNuevoSuperAdmin);
  console.log("📧 Email antiguo:", emailAntiguoSuperAdmin);

  // Validaciones
  if (!emailNuevoSuperAdmin || !emailAntiguoSuperAdmin) {
    console.error("❌ Faltan uno o ambos correos");
    return res.status(400).json({ mensaje: "Ambos correos son requeridos" });
  }
  if (!esEmailValido(emailNuevoSuperAdmin)) {
    console.error(`❌ Email nuevo inválido: ${emailNuevoSuperAdmin}`);
    return res.status(400).json({ mensaje: "El email del nuevo SuperAdmin no es válido" });
  }
  if (!esEmailValido(emailAntiguoSuperAdmin)) {
    console.error(`❌ Email antiguo inválido: ${emailAntiguoSuperAdmin}`);
    return res.status(400).json({ mensaje: "El email del antiguo SuperAdmin no es válido" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("🔑 Actualizando roles en la base de datos...");

    const nuevo = await Credenciales.findOneAndUpdate(
      { email: emailNuevoSuperAdmin },
      { rol: "superAdmin" },
      { new: true, session }
    );

    const antiguo = await Credenciales.findOneAndUpdate(
      { email: emailAntiguoSuperAdmin },
      { rol: "usuario" },
      { new: true, session }
    );

    if (!nuevo || !antiguo) {
      throw new Error("No se encontraron ambos usuarios en la base de datos");
    }

    console.log("✅ Roles actualizados con éxito");
    console.log("   Nuevo SuperAdmin:", nuevo.email);
    console.log("   Antiguo SuperAdmin:", antiguo.email);

    await session.commitTransaction();
    session.endSession();

    console.log("🎉 Transferencia de SuperAdmin completada");
    res.status(200).json({
      mensaje: "Transferencia de SuperAdmin completada",
      nuevo,
      antiguo
    });
  } catch (error) {
    console.error("💥 Error durante la transferencia:", error.message);

    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      mensaje: "Error en la transferencia",
      error: error.message
    });
  }
};

module.exports = { transferirSuperAdmin };
