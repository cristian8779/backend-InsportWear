const cron = require("node-cron");
const RolRequest = require("../models/RolRequest");

// 🔁 Expirar invitaciones vencidas cada 5 minutos
const expirarInvitaciones = async () => {
  const ahora = new Date();

  const { modifiedCount } = await RolRequest.updateMany(
    { estado: "pendiente", expiracion: { $lt: ahora } },
    { $set: { estado: "expirado" } }
  );

  if (modifiedCount > 0) {
    console.log(`⏰ ${modifiedCount} invitaciones expiradas automáticamente`);
  } else {
    console.log(`⌛ Revisión realizada - sin invitaciones vencidas`);
  }
};

// 🧹 Eliminar invitaciones expiradas con más de 15 minutos
const eliminarExpiradasAntiguas = async () => {
  const hace15Min = new Date(Date.now() - 15 * 60 * 1000); // 15 minutos en ms

  const resultado = await RolRequest.deleteMany({
    estado: "expirado",
    expiracion: { $lt: hace15Min },
  });

  if (resultado.deletedCount > 0) {
    console.log(`🗑️ ${resultado.deletedCount} invitaciones expiradas eliminadas después de 15 minutos`);
    console.log(`📢 SuperAdmin notificado sobre la eliminación (simulado por consola)`);
    // TODO: aquí puedes usar resend.emails.send(...) si deseas enviar aviso por correo
  }
};

// 🕒 Inicializador del cron
const iniciarExpiracionAutomatica = () => {
  cron.schedule("*/5 * * * *", async () => {
    await expirarInvitaciones();
    await eliminarExpiradasAntiguas();
  });
};

module.exports = { iniciarExpiracionAutomatica };
