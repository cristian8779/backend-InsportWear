const Credenciales = require("../models/Credenciales");

// ✅ Cambiar rol con soporte para confirmación de invitaciones
const cambiarRolUsuarioPorCorreo = async (req, res) => {
  try {
    const { email, nuevoRol, esConfirmacionInvitacion } = req.body;
    const usuarioAutenticado = req.usuario;

    console.log("🔄 [cambiarRolUsuarioPorCorreo] Solicitud recibida:", {
      email,
      nuevoRol,
      esConfirmacionInvitacion,
      usuarioAutenticado: {
        email: usuarioAutenticado?.email,
        rol: usuarioAutenticado?.rol
      }
    });

    if (!email || !nuevoRol) {
      return res.status(400).json({
        mensaje: "Correo electrónico y nuevo rol son requeridos.",
      });
    }

    if (!usuarioAutenticado) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado.",
      });
    }

    const emailLimpio = email.trim().toLowerCase();
    const emailUsuarioAutenticado = usuarioAutenticado.email.trim().toLowerCase();

    // ✅ LÓGICA DE PERMISOS MEJORADA
    const esMismoUsuario = emailUsuarioAutenticado === emailLimpio;
    const esSuperAdmin = usuarioAutenticado.rol === "superAdmin";
    const esConfirmacion = esConfirmacionInvitacion === true;

    console.log("🔍 [cambiarRolUsuarioPorCorreo] Análisis de permisos:", {
      esMismoUsuario,
      esSuperAdmin,
      esConfirmacion
    });

    // ✅ PERMITIR SI:
    // 1. Es SuperAdmin (puede cambiar cualquier rol)
    // 2. Es el mismo usuario confirmando una invitación
    if (!esSuperAdmin && (!esMismoUsuario || !esConfirmacion)) {
      console.warn("🚫 [cambiarRolUsuarioPorCorreo] Permisos insuficientes");
      return res.status(403).json({
        mensaje: "No tienes permisos para cambiar el rol de otros usuarios.",
      });
    }

    // ✅ Validar roles permitidos
    const rolesPermitidos = ["usuario", "admin", "superAdmin"];
    if (!rolesPermitidos.includes(nuevoRol)) {
      return res.status(400).json({
        mensaje: `Rol inválido. Roles permitidos: ${rolesPermitidos.join(", ")}.`,
      });
    }

    // ✅ Buscar usuario en la base de datos
    const credencial = await Credenciales.findOne({ email: emailLimpio });

    if (!credencial) {
      return res.status(404).json({
        mensaje: "No se encontró un usuario registrado con ese correo.",
      });
    }

    // ✅ Verificar si ya tiene ese rol
    if (credencial.rol === nuevoRol) {
      return res.status(400).json({
        mensaje: `El usuario ya tiene el rol "${nuevoRol}".`,
      });
    }

    // ✅ Actualizar el rol
    credencial.rol = nuevoRol;
    await credencial.save();

    console.log(`✅ [cambiarRolUsuarioPorCorreo] Rol actualizado: ${emailLimpio} → ${nuevoRol}`);

    return res.status(200).json({
      ok: true,
      mensaje: `✅ El rol del usuario fue actualizado correctamente a "${nuevoRol}".`,
      usuario: {
        email: credencial.email,
        rol: credencial.rol
      }
    });

  } catch (error) {
    console.error("❌ [cambiarRolUsuarioPorCorreo] Error:", error.message);
    return res.status(500).json({
      mensaje: "Ocurrió un error al cambiar el rol. Intenta nuevamente más tarde.",
    });
  }
};

module.exports = {
  cambiarRolUsuarioPorCorreo,
};