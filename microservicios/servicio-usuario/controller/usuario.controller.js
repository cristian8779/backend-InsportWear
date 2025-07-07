const Usuario = require("../models/Usuario");

// Crear usuario (desde servicio de autenticación)
const crearUsuario = async (req, res) => {
  try {
    const { nombre, direccion, telefono, imagenPerfil, credenciales } = req.body;

    if (!nombre || !credenciales) {
      return res.status(400).json({
        mensaje: "El nombre y el identificador de la cuenta son necesarios para completar el registro.",
      });
    }

    const nuevoUsuario = new Usuario({
      nombre,
      direccion: direccion || "",
      telefono: telefono || "",
      imagenPerfil: imagenPerfil || "",
      credenciales,
    });

    await nuevoUsuario.save();

    res.status(201).json(nuevoUsuario);
  } catch (error) {
    res.status(500).json({
      mensaje: "Ocurrió un error al intentar crear el perfil del usuario.",
      error: error.message,
    });
  }
};

// Obtener usuario por ID de credencial
const obtenerUsuarioPorCredencial = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findOne({ credenciales: id });
    if (!usuario) {
      return res.status(404).json({
        mensaje: "No se encontró ningún usuario asociado a esta cuenta.",
      });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({
      mensaje: "Hubo un problema al buscar los datos del usuario.",
      error: error.message,
    });
  }
};

// ✅ Corregido: Obtener usuario por ID (para microservicio de reseñas o ventas)
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id).select("nombre imagenPerfil");

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // ✅ Corregido aquí: se envuelve dentro de { usuario }
    res.json({ usuario });
  } catch (error) {
    console.error("❌ Error al obtener usuario por ID:", error.message);
    res.status(500).json({
      mensaje: "Error interno del servidor",
      error: error.message
    });
  }
};

// Actualizar datos personales del usuario
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, imagenPerfil } = req.body;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        mensaje: "No pudimos encontrar tu perfil. Verifica tu información.",
      });
    }

    if (nombre) usuario.nombre = nombre.trim();
    if (direccion) usuario.direccion = direccion.trim();
    if (telefono) usuario.telefono = telefono.trim();
    if (imagenPerfil) usuario.imagenPerfil = imagenPerfil.trim();

    await usuario.save();

    res.json({
      mensaje: "Tu información fue actualizada correctamente.",
      usuario,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "No fue posible actualizar tus datos en este momento.",
      error: error.message,
    });
  }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        mensaje: "No encontramos un perfil con ese identificador.",
      });
    }

    await Usuario.findByIdAndDelete(id);

    res.json({ mensaje: "Tu cuenta ha sido eliminada correctamente." });
  } catch (error) {
    res.status(500).json({
      mensaje: "No fue posible eliminar tu cuenta en este momento.",
      error: error.message,
    });
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarioPorCredencial,
  obtenerUsuarioPorId, // ✅ corregido
  actualizarUsuario,
  eliminarUsuario,
};
