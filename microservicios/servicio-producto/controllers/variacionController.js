const Producto = require('../models/Producto');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const crypto = require('crypto');

/* -------------------- Helpers -------------------- */

// Generar hash único basado en el nombre del archivo original y su tamaño
function generateUniqueHash(file) {
    try {
        console.log(`🔍 Generando hash único para archivo subido a Cloudinary`);
        
        if (!file.originalname || !file.size) {
            console.log(`⚠️ Faltan datos del archivo: originalname=${file.originalname}, size=${file.size}`);
            return null;
        }
        
        const data = `${file.originalname}-${file.size}-${file.mimetype}`;
        const hashSum = crypto.createHash('md5');
        hashSum.update(data);
        const hash = hashSum.digest('hex');
        
        console.log(`✅ Hash generado: ${hash} (basado en: ${data})`);
        return hash;
        
    } catch (error) {
        console.error(`❌ Error generando hash único:`, error.message);
        return null;
    }
}

// Determina si una variación "usa" un hash o public_id dado
function variationUsesHash(variacion, hash, public_id) {
    if (!variacion) return false;
    if (hash && variacion.hashImagen === hash) return true;

    if (public_id) {
        if (variacion.imagen && variacion.imagen.public_id === public_id) return true;
        if (variacion.imagenes && Array.isArray(variacion.imagenes)) {
            return variacion.imagenes.some(img => img && img.public_id === public_id);
        }
    }
    return false;
}

// Cuenta cuántas variaciones (excluyendo opcionalmente una) usan una imagen
function countImageUsage(producto, hash = null, public_id = null, excludeVariacionId = null) {
    let count = 0;
    for (const v of producto.variaciones) {
        if (excludeVariacionId && v._id && v._id.toString() === excludeVariacionId.toString()) continue;
        if (variationUsesHash(v, hash, public_id)) count++;
    }
    return count;
}

// Borra de Cloudinary solo las imágenes no usadas por otras variaciones
async function safeDeleteImage(producto, imagen = null, excludeVariacionId = null) {
    if (!imagen || !imagen.public_id) return;
    
    const usage = countImageUsage(producto, null, imagen.public_id, excludeVariacionId);
    if (usage === 0) {
        try {
            await cloudinary.uploader.destroy(imagen.public_id);
            console.log(`🗑️ Imagen ${imagen.public_id} eliminada de Cloudinary.`);
        } catch (err) {
            console.error(`⚠️ Error al eliminar ${imagen.public_id} de Cloudinary:`, err.message);
        }
    } else {
        console.log(`ℹ️ No se elimina ${imagen.public_id}: usada por ${usage} otras variaciones.`);
    }
}

// Elimina todas las imágenes de una variación
async function safeDeleteVariacionImages(producto, variacion, excludeVariacionId = null) {
    if (!variacion) return;
    
    console.log(`🧹 Limpiando imágenes de variación ${variacion._id}...`);
    
    if (variacion.imagen) await safeDeleteImage(producto, variacion.imagen, excludeVariacionId);
    if (variacion.imagenes && Array.isArray(variacion.imagenes)) {
        for (const imagen of variacion.imagenes) {
            if (imagen && imagen.public_id) await safeDeleteImage(producto, imagen, excludeVariacionId);
        }
    }

    console.log(`✅ Limpieza de imágenes completada para variación ${variacion._id}`);
}

