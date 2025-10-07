const Resena = require('../models/Resena');
const Producto = require('../models/Producto');
const axios = require('axios');

// Crear reseña
const crearResena = async (req, res) => {
  try {
    const { productoId } = req.params;
    const { comentario, calificacion } = req.body;

    // Validaciones básicas
    if (!comentario || !calificacion) {
      return res.status(400).json({ mensaje: 'Por favor, completa el comentario y la calificación.' });
    }

    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ mensaje: 'La calificación debe ser entre 1 y 5 estrellas.' });
    }

    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({ mensaje: 'El producto no existe.' });
    }

    const existe = await Resena.findOne({ usuario: req.usuario.id, producto: productoId });
    if (existe) {
      return res.status(400).json({ mensaje: 'Ya has dejado una reseña para este producto.' });
    }

    // 🔹 Intentamos obtener el nombre e imagen del usuario actual
    let usuarioNombre = "Usuario desconocido";
    let usuarioImagen = "";

    try {
      const respuesta = await axios.get(`${process.env.USUARIO_SERVICE_URL}/api/usuario/${req.usuario.id}`);
      const data = respuesta.data;
      
      // Los datos están dentro de data.usuario
      usuarioNombre = data.usuario?.nombre || usuarioNombre;
      usuarioImagen = data.usuario?.imagenPerfil || usuarioImagen;
    } catch (err) {
      console.warn("⚠️ No se pudo obtener info del usuario:", err.message);
    }

    // 🔹 Creamos la reseña guardando también el nombre y la imagen
    const nuevaResena = new Resena({
      usuario: req.usuario.id,
      usuarioNombre,
      usuarioImagen,
      producto: productoId,
      comentario,
      calificacion
    });

    await nuevaResena.save();

    res.status(201).json({
      mensaje: '¡Gracias por tu opinión! Tu reseña fue publicada correctamente.',
      resena: nuevaResena
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Ocurrió un error al enviar tu reseña.',
      error: error.message
    });
  }
};


const obtenerResenasPorProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    
    const resenas = await Resena.find({ producto: productoId }).sort({ fecha: -1 });

    const resenasConUsuario = await Promise.all(
      resenas.map(async (resena) => {
        let usuario = { nombre: "Usuario desconocido", imagenPerfil: "" };
        
        try {
          const { data } = await axios.get(
            `${process.env.USUARIO_SERVICE_URL}/api/usuario/${resena.usuario}`
          );
          
          // Los datos están dentro de data.usuario
          usuario = {
            nombre: data.usuario?.nombre || "Sin nombre",
            imagenPerfil: data.usuario?.imagenPerfil || ""
          };
        } catch (error) {
          console.warn(`⚠️ No se pudo obtener info del usuario ${resena.usuario}`);
        }

        return { ...resena.toObject(), usuario };
      })
    );

    res.json({ mensaje: 'Reseñas cargadas correctamente', resenas: resenasConUsuario });
  } catch (error) {
    res.status(500).json({ 
      mensaje: 'No pudimos obtener las reseñas en este momento. Intenta nuevamente más tarde.', 
      error: error.message 
    });
  }
};

// Actualizar reseña del usuario actual
const actualizarResena = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario, calificacion } = req.body;

    const resena = await Resena.findById(id);
    if (!resena) {
      return res.status(404).json({ mensaje: 'No encontramos tu reseña.' });
    }

    if (resena.usuario.toString() !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para editar esta reseña.' });
    }

    if (comentario) resena.comentario = comentario;
    if (calificacion) {
      if (calificacion < 1 || calificacion > 5) {
        return res.status(400).json({ mensaje: 'La calificación debe estar entre 1 y 5 estrellas.' });
      }
      resena.calificacion = calificacion;
    }

    await resena.save();

    res.json({ mensaje: 'Tu reseña fue actualizada correctamente.', resena });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar tu reseña. Por favor intenta más tarde.',
      error: error.message
    });
  }
};

// Eliminar reseña del usuario actual
const eliminarResena = async (req, res) => {
  try {
    const { id, productoId } = req.params;

    const resena = await Resena.findById(id);
    if (!resena) {
      return res.status(404).json({ mensaje: 'La reseña que intentas eliminar no existe.' });
    }

    if (resena.producto.toString() !== productoId) {
      return res.status(400).json({ mensaje: 'La reseña no pertenece a este producto.' });
    }

    if (resena.usuario.toString() !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes eliminar esta reseña porque no te pertenece.' });
    }

    await Resena.findByIdAndDelete(id);

    res.json({ mensaje: 'Tu reseña fue eliminada exitosamente.' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Ocurrió un error al eliminar la reseña. Inténtalo nuevamente.',
      error: error.message
    });
  }
};

module.exports = {
  crearResena,
  obtenerResenasPorProducto,
  actualizarResena,
  eliminarResena
};