const cron = require("node-cron");
const RolRequest = require("../models/RolRequest");

// 🔁 Ejecutar cada 5 minutos para expirar tokens vencidos
const iniciarExpiracionAutomatica = () => {
  cron.schedule("*/5 * * * *", async () => {
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
  });
};

module.exports = { iniciarExpiracionAutomatica };
