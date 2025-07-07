
const axios = require("axios");
const Anuncio = require("../models/Anuncio");
const cloudinary = require("../config/cloudinary");

const PRODUCTO_SERVICE_URL = process.env.PRODUCTO_SERVICE_URL;
const CATEGORIA_SERVICE_URL = process.env.CATEGORIA_SERVICE_URL;
const USUARIO_SERVICE_URL = process.env.USUARIO_SERVICE_URL;

exports.obtenerActivos = async (req, res) => {
  try {
    const hoy = new Date();
    const activos = await Anuncio.find({
      fechaInicio: { $lte: hoy },
      fechaFin: { $gte: hoy },
    }).limit(3);
    res.json(activos);
  } catch (error) {
    console.error("Error al obtener anuncios:", error);
    res.status(500).json({ error: "Error al obtener anuncios" });
  }
};


exports.crearAnuncio = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.usuario;
    if (!['admin', 'superAdmin'].includes(rol))
      return res.status(403).json({ error: "No permitido" });

    const { fechaInicio, fechaFin, productoId, categoriaId } = req.body;
    const hoy = new Date();

    // ...validaciones previas...

    // Subir imagen a Cloudinary
    let imagenUrl = "";
    if (req.file && req.file.path) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "anuncios"
      });
      imagenUrl = uploadResult.secure_url;
    } else {
      return res.status(400).json({ error: "Imagen requerida" });
    }


    // Lógica deeplink
    let deeplink = '';
    if (productoId) {
      deeplink = `/producto/${productoId}`;
    } else if (categoriaId) {
      deeplink = `/categoria/${categoriaId}`;
    } else {
      deeplink = '/';
    }

    const anuncio = new Anuncio({
      imagen: imagenUrl,
      deeplink,
      fechaInicio,
      fechaFin,
      productoId,
      categoriaId,
      usuarioId
    });

    await anuncio.save();
    res.status(201).json(anuncio);

  } catch (error) {
    console.error("Error al crear anuncio:", error);
    res.status(500).json({ error: "Error interno al crear anuncio" });
  }
};


exports.eliminarAnuncio = async (req, res) => {
  const { rol } = req.usuario;
  if (!['admin', 'superAdmin'].includes(rol))
    return res.status(403).json({ error: "No permitido" });

  const anuncio = await Anuncio.findByIdAndDelete(req.params.id);
  if (!anuncio) return res.status(404).json({ error: "No encontrado" });
  res.json({ mensaje: "Eliminado" });
};
