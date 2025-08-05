const Usuario = require("../models/Usuario");

const obtenerUsuariosPorCredenciales = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        mensaje: "Debes enviar un array de IDs de credenciales.",
      });
    }

    const usuarios = await Usuario.find(
      { credenciales: { $in: ids } },
      { nombre: 1, credenciales: 1 }
    );

    const resultado = usuarios.map((u) => ({
      credenciales: u.credenciales.toString(),
      nombre: u.nombre,
    }));

    res.status(200).json({ usuarios: resultado });
  } catch (error) {
    console.error("❌ Error al obtener usuarios por credenciales:", error.message);
    res.status(500).json({
      mensaje: "Ocurrió un error al buscar los usuarios.",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerUsuariosPorCredenciales,
};
