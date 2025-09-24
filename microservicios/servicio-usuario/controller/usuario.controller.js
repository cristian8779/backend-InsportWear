const Usuario = require("../models/Usuario");
const cloudinary = require('../config/cloudinary');

// 👤 Crear usuario (con rollback de imagen en caso de error)
const crearUsuario = async (req, res) => {
  let imagenSubida = null; // Para tracking de rollback
  
  try {
    const { nombre, direccion, telefono, credenciales } = req.body;

    // Validaciones básicas ANTES de procesar imagen
    if (!nombre || !credenciales) {
      // Limpiar imagen si las validaciones básicas fallan
      if (req.file?.filename) {
        try {
          console.log(`🧹 Intentando eliminar imagen tras error de validación: ${req.file.filename}`);
          await cloudinary.uploader.destroy(req.file.filename);
          console.log(`✅ Imagen eliminada tras error de validación: ${req.file.filename}`);
        } catch (rollbackError) {
          console.error(`❌ ERROR EN ROLLBACK DE VALIDACIÓN: ${rollbackError.message}`);
        }
      }
      return res.status(400).json({
        mensaje: "El nombre y el identificador de la cuenta son necesarios para completar el registro.",
      });
    }

    // Verificar campos vacíos después del trim
    if (!nombre.trim() || !credenciales.trim()) {
      if (req.file?.filename) {
        try {
          console.log(`🧹 Intentando eliminar imagen tras campos vacíos: ${req.file.filename}`);
          await cloudinary.uploader.destroy(req.file.filename);
          console.log(`✅ Imagen eliminada tras campos vacíos: ${req.file.filename}`);
        } catch (rollbackError) {
          console.error(`❌ ERROR EN ROLLBACK - CAMPOS VACÍOS: ${rollbackError.message}`);
        }
      }
      return res.status(400).json({
        mensaje: "El nombre y las credenciales no pueden estar vacíos.",
      });
    }

    // Registrar imagen subida para posible rollback
    if (req.file?.filename) {
      imagenSubida = req.file.filename;
      console.log(`📷 Imagen de perfil registrada para rollback: ${imagenSubida}`);
    }

    // Verificar si ya existe un usuario con esas credenciales
    const existe = await Usuario.findOne({ credenciales: credenciales.trim() });
    if (existe) {
      // Rollback: eliminar imagen si el usuario ya existe
      if (imagenSubida) {
        try {
          console.log(`🧹 Intentando eliminar imagen tras usuario duplicado: ${imagenSubida}`);
          await cloudinary.uploader.destroy(imagenSubida);
          console.log(`✅ Imagen eliminada tras usuario duplicado: ${imagenSubida}`);
        } catch (rollbackError) {
          console.error(`❌ ERROR EN ROLLBACK - USUARIO DUPLICADO: ${rollbackError.message}`);
        }
      }
      return res.status(400).json({
        mensaje: "Ya existe un usuario con esas credenciales.",
      });
    }

    const nuevoUsuario = new Usuario({
  nombre: nombre.trim(),
  direccion: direccion?.trim() || "",
  telefono: telefono?.trim() || "",
  imagenPerfil: req.file?.path || req.body.imagenPerfil || "",
  public_id: req.file?.filename || "",
  credenciales: credenciales.trim(),
});


    // Intentar guardar en la base de datos
    await nuevoUsuario.save();
    
    // Si llegamos aquí, todo salió bien - no hacer rollback
    imagenSubida = null;
    
    console.log(`✅ Usuario creado exitosamente: ${nuevoUsuario.nombre}`);
    res.status(201).json(nuevoUsuario);

  } catch (error) {
    console.error("❌ Error en crearUsuario:", error);
    
    // ROLLBACK: Eliminar imagen de Cloudinary si algo falló
    if (imagenSubida) {
      try {
        console.log(`🧹 [CATCH] Intentando rollback de imagen: ${imagenSubida}`);
        await cloudinary.uploader.destroy(imagenSubida);
        console.log(`✅ [CATCH] Rollback: Imagen eliminada de Cloudinary: ${imagenSubida}`);
      } catch (rollbackError) {
        console.error(`❌ [CATCH] ERROR EN ROLLBACK DE IMAGEN: ${rollbackError.message}`);
      }
    }
    
    // Verificar si el error es por un duplicado
    if (error.code === 11000) {
      return res.status(409).json({ 
        mensaje: "Ya existe un usuario con las mismas credenciales.", 
        error: error.message 
      });
    }
    
    res.status(500).json({
      mensaje: "Ocurrió un error al intentar crear el perfil del usuario.",
      error: error.message,
    });
  }
};

// 🔍 Obtener usuario por ID de credencial
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
    console.error("❌ Error al obtener usuario por credencial:", error);
    res.status(500).json({
      mensaje: "Hubo un problema al buscar los datos del usuario.",
      error: error.message,
    });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    // Seleccionamos los campos que vamos a necesitar
    const usuario = await Usuario.findById(id).select("nombre imagenPerfil telefono direccion");

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json({ usuario });
  } catch (error) {
    console.error("❌ Error al obtener usuario por ID:", error.message);
    res.status(500).json({
      mensaje: "Error interno del servidor",
      error: error.message
    });
  }
};


