const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");
const Credenciales = require("../models/Credenciales");
const bcrypt = require("bcryptjs");

// Obtener todos los usuarios (solo admin)
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarioAuth = await Usuario.findById(req.usuario.id).populate("credenciales");

    if (!usuarioAuth || usuarioAuth.credenciales.rol !== "admin") {
      return res.status(403).json({ mensaje: "No tienes permisos para ver esta información" });
    }

    const usuarios = await Usuario.find()
      .populate("credenciales", "email rol")
      .select("-__v");

    res.json({ usuarios });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener usuarios", error: error.message });
  }
};

// Actualizar usuario
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol } = req.body;

    const usuario = await Usuario.findById(id).populate("credenciales");
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const credenciales = await Credenciales.findById(usuario.credenciales._id);

    if (password && !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[A-Z])(?=.*[a-z]).{8,}$/.test(password)) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.",
      });
    }

    if (rol && req.usuario.rol !== "admin") {
      return res.status(403).json({ mensaje: "No tienes permisos para cambiar roles" });
    }

    if (email) {
      const emailLimpio = email.trim().toLowerCase();
      const emailExistente = await Credenciales.findOne({ email: emailLimpio });
      if (emailExistente && emailExistente._id.toString() !== credenciales._id.toString()) {
        return res.status(400).json({ mensaje: "El email ya está registrado" });
      }
      credenciales.email = emailLimpio;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      credenciales.password = await bcrypt.hash(password, salt);
    }

    if (rol) {
      credenciales.rol = rol;
    }

    await credenciales.save();

    if (nombre) {
      usuario.nombre = nombre.trim();
      await usuario.save();
    }

    res.json({
      mensaje: "Usuario actualizado correctamente",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: credenciales.email,
        rol: credenciales.rol,
      },
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar usuario", error: error.message });
  }
};

// Eliminar usuario (sin guardar en historial)
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioSolicitante = await Usuario.findById(req.usuario.id).populate("credenciales");
    const usuarioAEliminar = await Usuario.findById(id).populate("credenciales");

    if (!usuarioAEliminar) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const mismoUsuario = usuarioSolicitante._id.toString() === id.toString();

    if (usuarioSolicitante.credenciales.rol !== "admin" && !mismoUsuario) {
      return res.status(403).json({ mensaje: "No puedes eliminar a otro usuario." });
    }

    const totalAdmins = await Credenciales.countDocuments({ rol: "admin" });
    if (
      usuarioSolicitante.credenciales.rol === "admin" &&
      mismoUsuario &&
      totalAdmins <= 1
    ) {
      return res.status(403).json({
        mensaje: "No puedes eliminarte sin antes transferir el rol a otro usuario.",
      });
    }

    await Credenciales.findByIdAndDelete(usuarioAEliminar.credenciales._id);
    await Usuario.findByIdAndDelete(id);

    res.json({ mensaje: "Usuario eliminado correctamente." });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar usuario", error: error.message });
  }
};

module.exports = {
  obtenerUsuarios,
  actualizarUsuario,
  eliminarUsuario,
};
