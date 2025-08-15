const rolService = require("../services/rolService");

const invitarCambioRol = (req, res) => rolService.invitarCambioRol(req, res);
const confirmarCodigoRol = (req, res) => rolService.confirmarCodigoRol(req, res);
const rechazarInvitacionRol = (req, res) => rolService.rechazarInvitacionRol(req, res);
const cancelarInvitacionPorSuperAdmin = (req, res) => rolService.cancelarInvitacionPorSuperAdmin(req, res);
const listarInvitacionesRol = (req, res) => rolService.listarInvitacionesRol(req, res);
const verificarInvitacionPendiente = (req, res) => rolService.verificarInvitacionPendiente(req, res);
const eliminarTodasInvitaciones = (req, res) => rolService.eliminarTodasInvitaciones(req, res);

module.exports = {
  invitarCambioRol,
  confirmarCodigoRol,
  rechazarInvitacionRol,
  cancelarInvitacionPorSuperAdmin,
  listarInvitacionesRol,
  verificarInvitacionPendiente,
  eliminarTodasInvitaciones
};
