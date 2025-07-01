const Usuario = require("../models/Usuario");
const cloudinary = require("../config/cloudinary");

// Obtener perfil
const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id)
      .populate("credenciales", "email rol -_id") // extrae email y rol
      .select("-__v");

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener el perfil", error: error.message });
  }
};

// Actualizar imagen de perfil
const actualizarImagenPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({ mensaje: "No se proporcionó ninguna imagen válida" });
    }

    // Eliminar imagen anterior de Cloudinary si existe
    if (usuario.cloudinaryId) {
      await cloudinary.uploader.destroy(usuario.cloudinaryId);
    }

    // Subir nueva imagen
    usuario.imagenPerfil = req.file.path;
    usuario.cloudinaryId = req.file.filename;

    await usuario.save();

    res.json({
      mensaje: "Imagen de perfil actualizada correctamente",
      imagenUrl: usuario.imagenPerfil,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar la imagen de perfil", error: error.message });
  }
};

// Eliminar imagen de perfil
const eliminarImagenPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario || !usuario.cloudinaryId) {
      return res.status(404).json({ error: "No hay imagen para eliminar" });
    }

    await cloudinary.uploader.destroy(usuario.cloudinaryId);

    usuario.imagenPerfil = "";
    usuario.cloudinaryId = "";

    await usuario.save();

    res.json({ mensaje: "Imagen eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la imagen de perfil", detalles: error.message });
  }
};

module.exports = {
  obtenerPerfil,
  actualizarImagenPerfil,
  eliminarImagenPerfil,
};
