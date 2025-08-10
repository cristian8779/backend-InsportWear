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
        
        // Crear hash basado en nombre original, tamaño y timestamp
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

// determina si una variación "usa" un hash o public_id dado
function variationUsesHash(variacion, hash, public_id) {
    if (!variacion) return false;
    if (hash) {
        if (variacion.hashImagen === hash) return true;
    }
    if (public_id) {
        // Buscar en imagen singular
        if (variacion.imagen && variacion.imagen.public_id === public_id) {
            return true;
        }
        // Buscar en imagenes array
        if (variacion.imagenes && Array.isArray(variacion.imagenes)) {
            return variacion.imagenes.some(img => img && img.public_id === public_id);
        }
    }
    return false;
}

// cuenta cuántas variaciones (EXCLUYENDO opcionalmente una) usan una imagen (por hash o por public_id)
function countImageUsage(producto, hash = null, public_id = null, excludeVariacionId = null) {
    let count = 0;
    for (const v of producto.variaciones) {
        if (excludeVariacionId && v._id && v._id.toString() === excludeVariacionId.toString()) continue;
        if (variationUsesHash(v, hash, public_id)) count++;
    }
    return count;
}

/**
 * Borra de Cloudinary *solo* las imágenes que no estén siendo usadas por otras variaciones del producto.
 */
async function safeDeleteImage(producto, imagen = null, excludeVariacionId = null) {
    if (!imagen || !imagen.public_id) return;
    
    const usage = countImageUsage(producto, null, imagen.public_id, excludeVariacionId);
    if (usage === 0) {
        try {
            await cloudinary.uploader.destroy(imagen.public_id);
            console.log(`🗑️ Imagen ${imagen.public_id} eliminada de Cloudinary (no usada por otras variaciones).`);
        } catch (err) {
            console.error(`⚠️ Error al eliminar ${imagen.public_id} de Cloudinary:`, err.message);
        }
    } else {
        console.log(`ℹ️ No se elimina ${imagen.public_id}: usada por ${usage} otras variaciones.`);
    }
}

/**
 * 🚀 NUEVA FUNCIÓN: Elimina todas las imágenes de una variación (tanto singular como array)
 */
async function safeDeleteVariacionImages(producto, variacion, excludeVariacionId = null) {
    if (!variacion) return;
    
    console.log(`🧹 Limpiando imágenes de variación ${variacion._id}...`);
    
    // Eliminar imagen singular si existe
    if (variacion.imagen) {
        await safeDeleteImage(producto, variacion.imagen, excludeVariacionId);
    }
    
    // Eliminar imágenes del array si existen
    if (variacion.imagenes && Array.isArray(variacion.imagenes)) {
        for (const imagen of variacion.imagenes) {
            if (imagen && imagen.public_id) {
                await safeDeleteImage(producto, imagen, excludeVariacionId);
            }
        }
    }
    
    console.log(`✅ Limpieza de imágenes completada para variación ${variacion._id}`);
}

/**
 * 🚀 FUNCIÓN MEJORADA: Procesa archivos ya subidos a Cloudinary con mejor manejo de errores
 */
