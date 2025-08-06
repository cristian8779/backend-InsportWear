const axios = require("axios");
const Anuncio = require("../models/Anuncio");
const cloudinary = require("../config/cloudinary");

// Servicios externos para obtener productos y categorías
const { obtenerProductos, obtenerCategorias } = require("../utils/externalServices");

// ✅ Obtener hasta 3 anuncios activos por fecha
const obtenerActivos = async (req, res) => {
  try {
    const hoy = new Date();
    const activos = await Anuncio.find({
      fechaInicio: { $lte: hoy },
      fechaFin: { $gte: hoy },
    }).limit(3);
    res.json(activos);
  } catch (error) {
    console.error("❌ Error al obtener anuncios:", error);
    res.status(500).json({
      error: "Hubo un problema al obtener los anuncios activos. Intenta nuevamente más tarde.",
    });
  }
};

// ✅ Crear un nuevo anuncio (requiere rol admin o superAdmin)
const crearAnuncio = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.usuario;

    if (!["admin", "superAdmin"].includes(rol)) {
      return res.status(403).json({
        error: "No tienes permisos para crear anuncios.",
      });
    }

    const { fechaInicio, fechaFin, productoId, categoriaId } = req.body;

    if (!productoId && !categoriaId) {
      return res.status(400).json({
        error: "Debes asociar el anuncio a un producto o una categoría.",
      });
    }

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: "Debes especificar la fecha de inicio y la de finalización del anuncio.",
      });
    }

    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);

    if (fechaFinDate < fechaInicioDate) {
      return res.status(400).json({
        error: "La fecha de finalización no puede ser anterior a la de inicio.",
      });
    }

    if (!req.file || !req.file.path || !req.file.filename) {
      return res.status(400).json({
        error: "Debes subir una imagen válida para el anuncio.",
      });
    }

    const imagenUrl = req.file.path;
    const publicId = req.file.filename;

    // Validar si ya existe uno con fechas solapadas
    const filtroSolapado = {
      $or: [
        productoId ? { productoId } : null,
        categoriaId ? { categoriaId } : null,
      ].filter(Boolean),
      fechaInicio: { $lte: fechaFinDate },
      fechaFin: { $gte: fechaInicioDate },
    };

    const anuncioExistente = await Anuncio.findOne(filtroSolapado);
    if (anuncioExistente) {
      return res.status(409).json({
        error: "Ya existe un anuncio activo para ese producto o categoría en ese rango de fechas.",
      });
    }

    let deeplink = "/";
    if (productoId) deeplink = `/producto/${productoId}`;
    else if (categoriaId) deeplink = `/categoria/${categoriaId}`;

    const anuncio = new Anuncio({
      imagen: imagenUrl,
      publicId,
      deeplink,
      fechaInicio: fechaInicioDate,
      fechaFin: fechaFinDate,
      productoId: productoId || null,
      categoriaId: categoriaId || null,
      usuarioId,
    });

    await anuncio.save();
    res.status(201).json(anuncio);

  } catch (error) {
    console.error("❌ Error interno al crear el anuncio:", error);
    res.status(500).json({
      error: "No se pudo crear el anuncio por un problema interno. Intenta nuevamente más tarde.",
    });
  }
};

// ✅ Eliminar anuncio
const eliminarAnuncio = async (req, res) => {
  try {
    const { rol } = req.usuario;

    if (!["admin", "superAdmin"].includes(rol)) {
      return res.status(403).json({
        error: "No tienes permisos para eliminar anuncios.",
      });
    }

    const anuncio = await Anuncio.findById(req.params.id);
    if (!anuncio) {
      return res.status(404).json({
        error: "No se encontró el anuncio solicitado.",
      });
    }

    if (anuncio.publicId) {
      try {
        await cloudinary.uploader.destroy(anuncio.publicId, {
          resource_type: 'image',
        });
      } catch (error) {
        console.warn("⚠️ No se pudo eliminar la imagen de Cloudinary:", error);
      }
    }

    await Anuncio.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "El anuncio fue eliminado correctamente." });

  } catch (error) {
    console.error("❌ Error al eliminar anuncio:", error);
    res.status(500).json({
      error: "No se pudo eliminar el anuncio. Intenta nuevamente más tarde.",
    });
  }
};

// ✅ Obtener productos desde microservicio
const obtenerProductosDesdeServicio = async (req, res) => {
  try {
    const productos = await obtenerProductos();
    res.json({ productos });
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    res.status(500).json({
      error: "No se pudieron obtener los productos.",
    });
  }
};

// ✅ Obtener categorías desde microservicio
const obtenerCategoriasDesdeServicio = async (req, res) => {
  try {
    const categorias = await obtenerCategorias();
    res.json({ categorias });
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error);
    res.status(500).json({
      error: "No se pudieron obtener las categorías.",
    });
  }
};

module.exports = {
  obtenerActivos,
  crearAnuncio,
  eliminarAnuncio,
  obtenerProductos: obtenerProductosDesdeServicio,
  obtenerCategorias: obtenerCategoriasDesdeServicio,
};
