const Producto = require('../models/Producto');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

const crypto = require('crypto');
const fs = require('fs');

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

// hash MD5 del archivo (para archivos locales - mantenido para compatibilidad)
function getFileHash(filePath) {
    try {
        console.log(`🔍 Calculando hash para: ${filePath}`);
        
        if (!filePath || filePath.startsWith("http")) {
            console.log(`⚠️ Es una URL, no un archivo local: ${filePath}`);
            return null; // no hay hash para URLs
        }
        
        if (!fs.existsSync(filePath)) {
            console.log(`❌ Archivo no existe: ${filePath}`);
            return null; // evita ENOENT
        }
        
        const stats = fs.statSync(filePath);
        console.log(`📊 Archivo encontrado - Tamaño: ${stats.size} bytes`);
        
        if (stats.size === 0) {
            console.log(`⚠️ Archivo vacío: ${filePath}`);
            return null;
        }
        
        const fileBuffer = fs.readFileSync(filePath);
        console.log(`📖 Buffer leído - Tamaño: ${fileBuffer.length} bytes`);
        
        const hashSum = crypto.createHash('md5');
        hashSum.update(fileBuffer);
        const hash = hashSum.digest('hex');
        
        console.log(`✅ Hash calculado: ${hash}`);
        return hash;
        
    } catch (error) {
        console.error(`❌ Error calculando hash para ${filePath}:`, error.message);
        return null;
    }
}