async function safeProcessCloudinaryFiles(files = [], producto) {
    const uploadedFiles = []; // Track para limpieza en caso de error
    
    try {
        console.log(`🔍 Procesando archivos de Cloudinary: ${files.length} archivos recibidos`);
        
        if (!Array.isArray(files) || files.length === 0) {
            console.log(`ℹ️ No hay archivos para procesar`);
            return { imagen: null, hashImagen: null };
        }

        // ✅ SOLO tomamos el primer archivo (UNA imagen por variación)
        const file = files[0];
        uploadedFiles.push(file); // Track para limpieza
        
        console.log(`📁 Procesando archivo de Cloudinary: ${JSON.stringify({
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            filename: file.filename,
            path: file.path,
            size: file.size
        }, null, 2)}`);
        
        // Validar que el archivo sea de Cloudinary
        if (!file.path || !file.path.startsWith('https://res.cloudinary.com')) {
            throw new Error("El archivo no es una URL válida de Cloudinary");
        }
        
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            throw new Error(`Tipo de archivo no válido: ${file.mimetype}. Solo se permiten imágenes.`);
        }
        
        // 🧹 Eliminar archivos adicionales inmediatamente
        if (files.length > 1) {
            console.log(`⚠️ Se enviaron ${files.length} archivos, eliminando archivos adicionales de Cloudinary...`);
            for (let i = 1; i < files.length; i++) {
                try {
                    if (files[i].filename) {
                        await cloudinary.uploader.destroy(files[i].filename);
                        console.log(`🧹 Archivo adicional eliminado: ${files[i].filename}`);
                    }
                } catch (e) {
                    console.error(`⚠️ Error al eliminar archivo adicional: ${e.message}`);
                }
            }
        }

        // Generar hash único
        const fileHash = generateUniqueHash(file);
        if (!fileHash) {
            throw new Error("No se pudo generar el hash único de la imagen.");
        }

        // Buscar duplicados
        const variacionDuplicada = producto.variaciones.find(v => {
            return v && v.hashImagen === fileHash;
        });

        if (variacionDuplicada) {
            // Buscar imagen existente (puede estar en 'imagen' o 'imagenes[0]')
            let imagenExistente = null;
            
            if (variacionDuplicada.imagen) {
                imagenExistente = variacionDuplicada.imagen;
            } else if (variacionDuplicada.imagenes && variacionDuplicada.imagenes.length > 0) {
                imagenExistente = variacionDuplicada.imagenes[0];
            }
            
            if (imagenExistente) {
                console.log(`♻️ Imagen duplicada encontrada - Eliminando de Cloudinary: ${file.filename}`);
                console.log(`📷 Reutilizando imagen existente: ${imagenExistente.url}`);
                
                // Eliminar duplicado
                await cloudinary.uploader.destroy(file.filename);
                
                return {
                    imagen: imagenExistente,
                    hashImagen: fileHash
                };
            }
        } else {
            console.log(`📤 Usando nueva imagen: ${file.path}`);
            return {
                imagen: { 
                    url: file.path, 
                    public_id: file.filename 
                },
                hashImagen: fileHash
            };
        }

    } catch (err) {
        console.error(`❌ Error en safeProcessCloudinaryFiles:`, err.message);
        
        // 🧹 Limpiar TODOS los archivos subidos en caso de error
        console.log(`🧹 Limpiando ${uploadedFiles.length} archivos de Cloudinary debido a error...`);
        for (const file of uploadedFiles) {
            try { 
                if (file.filename) {
                    await cloudinary.uploader.destroy(file.filename);
                    console.log(`🧹 Archivo eliminado: ${file.filename}`);
                }
            } catch (_) {
                console.error(`⚠️ No se pudo eliminar: ${file.filename}`);
            }
        }
        
        throw new Error(`Error procesando imagen: ${err.message}`);
    }
}

/**
 * 🚀 NUEVA FUNCIÓN: Limpia archivos de Cloudinary por public_id
 */
async function cleanupCloudinaryFiles(files) {
    if (!files || !Array.isArray(files)) return;
    
    console.log(`🧹 Limpiando ${files.length} archivos de Cloudinary...`);
    for (const file of files) {
        try {
            if (file.filename) {
                await cloudinary.uploader.destroy(file.filename);
                console.log(`🧹 Archivo eliminado de Cloudinary: ${file.filename}`);
            }
        } catch (err) {
            console.error(`⚠️ Error al eliminar archivo: ${file.filename}`, err.message);
        }
    }
}

/* -------------------- Funciones del controlador -------------------- */

const extraerColor = (body) => {
    let color;
    try {
        if (typeof body.color === 'string') {
            color = JSON.parse(body.color);
        } else if (typeof body.color === 'object' && body.color !== null) {
            color = body.color;
        } else {
            color = {
                hex: body.colorHex || body['color[hex]'],
                nombre: body.colorNombre || body['color[nombre]']
            };
        }
    } catch (err) {
        console.error("⚠️ ERROR - extraerColor: Falló JSON.parse color:", err.message, "valor:", body.color);
        return null;
    }

    if (color && typeof color.hex === 'string' && typeof color.nombre === 'string') {
        return color;
    }
    console.error("🚫 ERROR - extraerColor: objeto color inválido:", color);
    return null;
};

