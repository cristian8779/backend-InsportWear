const Usuario = require("../models/Usuario");
const cloudinary = require("../config/cloudinary");
const axios = require("axios");

// Crear perfil desde microservicio de autenticación
const crearPerfil = async (req, res) => {
  try {
    const { nombre, credenciales } = req.body;

    if (!nombre || !credenciales) {
      return res.status(400).json({
        mensaje: "Por favor, asegurate de completar tu nombre y tus credenciales.",
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
      mensaje: "Tuvimos un problema al guardar tu perfil. Intentalo de nuevo en unos minutos.",
    });
  }
};

// Obtener perfil del usuario autenticado
const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select("-__v");

    if (!usuario) {
      return res.status(404).json({
        mensaje: "No pudimos encontrar tu perfil. ¿Ya lo creaste?",
      });
    }

    try {
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
      console.error("❌ Error al obtener credenciales:", error.message);
      res.status(502).json({
        mensaje: "No pudimos obtener la información de tu cuenta. Intentá más tarde.",
      });
    }
  } catch (error) {
    console.error("❌ Error al obtener perfil:", error.message);
    res.status(500).json({
      mensaje: "Algo salió mal al cargar tu perfil. Intentalo nuevamente más tarde.",
    });
  }
};

// Actualizar imagen de perfil
const actualizarImagenPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "No encontramos tu cuenta para actualizar la imagen.",
      });
    }

    if (!req.file || !req.file.path || !req.file.filename) {
      return res.status(400).json({
        mensaje: "Por favor, seleccioná una imagen válida para subir.",
      });
    }

    // Eliminar imagen anterior si existe
    if (usuario.cloudinaryId) {
      await cloudinary.uploader.destroy(usuario.cloudinaryId);
    }

    usuario.imagenPerfil = req.file.path; // La URL o path de Cloudinary
    usuario.cloudinaryId = req.file.filename; // Asegurate de que esto sea el public_id

    await usuario.save();

    res.json({
      mensaje: "¡Tu imagen de perfil fue actualizada con éxito!",
      imagenUrl: usuario.imagenPerfil,
    });
  } catch (error) {
    console.error("❌ Error al actualizar imagen:", error.message);
    res.status(500).json({
      mensaje: "No pudimos actualizar tu imagen en este momento. Probá de nuevo más tarde.",
    });
  }
};

// Eliminar imagen de perfil
const eliminarImagenPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario || !usuario.cloudinaryId) {
      return res.status(404).json({
        mensaje: "No tenés una imagen guardada para eliminar.",
      });
    }

    await cloudinary.uploader.destroy(usuario.cloudinaryId);

    usuario.imagenPerfil = "";
    usuario.cloudinaryId = "";
    await usuario.save();

    res.json({ mensaje: "Tu imagen de perfil fue eliminada correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar imagen:", error.message);
    res.status(500).json({
      mensaje: "No pudimos eliminar tu imagen en este momento. Intentá nuevamente más tarde.",
    });
  }
};

// Actualizar datos básicos del perfil
const actualizarPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "No encontramos tu perfil para actualizarlo.",
      });
    }

    const { nombre, direccion, telefono } = req.body;

    if (!nombre && !direccion && !telefono) {
      return res.status(400).json({
        mensaje: "Por favor, indicá qué parte de tu perfil querés modificar.",
      });
    }

    if (nombre) usuario.nombre = nombre.trim();
    if (direccion) usuario.direccion = direccion.trim();
    if (telefono) usuario.telefono = telefono.trim();

    await usuario.save();

    res.json({
      mensaje: "¡Tu perfil fue actualizado exitosamente!",
      perfil: usuario,
    });
  } catch (error) {
    console.error("❌ Error al actualizar perfil:", error.message);
    res.status(500).json({
      mensaje: "No pudimos actualizar tu perfil. Intentá más tarde.",
    });
  }
};

module.exports = {
  crearPerfil,
  obtenerPerfil,
  actualizarImagenPerfil,
  eliminarImagenPerfil,
  actualizarPerfil,
};
