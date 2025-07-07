const Credenciales = require("../models/Credenciales");

/**
 * Actualiza el rol de un usuario si la solicitud la hace un superAdmin.
 *
 * @param {Object} options
 * @param {string} options.email - Correo del usuario cuyo rol se desea cambiar.
 * @param {string} options.nuevoRol - Rol que se quiere asignar.
 * @param {string} options.rolSolicitante - Rol del usuario que está intentando hacer el cambio.
 * @returns {Object} Resultado con estado, mensaje y código HTTP.
 */
const actualizarRolDeUsuario = async ({ email, nuevoRol, rolSolicitante }) => {
  try {
    const rolesValidos = ["usuario", "admin", "superAdmin"];

    if (rolSolicitante !== "superAdmin") {
      return {
        ok: false,
        status: 403,
        mensaje: "Solo un SuperAdmin puede cambiar el rol de otros usuarios.",
      };
    }

    if (!rolesValidos.includes(nuevoRol)) {
      return {
        ok: false,
        status: 400,
        mensaje: `El rol "${nuevoRol}" no es válido. Roles permitidos: ${rolesValidos.join(", ")}.`,
      };
    }

    const usuario = await Credenciales.findOne({ email });

    if (!usuario) {
      return {
        ok: false,
        status: 404,
        mensaje: `No existe ningún usuario con el correo "${email}".`,
      };
    }

    if (usuario.rol === nuevoRol) {
      return {
        ok: false,
        status: 400,
        mensaje: `El usuario ya tiene el rol "${nuevoRol}".`,
      };
    }

    usuario.rol = nuevoRol;
    await usuario.save();

    return {
      ok: true,
      status: 200,
      mensaje: `Rol actualizado correctamente. Ahora "${email}" tiene rol "${nuevoRol}".`,
    };
  } catch (error) {
    console.error("❌ Error al actualizar el rol:", error);
    return {
      ok: false,
      status: 500,
      mensaje: "Ocurrió un error interno al cambiar el rol.",
      error: error.message,
    };
  }
};

module.exports = {
  actualizarRolDeUsuario,
};