const agregarVariacion = async (req, res) => {
    // 🔥 VALIDACIÓN INMEDIATA: Si hay errores, limpiamos Cloudinary de inmediato
    try {
        let { tallaLetra, tallaNumero, stock, precio } = req.body;
        stock = Number(stock);
        precio = Number(precio);
        const color = extraerColor(req.body);

        // ❌ Validaciones con limpieza inmediata de Cloudinary
        if (!tallaLetra && !tallaNumero) {
            await cleanupCloudinaryFiles(req.files);
            return res.status(400).json({ 
                mensaje: '🚫 ¡Ojo! Necesitamos al menos una talla: "tallaLetra" o "tallaNumero".' 
            });
        }
        
        if (isNaN(stock) || stock < 0) {
            await cleanupCloudinaryFiles(req.files);
            return res.status(400).json({ 
                mensaje: '🚫 El campo "stock" debe ser un número válido y no negativo.' 
            });
        }
        
        if (isNaN(precio) || precio < 0) {
            await cleanupCloudinaryFiles(req.files);
            return res.status(400).json({ 
                mensaje: '🚫 El campo "precio" debe ser un número válido y no negativo.' 
            });
        }
        
        if (!color) {
            await cleanupCloudinaryFiles(req.files);
            return res.status(400).json({ 
                mensaje: '🚫 El campo "color" es obligatorio. Por favor, ingresa el color de la variación.' 
            });
        }

        // Buscar producto
        const producto = await Producto.findById(req.params.productoId);
        if (!producto) {
            await cleanupCloudinaryFiles(req.files);
            return res.status(404).json({ mensaje: '🚫 No encontramos el producto solicitado.' });
        }

        // ✅ Crear variación base (sin imagen)
        const nuevaVariacion = {
            _id: req.body._id || new mongoose.Types.ObjectId(),
            tallaLetra: tallaLetra || undefined,
            tallaNumero: tallaNumero || undefined,
            stock,
            precio,
            color,
        };

        // 🖼️ Procesar imagen (ya está en Cloudinary)
        if (req.files && req.files.length > 0) {
            try {
                const uploadResult = await safeProcessCloudinaryFiles(req.files, producto);
                
                if (uploadResult.imagen) {
                    // Guardar como array de imágenes para compatibilidad con el esquema
                    nuevaVariacion.imagenes = [uploadResult.imagen];
                    nuevaVariacion.imagen = uploadResult.imagen; // Mantener referencia singular también
                    nuevaVariacion.hashImagen = uploadResult.hashImagen;
                }
                
            } catch (err) {
                console.error("⚠️ Error al procesar imagen:", err.message);
                // Los archivos ya fueron limpiados en safeProcessCloudinaryFiles
                return res.status(500).json({ 
                    mensaje: '❌ Hubo un problema al procesar la imagen. Variación no guardada.', 
                    error: err.message 
                });
            }
        }

        // ✅ Guardar variación
        producto.variaciones.push(nuevaVariacion);
        await producto.save();

        res.status(201).json({ 
            mensaje: '✅ ¡Todo listo! Variación agregada exitosamente.', 
            producto 
        });

    } catch (error) {
        console.error("🐛 Error al agregar variación:", error.message, error.stack);
        
        // 🧹 Limpieza final en caso de error inesperado
        await cleanupCloudinaryFiles(req.files);
        
        res.status(500).json({ 
            mensaje: '❌ ¡Ups! Algo salió mal al agregar la variación.', 
            error: error.message 
        });
    }
};

// ✅ Obtener todas las variaciones de un producto
const obtenerVariaciones = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.productoId);

        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 No encontramos el producto solicitado.' });
        }

        res.status(200).json({ mensaje: '✅ Variaciones obtenidas con éxito.', variaciones: producto.variaciones });
    } catch (error) {
        console.error("🐛 Error al obtener variaciones:", error.message, error.stack);
        res.status(500).json({ mensaje: '❌ Hubo un problema interno.', error: error.message });
    }
};