// determina si una variación "usa" un hash o public_id dado
function variationUsesHash(variacion, hash, public_id) {
    if (!variacion) return false;
    if (hash) {
        // Solo verificamos hashImagen (una sola imagen)
        if (variacion.hashImagen === hash) return true;
    }
    if (public_id && variacion.imagen && variacion.imagen.public_id === public_id) {
        return true;
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
 * - producto: documento completo del producto (con variaciones)
 * - imagen: objeto { url, public_id } (una sola imagen)
 * - excludeVariacionId: id de la variación que se está modificando/eliminando (para no contarse a sí misma)
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
 * Procesa UNA SOLA imagen que ya fue subida a Cloudinary:
 * - Genera un hash único basado en las características del archivo
 * - Si una imagen con el mismo hash ya existe en alguna variación del producto -> reutiliza esa imagen
 * - Si no existe -> usa la imagen ya subida a Cloudinary
 * Devuelve: { imagen: {url, public_id}, hashImagen: hash }
 */
async function safeProcessCloudinaryFile(files = [], producto) {
    try {
        console.log(`🔍 Procesando archivos de Cloudinary: ${files.length} archivos recibidos`);
        
        if (!Array.isArray(files) || files.length === 0) {
            console.log(`ℹ️ No hay archivos para procesar`);
            return { imagen: null, hashImagen: null };
        }

        // ✅ SOLO tomamos el primer archivo (UNA imagen por variación)
        const file = files[0];
        console.log(`📁 Procesando archivo de Cloudinary: ${JSON.stringify({
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            filename: file.filename,
            path: file.path,
            size: file.size
        }, null, 2)}`);
        
        // Validar que el archivo tenga las propiedades necesarias
        if (!file.path || !file.path.startsWith('https://res.cloudinary.com')) {
            throw new Error("El archivo no es una URL válida de Cloudinary");
        }
        
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            throw new Error(`Tipo de archivo no válido: ${file.mimetype}. Solo se permiten imágenes.`);
        }
        
        // Eliminar archivos adicionales de Cloudinary si los hay
        if (files.length > 1) {
            console.log(`⚠️ Se enviaron ${files.length} archivos, eliminando archivos adicionales de Cloudinary...`);
            for (let i = 1; i < files.length; i++) {
                try {
                    if (files[i].filename) {
                        await cloudinary.uploader.destroy(files[i].filename);
                        console.log(`🧹 Archivo adicional eliminado de Cloudinary: ${files[i].filename}`);
                    }
                } catch (e) {
                    console.error(`⚠️ Error al eliminar archivo adicional de Cloudinary: ${e.message}`);
                }
            }
        }

        // Generar hash único para el archivo
        const fileHash = generateUniqueHash(file);

        if (!fileHash) {
            throw new Error("No se pudo generar el hash único de la imagen. Verifica que el archivo sea válido.");
        }

        console.log(`🔍 Buscando variación existente con hash: ${fileHash}`);

        // Buscar si ya existe una variación con este hash
        const variacionDuplicada = producto.variaciones.find(v => {
            return v && v.hashImagen === fileHash;
        });

        if (variacionDuplicada && variacionDuplicada.imagen) {
            console.log(`♻️ Imagen duplicada encontrada - Eliminando de Cloudinary: ${file.filename}`);
            console.log(`📷 Reutilizando imagen existente: ${variacionDuplicada.imagen.url}`);
            
            // Eliminar el archivo duplicado de Cloudinary
            try {
                await cloudinary.uploader.destroy(file.filename);
                console.log(`🗑️ Imagen duplicada eliminada de Cloudinary: ${file.filename}`);
            } catch (e) {
                console.error(`⚠️ Error al eliminar imagen duplicada: ${e.message}`);
            }
            
            // Reutilizamos la imagen existente
            return {
                imagen: variacionDuplicada.imagen,
                hashImagen: fileHash
            };
        } else {
            // Usar la imagen ya subida a Cloudinary
            console.log(`📤 Usando nueva imagen subida a Cloudinary: ${file.path}`);
            
            return {
                imagen: { 
                    url: file.path, 
                    public_id: file.filename 
                },
                hashImagen: fileHash
            };
        }

    } catch (err) {
        console.error(`❌ Error en safeProcessCloudinaryFile:`, err.message);
        
        // Limpiar archivos de Cloudinary en caso de error
        if (files && files.length > 0) {
            for (const file of files) {
                try { 
                    if (file.filename) {
                        await cloudinary.uploader.destroy(file.filename);
                        console.log(`🧹 Archivo eliminado de Cloudinary tras error: ${file.filename}`);
                    }
                } catch (_) {
                    console.error(`⚠️ No se pudo eliminar archivo de Cloudinary: ${file.filename}`);
                }
            }
        }
        throw new Error(`Error procesando imagen: ${err.message}`);
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

// ✅ Agregar variación (optimizado para UNA imagen sin duplicados)
const agregarVariacion = async (req, res) => {
    try {
        let { tallaLetra, tallaNumero, stock, precio } = req.body;
        stock = Number(stock);
        precio = Number(precio);

        const color = extraerColor(req.body);
        if (!tallaLetra && !tallaNumero) {
            return res.status(400).json({ mensaje: '🚫 Debes proporcionar al menos una talla: "tallaLetra" o "tallaNumero".' });
        }
        if (isNaN(stock) || stock < 0) {
            return res.status(400).json({ mensaje: '🚫 Campo "stock" obligatorio y debe ser número no negativo.' });
        }
        if (isNaN(precio) || precio < 0) {
            return res.status(400).json({ mensaje: '🚫 Campo "precio" obligatorio y debe ser número no negativo.' });
        }
        if (!color) {
            return res.status(400).json({ mensaje: '🚫 El campo "color" es obligatorio y debe tener "hex" y "nombre".' });
        }

        const producto = await Producto.findById(req.params.productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });

        let imagen = null;
        let hashImagen = null;

        // ✅ Validar que solo se suba UNA imagen
        if (req.files && req.files.length > 0) {
            if (req.files.length > 1) {
                console.log(`⚠️ Se enviaron ${req.files.length} archivos, pero solo se procesará 1.`);
            }
            
            try {
                const uploadResult = await safeProcessCloudinaryFile(req.files, producto);
                imagen = uploadResult.imagen;
                hashImagen = uploadResult.hashImagen;
            } catch (err) {
                console.error("⚠️ Error al procesar imagen en agregarVariacion:", err.message);
                return res.status(500).json({ mensaje: '❌ Error al procesar imagen. No se ha guardado la variación.', error: err.message });
            }
        }

        const nuevaVariacion = {
            _id: req.body._id || new mongoose.Types.ObjectId(),
            tallaLetra: tallaLetra || undefined,
            tallaNumero: tallaNumero || undefined,
            stock,
            precio,
            color,
            imagen: imagen || undefined,
            hashImagen: hashImagen || undefined
        };

        producto.variaciones.push(nuevaVariacion);
        await producto.save();

        res.status(201).json({ mensaje: '✅ Variación agregada con éxito.', producto });
    } catch (error) {
        console.error("🐛 Error al agregar variación:", error.message, error.stack);
        res.status(500).json({ mensaje: '❌ Error interno al agregar variación.', error: error.message });
    }
};

// ✅ Obtener todas las variaciones de un producto
const obtenerVariaciones = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        res.status(200).json({ variaciones: producto.variaciones });
    } catch (error) {
        console.error("🐛 Error al obtener variaciones:", error.message, error.stack);
        res.status(500).json({ mensaje: '❌ Error al obtener variaciones', error: error.message });
    }
};