// Procesa archivos de Cloudinary con manejo de errores
async function safeProcessCloudinaryFiles(files = [], producto) {
    const uploadedFiles = [];

    try {
        if (!Array.isArray(files) || files.length === 0) return { imagen: null, hashImagen: null };

        const file = files[0];
        uploadedFiles.push(file);

        if (!file.path || !file.path.startsWith('https://res.cloudinary.com')) {
            throw new Error("El archivo no es una URL válida de Cloudinary");
        }
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            throw new Error(`Tipo de archivo no válido: ${file.mimetype}`);
        }

        if (files.length > 1) {
            for (let i = 1; i < files.length; i++) {
                try { if (files[i].filename) await cloudinary.uploader.destroy(files[i].filename); } 
                catch (_) {}
            }
        }

        const fileHash = generateUniqueHash(file);
        if (!fileHash) throw new Error("No se pudo generar el hash único.");

        const variacionDuplicada = producto.variaciones.find(v => v && v.hashImagen === fileHash);

        if (variacionDuplicada) {
            let imagenExistente = variacionDuplicada.imagen || (variacionDuplicada.imagenes && variacionDuplicada.imagenes[0]);
            if (imagenExistente) {
                await cloudinary.uploader.destroy(file.filename);
                return { imagen: imagenExistente, hashImagen: fileHash };
            }
        }

        return { imagen: { url: file.path, public_id: file.filename }, hashImagen: fileHash };

    } catch (err) {
        for (const file of uploadedFiles) {
            try { if (file.filename) await cloudinary.uploader.destroy(file.filename); } catch (_) {}
        }
        throw new Error(`Error procesando imagen: ${err.message}`);
    }
}

// Limpieza de archivos de Cloudinary
async function cleanupCloudinaryFiles(files) {
    if (!files || !Array.isArray(files)) return;
    for (const file of files) {
        try { if (file.filename) await cloudinary.uploader.destroy(file.filename); } 
        catch (_) {}
    }
}

/* -------------------- Controlador -------------------- */

const extraerColor = (body) => {
    let color;
    try {
        if (typeof body.color === 'string') color = JSON.parse(body.color);
        else if (typeof body.color === 'object' && body.color !== null) color = body.color;
        else color = { hex: body.colorHex || body['color[hex]'], nombre: body.colorNombre || body['color[nombre]'] };
    } catch (err) {
        return null;
    }

    if (color && typeof color.hex === 'string' && typeof color.nombre === 'string') return color;
    return null;
};

const agregarVariacion = async (req, res) => {
    try {
        let { tallaLetra, tallaNumero, stock, precio } = req.body;
        stock = Number(stock); precio = Number(precio);
        const color = extraerColor(req.body);

        if (!tallaLetra && !tallaNumero) { await cleanupCloudinaryFiles(req.files); return res.status(400).json({ mensaje: '🚫 Necesitamos al menos una talla.' }); }
        if (isNaN(stock) || stock < 0) { await cleanupCloudinaryFiles(req.files); return res.status(400).json({ mensaje: '🚫 Stock inválido.' }); }
        if (isNaN(precio) || precio < 0) { await cleanupCloudinaryFiles(req.files); return res.status(400).json({ mensaje: '🚫 Precio inválido.' }); }
        if (!color) { await cleanupCloudinaryFiles(req.files); return res.status(400).json({ mensaje: '🚫 Color obligatorio.' }); }

        const producto = await Producto.findById(req.params.productoId);
        if (!producto) { await cleanupCloudinaryFiles(req.files); return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' }); }

        const nuevaVariacion = { _id: req.body._id || new mongoose.Types.ObjectId(), tallaLetra, tallaNumero, stock, precio, color };

        if (req.files && req.files.length > 0) {
            try {
                const uploadResult = await safeProcessCloudinaryFiles(req.files, producto);
                if (uploadResult.imagen) {
                    nuevaVariacion.imagenes = [uploadResult.imagen];
                    nuevaVariacion.imagen = uploadResult.imagen;
                    nuevaVariacion.hashImagen = uploadResult.hashImagen;
                }
            } catch (err) {
                return res.status(500).json({ mensaje: '❌ Error procesando imagen.', error: err.message });
            }
        }

        producto.variaciones.push(nuevaVariacion);
        await producto.save();
        res.status(201).json({ mensaje: '✅ Variación agregada.', producto });

    } catch (error) {
        await cleanupCloudinaryFiles(req.files);
        res.status(500).json({ mensaje: '❌ Error agregando variación.', error: error.message });
    }
};

const obtenerVariaciones = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        res.status(200).json({ mensaje: '✅ Variaciones obtenidas.', variaciones: producto.variaciones });
    } catch (error) {
        res.status(500).json({ mensaje: '❌ Error interno.', error: error.message });
    }
};