// 🛠️ Actualizar datos personales del usuario (con rollback de imagen en caso de error)
const actualizarUsuario = async (req, res) => {
  let nuevaImagenSubida = null; // Para tracking de rollback
  let imagenAnterior = null; // Para restaurar en caso de error
  
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono } = req.body;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      // Si hay nueva imagen, eliminarla si el usuario no existe
      if (req.file?.filename) {
        try {
          console.log(`🧹 Intentando eliminar imagen - usuario no encontrado: ${req.file.filename}`);
          await cloudinary.uploader.destroy(req.file.filename);
          console.log(`✅ Nueva imagen eliminada - usuario no encontrado: ${req.file.filename}`);
        } catch (rollbackError) {
          console.error(`❌ ERROR EN ROLLBACK - USUARIO NO ENCONTRADO: ${rollbackError.message}`);
        }
      }
      return res.status(404).json({
        mensaje: "No pudimos encontrar tu perfil. Verifica tu información.",
      });
    }

    // Registrar imágenes para posible rollback
    if (req.file?.filename) {
      nuevaImagenSubida = req.file.filename;
      imagenAnterior = { public_id: usuario.public_id, imagenPerfil: usuario.imagenPerfil };
      console.log(`📷 Nueva imagen de perfil registrada para rollback: ${nuevaImagenSubida}`);
      console.log(`📷 Imagen anterior registrada para rollback: ${imagenAnterior.public_id}`);
    }

    // Actualizar campos básicos
    if (nombre && nombre.trim()) usuario.nombre = nombre.trim();
    if (direccion !== undefined) usuario.direccion = direccion?.trim() || "";
    if (telefono !== undefined) usuario.telefono = telefono?.trim() || "";

    // Si hay nueva imagen, actualizar los campos de imagen
    if (req.file?.path) {
      usuario.imagenPerfil = req.file.path;
      usuario.public_id = req.file.filename;
    }

    // Intentar guardar los cambios
    await usuario.save();

    // Si llegamos aquí, la actualización fue exitosa
    // Eliminar la imagen anterior de Cloudinary si había una nueva
    if (req.file && imagenAnterior?.public_id) {
      try {
        await cloudinary.uploader.destroy(imagenAnterior.public_id);
        console.log(`🗑️ Imagen anterior eliminada de Cloudinary: ${imagenAnterior.public_id}`);
      } catch (cleanupError) {
        console.error(`⚠️ Error al limpiar imagen anterior: ${cleanupError.message}`);
      }
    }
    
    // No hacer rollback ya que todo salió bien
    nuevaImagenSubida = null;
    
    console.log(`✅ Usuario actualizado exitosamente: ${usuario.nombre}`);
    res.json({
      mensaje: "Tu información fue actualizada correctamente.",
      usuario,
    });

  } catch (error) {
    console.error("❌ Error en actualizarUsuario:", error);
    
    // ROLLBACK: Eliminar nueva imagen si algo falló
    if (nuevaImagenSubida) {
      try {
        console.log(`🧹 [CATCH] Intentando rollback de nueva imagen: ${nuevaImagenSubida}`);
        await cloudinary.uploader.destroy(nuevaImagenSubida);
        console.log(`✅ [CATCH] Rollback: Nueva imagen eliminada de Cloudinary: ${nuevaImagenSubida}`);
      } catch (rollbackError) {
        console.error(`❌ [CATCH] ERROR EN ROLLBACK DE NUEVA IMAGEN: ${rollbackError.message}`);
      }
    }
    
    res.status(500).json({
      mensaje: "No fue posible actualizar tus datos en este momento.",
      error: error.message,
    });
  }
};

// 🗑️ Eliminar usuario (mejorado con eliminación de imagen)
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        mensaje: "No encontramos un perfil con ese identificador.",
      });
    }

    // 🗑️ Eliminar imagen de perfil de Cloudinary si existe
    if (usuario.public_id) {
      try {
        await cloudinary.uploader.destroy(usuario.public_id);
        console.log(`🗑️ Imagen de perfil eliminada de Cloudinary: ${usuario.public_id}`);
      } catch (cleanupError) {
        console.error(`⚠️ Error al eliminar imagen de perfil: ${cleanupError.message}`);
        // Continuar con la eliminación aunque falle la limpieza de imagen
      }
    }
    // Fallback para el método anterior (por compatibilidad)
    else if (usuario.imagenPerfil && usuario.imagenPerfil.includes('res.cloudinary.com')) {
      try {
        const publicId = usuario.imagenPerfil.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`usuarios/${publicId}`);
        console.log(`🗑️ Imagen de perfil eliminada (método anterior): usuarios/${publicId}`);
      } catch (cleanupError) {
        console.error(`⚠️ Error al eliminar imagen (método anterior): ${cleanupError.message}`);
      }
    }

    // 🗑️ Eliminar el usuario de la base de datos
    await Usuario.findByIdAndDelete(id);

    console.log(`✅ Usuario ${id} eliminado completamente (incluyendo imagen).`);
    res.json({ mensaje: "Tu cuenta ha sido eliminada correctamente." });

  } catch (error) {
    console.error("❌ Error en eliminarUsuario:", error);
    res.status(500).json({
      mensaje: "No fue posible eliminar tu cuenta en este momento.",
      error: error.message,
    });
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarioPorCredencial,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
};