// ✅ Actualizar variación (optimizado para UNA imagen sin duplicados)
const actualizarVariacion = async (req, res) => {
    try {
        const { productoId, id: variacionId } = req.params;
        const producto = await Producto.findById(productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });

        const variacion = producto.variaciones.id(variacionId);
        if (!variacion) return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });

        let { tallaLetra, tallaNumero, stock, precio } = req.body;
        if (!tallaLetra && !tallaNumero && (variacion.tallaLetra === undefined && variacion.tallaNumero === undefined)) {
            return res.status(400).json({ mensaje: '🚫 Debes proporcionar al menos una talla: "tallaLetra" o "tallaNumero".' });
        }

        if (stock !== undefined) stock = Number(stock);
        if (precio !== undefined) precio = Number(precio);

        const color = extraerColor(req.body);

        if (tallaLetra !== undefined) variacion.tallaLetra = tallaLetra;
        if (tallaNumero !== undefined) variacion.tallaNumero = tallaNumero;
        if (stock !== undefined) {
            if (isNaN(stock) || stock < 0) return res.status(400).json({ mensaje: '🚫 stock inválido.' });
            variacion.stock = stock;
        }
        if (precio !== undefined) {
            if (isNaN(precio) || precio < 0) return res.status(400).json({ mensaje: '🚫 precio inválido.' });
            variacion.precio = precio;
        }
        if (color) variacion.color = color;

        // Manejo de UNA imagen en la actualización
        if (req.files && req.files.length > 0) {
            if (req.files.length > 1) {
                console.log(`⚠️ Se enviaron ${req.files.length} archivos, pero solo se procesará 1.`);
            }

            let uploadResult;
            try {
                uploadResult = await safeProcessCloudinaryFile(req.files, producto);
            } catch (err) {
                console.error("⚠️ Error al procesar imagen en actualizarVariacion:", err.message);
                return res.status(500).json({ mensaje: '❌ Error al procesar nueva imagen. No se guardaron cambios de imagen.', error: err.message });
            }

            const newHash = uploadResult.hashImagen;
            const oldHash = variacion.hashImagen;

            // Solo actualizar si el hash es diferente
            if (newHash && newHash !== oldHash) {
                console.log(`🔄 Actualizando imagen: ${oldHash} -> ${newHash}`);
                
                // Eliminar imagen anterior si ya no se usa
                if (variacion.imagen) {
                    await safeDeleteImage(producto, variacion.imagen, variacion._id);
                }

                // Asignar nueva imagen y hash
                variacion.imagen = uploadResult.imagen;
                variacion.hashImagen = newHash;
            } else if (newHash === oldHash) {
                console.log("ℹ️ La nueva imagen es idéntica a la anterior (mismo hash). No se reemplaza.");
            }
        }

        await producto.save();
        res.status(200).json({ mensaje: '✅ Variación actualizada con éxito.', producto });
    } catch (error) {
        console.error("🐛 Error al actualizar variación:", error.message, error.stack);
        res.status(500).json({ mensaje: '❌ Error interno al actualizar variación.', error: error.message });
    }
};

// ✅ Eliminar variación (sin borrar imagen si es usada por otras variaciones)
const eliminarVariacion = async (req, res) => {
    try {
        const { productoId, id: variacionId } = req.params;

        const producto = await Producto.findById(productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });

        const variacion = producto.variaciones.id(variacionId);
        if (!variacion) return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });

        // Borrar imagen solo si ninguna otra variación la usa
        if (variacion.imagen) {
            await safeDeleteImage(producto, variacion.imagen, variacion._id);
        }

        // Eliminar la variación del subdocumento
        variacion.deleteOne();
        await producto.save();

        res.status(200).json({ mensaje: '✅ Variación eliminada con éxito.', producto });
    } catch (error) {
        console.error("🐛 Error al eliminar variación:", error.message, error.stack);
        res.status(500).json({ mensaje: '❌ Error interno al eliminar variación.', error: error.message });
    }
};

// ✅ Reducir stock de una variación (sin cambios)
const reducirStockVariacion = async (req, res) => {
    try {
        const { productoId, variacionId } = req.params;
        const { cantidad } = req.body;

        const numericCantidad = Number(cantidad);
        if (isNaN(numericCantidad) || numericCantidad <= 0) {
            return res.status(400).json({ mensaje: '🚫 La cantidad debe ser un número positivo.' });
        }

        const producto = await Producto.findById(productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });

        const variacion = producto.variaciones.id(variacionId);
        if (!variacion) return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });

        if (Number(variacion.stock) < numericCantidad) {
            return res.status(400).json({ mensaje: '🚫 Stock insuficiente.', stockDisponible: variacion.stock });
        }

        variacion.stock -= numericCantidad;
        await producto.save();

        res.status(200).json({ mensaje: '✅ Stock reducido correctamente.', variacionActualizada: variacion });
    } catch (error) {
        console.error("🐛 Error al reducir stock:", error.message, error.stack);
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