const actualizarVariacion = async (req, res) => {
    try {
        const { productoId, id } = req.params;
        const producto = await Producto.findById(productoId);
        if (!producto) { await cleanupCloudinaryFiles(req.files); return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' }); }

        const variacion = producto.variaciones.id(id);
        if (!variacion) { await cleanupCloudinaryFiles(req.files); return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' }); }

        let { tallaLetra, tallaNumero, stock, precio } = req.body;
        if (stock !== undefined) { stock = Number(stock); if (isNaN(stock) || stock < 0) { await cleanupCloudinaryFiles(req.files); return res.status(400).json({ mensaje: '🚫 Stock inválido.' }); } }
        if (precio !== undefined) { precio = Number(precio); if (isNaN(precio) || precio < 0) { await cleanupCloudinaryFiles(req.files); return res.status(400).json({ mensaje: '🚫 Precio inválido.' }); } }
        const color = extraerColor(req.body);

        if (tallaLetra !== undefined) variacion.tallaLetra = tallaLetra;
        if (tallaNumero !== undefined) variacion.tallaNumero = tallaNumero;
        if (stock !== undefined) variacion.stock = stock;
        if (precio !== undefined) variacion.precio = precio;
        if (color) variacion.color = color;

        if (req.files && req.files.length > 0) {
            try {
                const uploadResult = await safeProcessCloudinaryFiles(req.files, producto);
                const newHash = uploadResult.hashImagen;
                const oldHash = variacion.hashImagen;

                if (newHash && newHash !== oldHash) {
                    await safeDeleteVariacionImages(producto, variacion, variacion._id);
                    variacion.imagen = uploadResult.imagen;
                    variacion.imagenes = [uploadResult.imagen];
                    variacion.hashImagen = newHash;
                }
            } catch (err) {
                return res.status(500).json({ mensaje: '❌ Error procesando imagen.', error: err.message });
            }
        }

        await producto.save();
        res.status(200).json({ mensaje: '✅ Variación actualizada.', producto });

    } catch (error) {
        await cleanupCloudinaryFiles(req.files);
        res.status(500).json({ mensaje: '❌ Error actualizando variación.', error: error.message });
    }
};

const eliminarVariacion = async (req, res) => {
    try {
        const { productoId, id } = req.params;
        const producto = await Producto.findById(productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });

        const variacion = producto.variaciones.id(id);
        if (!variacion) return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });

        await safeDeleteVariacionImages(producto, variacion, variacion._id);
        variacion.deleteOne();
        await producto.save();

        res.status(200).json({ mensaje: '✅ Variación eliminada.', producto });

    } catch (error) {
        res.status(500).json({ mensaje: '❌ Error eliminando variación.', error: error.message });
    }
};

const reducirStockVariacion = async (req, res) => {
    try {
        const { productoId, variacionId } = req.params;
        const { cantidad } = req.body;

        const numericCantidad = Number(cantidad);
        if (isNaN(numericCantidad) || numericCantidad <= 0) return res.status(400).json({ mensaje: '🚫 Cantidad inválida.' });

        const producto = await Producto.findById(productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });

        const variacion = producto.variaciones.id(variacionId);
        if (!variacion) return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });

        if (Number(variacion.stock) < numericCantidad) return res.status(400).json({ mensaje: `🚫 No hay suficiente stock. Disponible: ${variacion.stock}` });

        variacion.stock -= numericCantidad;
        await producto.save();

        res.status(200).json({ mensaje: `✅ Stock reducido. Disponible: ${variacion.stock}`, variacionActualizada: variacion });

    } catch (error) {
        res.status(500).json({ mensaje: '❌ Error reduciendo stock.', error: error.message });
    }
};

module.exports = {
    agregarVariacion,
    obtenerVariaciones,
    actualizarVariacion,
    eliminarVariacion,
    reducirStockVariacion,
};