// ✅ Actualizar variación
const actualizarVariacion = async (req, res) => {
    try {
        const { productoId, variacionId } = req.params;
        const producto = await Producto.findById(productoId);

        if (!producto) {
            await cleanupCloudinaryFiles(req.files);
            return res.status(404).json({ mensaje: '🚫 No encontramos el producto.' });
        }

        const variacion = producto.variaciones.id(variacionId);
        if (!variacion) {
            await cleanupCloudinaryFiles(req.files);
            return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });
        }

        let { tallaLetra, tallaNumero, stock, precio } = req.body;

        // Validaciones tempranas con limpieza
        if (!tallaLetra && !tallaNumero && (variacion.tallaLetra === undefined && variacion.tallaNumero === undefined)) {
            await cleanupCloudinaryFiles(req.files);
            return res.status(400).json({ mensaje: '🚫 Debes proporcionar al menos una talla.' });
        }

        if (stock !== undefined) {
            stock = Number(stock);
            if (isNaN(stock) || stock < 0) {
                await cleanupCloudinaryFiles(req.files);
                return res.status(400).json({ mensaje: '🚫 El stock debe ser un número positivo.' });
            }
        }
        
        if (precio !== undefined) {
            precio = Number(precio);
            if (isNaN(precio) || precio < 0) {
                await cleanupCloudinaryFiles(req.files);
                return res.status(400).json({ mensaje: '🚫 El precio debe ser un número positivo.' });
            }
        }

        const color = extraerColor(req.body);

        // Actualizar campos básicos
        if (tallaLetra !== undefined) variacion.tallaLetra = tallaLetra;
        if (tallaNumero !== undefined) variacion.tallaNumero = tallaNumero;
        if (stock !== undefined) variacion.stock = stock;
        if (precio !== undefined) variacion.precio = precio;
        if (color) variacion.color = color;

        // Procesar imagen si hay archivos
        if (req.files && req.files.length > 0) {
            try {
                const uploadResult = await safeProcessCloudinaryFiles(req.files, producto);
                const newHash = uploadResult.hashImagen;
                const oldHash = variacion.hashImagen;

                if (newHash && newHash !== oldHash) {
                    console.log(`🔄 Actualizando imagen: ${oldHash} -> ${newHash}`);

                    // 🧹 Eliminar TODAS las imágenes anteriores de la variación
                    await safeDeleteVariacionImages(producto, variacion, variacion._id);

                    // Actualizar tanto el campo singular como el array
                    variacion.imagen = uploadResult.imagen;
                    variacion.imagenes = [uploadResult.imagen];
                    variacion.hashImagen = newHash;
                } else if (newHash === oldHash) {
                    console.log("ℹ️ Imagen igual, no se cambia.");
                }
                
            } catch (err) {
                console.error("⚠️ Error al procesar imagen:", err.message);
                return res.status(500).json({ 
                    mensaje: '❌ Problema al procesar imagen.', 
                    error: err.message 
                });
            }
        }

        await producto.save();

        res.status(200).json({ 
            mensaje: '✅ Variación actualizada con éxito.', 
            producto 
        });
        
    } catch (error) {
        console.error("🐛 Error al actualizar variación:", error.message);
        await cleanupCloudinaryFiles(req.files);
        res.status(500).json({ 
            mensaje: '❌ Problema interno al actualizar.', 
            error: error.message 
        });
    }
};

// ✅ Eliminar variación con limpieza completa de imágenes
const eliminarVariacion = async (req, res) => {
    try {
        const { productoId, id: variacionId } = req.params;

        const producto = await Producto.findById(productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 No encontramos el producto.' });

        const variacion = producto.variaciones.id(variacionId);
        if (!variacion) return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });

        console.log(`🗑️ Eliminando variación ${variacionId} y sus imágenes...`);

        // 🧹 Eliminar TODAS las imágenes de la variación (singular y array)
        await safeDeleteVariacionImages(producto, variacion, variacion._id);

        // Eliminar la variación del producto
        variacion.deleteOne();
        await producto.save();

        console.log(`✅ Variación ${variacionId} eliminada exitosamente`);

        res.status(200).json({ mensaje: '✅ Variación eliminada exitosamente.', producto });

    } catch (error) {
        console.error("🐛 Error al eliminar variación:", error.message);
        res.status(500).json({ mensaje: '❌ Error al eliminar variación.', error: error.message });
    }
};

// ✅ Reducir stock
const reducirStockVariacion = async (req, res) => {
    try {
        const { productoId, variacionId } = req.params;
        const { cantidad } = req.body;

        const numericCantidad = Number(cantidad);
        
        if (isNaN(numericCantidad) || numericCantidad <= 0) {
            return res.status(400).json({ mensaje: '🚫 La cantidad debe ser un número positivo.' });
        }

        const producto = await Producto.findById(productoId);
        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 No encontramos el producto.' });
        }

        const variacion = producto.variaciones.id(variacionId);
        if (!variacion) {
            return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });
        }

        if (Number(variacion.stock) < numericCantidad) {
            return res.status(400).json({ mensaje: '🚫 No hay suficiente stock. Disponible: ' + variacion.stock });
        }

        variacion.stock -= numericCantidad;
        await producto.save();

        res.status(200).json({ 
            mensaje: '✅ Stock reducido. Disponible: ' + variacion.stock, 
            variacionActualizada: variacion 
        });
    } catch (error) {
        console.error("🐛 Error al reducir stock:", error.message);
        res.status(500).json({ mensaje: '❌ Error al reducir stock.', error: error.message });
    }
};

module.exports = {
    agregarVariacion,
    obtenerVariaciones,
    actualizarVariacion,
    eliminarVariacion,
    reducirStockVariacion,
};