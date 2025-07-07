const Usuario = require("../models/Usuario");
const cloudinary = require("../config/cloudinary");
const axios = require("axios");

// Crear perfil desde microservicio de autenticación
const crearPerfil = async (req, res) => {
  try {
    const { nombre, credenciales } = req.body;

    if (!nombre || !credenciales) {
      return res.status(400).json({
        mensaje: "El nombre y la referencia a las credenciales son obligatorios.",
      });
    }

    const nuevoUsuario = new Usuario({
      nombre: nombre.trim(),
      credenciales,
    });

    await nuevoUsuario.save();

    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error("❌ Error al crear perfil de usuario:", error.message);
    res.status(500).json({
      mensaje: "No se pudo crear el perfil del usuario.",
    });
  }
};

// Obtener perfil del usuario autenticado
const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select("-__v");

    if (!usuario) {
      return res.status(404).json({ mensaje: "No se encontró el perfil del usuario solicitado." });
    }

    const response = await axios.get(
      `${process.env.AUTH_SERVICE_URL}/api/auth/credencial/${usuario.credenciales}`
    );
    const credencial = response.data;

    res.json({
      ...usuario.toObject(),
      credenciales: {
        email: credencial.email,
        rol: credencial.rol,
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener perfil:", error.message);
    res.status(500).json({
      mensaje: "Hubo un error al obtener el perfil del usuario.",
      error: error.message,
    });
  }
};

// Actualizar imagen de perfil
const actualizarImagenPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: "El usuario no fue encontrado en la base de datos." });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({ mensaje: "Debes proporcionar una imagen válida para actualizar." });
    }

    if (usuario.cloudinaryId) {
      await cloudinary.uploader.destroy(usuario.cloudinaryId);
    }

    usuario.imagenPerfil = req.file.path;
    usuario.cloudinaryId = req.file.filename;

    await usuario.save();

    res.json({
      mensaje: "Tu imagen de perfil se actualizó correctamente.",
      imagenUrl: usuario.imagenPerfil,
    });
  } catch (error) {
    console.error("❌ Error al actualizar imagen:", error.message);
    res.status(500).json({
      mensaje: "Ocurrió un error al intentar actualizar la imagen de perfil.",
      error: error.message,
    });
  }
};

// Eliminar imagen de perfil
const eliminarImagenPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario || !usuario.cloudinaryId) {
      return res.status(404).json({
        mensaje: "No se encontró ninguna imagen asociada al usuario para eliminar.",
      });
    }

    await cloudinary.uploader.destroy(usuario.cloudinaryId);

    usuario.imagenPerfil = "";
    usuario.cloudinaryId = "";
    await usuario.save();

    res.json({ mensaje: "La imagen de perfil fue eliminada correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar imagen:", error.message);
    res.status(500).json({
      mensaje: "Ocurrió un error al intentar eliminar la imagen de perfil.",
      error: error.message,
    });
  }
};

module.exports = {
  crearPerfil,
  obtenerPerfil,
  actualizarImagenPerfil,
  eliminarImagenPerfil,
};
