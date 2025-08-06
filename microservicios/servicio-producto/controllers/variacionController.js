const Producto = require('../models/Producto');
const cloudinary = require('../config/cloudinary');

/**
 * @function extraerColor
 * @description Reconstruye el objeto de color a partir de diferentes formatos de entrada (form-data, JSON).
 * @param {object} body - El cuerpo de la solicitud HTTP.
 * @returns {object|null} El objeto de color normalizado o null si es inválido.
 */
const extraerColor = (body) => {
    let color;
    // --- INICIO DE DEPURACIÓN DETALLADA PARA 'color' ---
    console.log("DEBUG - extraerColor: req.body.color recibido:", body.color);
    console.log("DEBUG - extraerColor: Tipo de req.body.color recibido:", typeof body.color);
    // --- FIN DE DEPURACIÓN DETALLADA PARA 'color' ---

    try {
        if (typeof body.color === 'string') {
            // --- DEPURACIÓN: Si es string, intentando parsear ---
            console.log("DEBUG - extraerColor: body.color es un string, intentando JSON.parse...");
            // Intenta parsear como JSON si viene como string (común en form-data)
            color = JSON.parse(body.color);
            console.log("DEBUG - extraerColor: Resultado de JSON.parse:", color);
        } else if (typeof body.color === 'object' && body.color !== null) {
            // --- DEPURACIÓN: Si ya es objeto ---
            console.log("DEBUG - extraerColor: body.color ya es un objeto.");
            // Si ya es un objeto, úsalo directamente (común en JSON crudo)
            color = body.color;
        } else {
            // --- DEPURACIÓN: Intentando de campos separados ---
            console.log("DEBUG - extraerColor: body.color no es string ni objeto, intentando de campos separados (colorHex, colorNombre).");
            // Maneja casos donde hex y nombre vienen como campos separados
            color = {
                hex: body.colorHex || body['color[hex]'],
                nombre: body.colorNombre || body['color[nombre]']
            };
            console.log("DEBUG - extraerColor: Color construido desde campos separados:", color);
        }
    } catch (err) {
        // --- DEPURACIÓN: Error de parseo ---
        console.error("⚠️ ERROR - extraerColor: Falló al parsear el valor 'color'. Mensaje:", err.message);
        console.error("⚠️ ERROR - extraerColor: El valor original de body.color era:", body.color);
        return null; // Retorna null si el parseo falla
    }

    // Valida que el color tenga 'hex' y 'nombre' definidos y que sean strings
    if (color && typeof color.hex === 'string' && typeof color.nombre === 'string') {
        console.log("DEBUG - extraerColor: Color validado y considerado válido:", color);
        return color;
    }
    // --- DEPURACIÓN: Color incompleto/inválido ---
    console.error("🚫 ERROR - extraerColor: El objeto de color es incompleto o inválido. Se requieren las propiedades 'hex' y 'nombre' como strings. Objeto final antes de la validación:", color);
    return null; // Retorna null si el color es incompleto o inválido
};

/**
 * @function manejarCargaDeImagenes
 * @description Sube imágenes a Cloudinary y devuelve un array de objetos de imagen.
 * @param {Array<object>} files - Archivos de imagen provenientes de la solicitud.
 * @returns {Promise<Array<object>>} Array de objetos { url, public_id }.
 */
const manejarCargaDeImagenes = async (files) => {
    const imagenesCargadas = [];
    if (files && files.length > 0) {
        for (const file of files) {
            try {
                const resultado = await cloudinary.uploader.upload(file.path, {
                    folder: 'variaciones', // Carpeta en Cloudinary para las variaciones
                });
                imagenesCargadas.push({ url: resultado.secure_url, public_id: resultado.public_id });
            } catch (uploadError) {
                console.error(`⚠️ Error al subir imagen ${file.originalname}:`, uploadError.message);
                // Si una imagen falla, logueamos y continuamos con las demás.
                // Podrías añadir lógica para rollback o reportar un error específico si es crítico.
            }
        }
    }
    return imagenesCargadas;
};

/**
 * @function eliminarImagenesCloudinary
 * @description Elimina imágenes de Cloudinary.
 * @param {Array<object>} imagenes - Array de objetos de imagen con public_id.
 */
const eliminarImagenesCloudinary = async (imagenes) => {
    if (imagenes && Array.isArray(imagenes)) {
        for (const img of imagenes) {
            if (img.public_id) {
                try {
                    await cloudinary.uploader.destroy(img.public_id);
                } catch (deleteError) {
                    console.error(`⚠️ Error al eliminar imagen de Cloudinary ${img.public_id}:`, deleteError.message);
                    // No detenemos la ejecución si una imagen no se puede eliminar.
                }
            }
        }
    }
};

// ✅ Agregar variación
const agregarVariacion = async (req, res) => {
    try {
        // --- AÑADE ESTOS CONSOLE.LOGS AQUÍ ---
        console.log("DEBUG: Contenido completo de req.body al inicio de agregarVariacion:", req.body);
        console.log("DEBUG: Valor de req.body.precio (antes de Number()):", req.body.precio);
        console.log("DEBUG: Tipo de req.body.precio (antes de Number()):", typeof req.body.precio);
        console.log("DEBUG: Valor de req.body.stock (antes de Number()):", req.body.stock);
        console.log("DEBUG: Tipo de req.body.stock (antes de Number()):", typeof req.body.stock);
        // --- FIN DE CONSOLE.LOGS ---

        let { tallaLetra, stock, precio } = req.body;
        
        // --- CORRECCIÓN CLAVE AQUÍ ---
        stock = Number(stock);
        precio = Number(precio);
        // --- FIN CORRECCIÓN CLAVE ---

        // --- AÑADE ESTOS CONSOLE.LOGS DESPUÉS DE LA CONVERSIÓN ---
        console.log("DEBUG: Valor de 'precio' (después de Number()):", precio);
        console.log("DEBUG: Tipo de 'precio' (después de Number()):", typeof precio);
        console.log("DEBUG: Valor de 'stock' (después de Number()):", stock);
        console.log("DEBUG: Tipo de 'stock' (después de Number()):", typeof stock);
        // --- FIN DE CONSOLE.LOGS ---

        const color = extraerColor(req.body);

        // Validaciones de campos requeridos y formato numérico
        if (!tallaLetra) {
            return res.status(400).json({ mensaje: '🚫 Campo "tallaLetra" es obligatorio.' });
        }
        if (isNaN(stock) || stock < 0) {
            return res.status(400).json({ mensaje: '🚫 Campo "stock" es obligatorio y debe ser un número no negativo.' });
        }
        if (isNaN(precio) || precio < 0) {
            return res.status(400).json({ mensaje: '🚫 Campo "precio" es obligatorio y debe ser un número no negativo.' });
        }
        if (!color) {
            // El mensaje de error de 'extraerColor' ya debe haber informado la causa exacta
            return res.status(400).json({ mensaje: '🚫 El campo "color" es obligatorio y debe tener un formato válido (con "hex" y "nombre").' });
        }

        const producto = await Producto.findById(req.params.productoId);
        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        // Manejo de la carga de imágenes
        const imagenes = await manejarCargaDeImagenes(req.files);

        // Creación de la nueva variación
        const nuevaVariacion = {
                _id: req.body._id || new mongoose.Types.ObjectId(), // 👈 ESTA LÍNEA ES LA CLAVE
                tallaLetra,
                stock,
                precio,
                color,
                imagenes,
};
        producto.variaciones.push(nuevaVariacion);
        await producto.save();

        res.status(201).json({ mensaje: '✅ Variación agregada con éxito.', producto });
    } catch (error) {
        console.error("🐛 Error al agregar variación:", error.message, error.stack); // Log más detallado del error
        res.status(500).json({ mensaje: '❌ Error interno del servidor al agregar variación.', error: error.message });
    }
};

// ✅ Obtener todas las variaciones de un producto
const obtenerVariaciones = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.productoId);
        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        res.status(200).json({ variaciones: producto.variaciones });
    } catch (error) {
        console.error("🐛 Error al obtener variaciones:", error.message, error.stack);
        res.status(500).json({ mensaje: '❌ Error al obtener variaciones', error: error.message });
    }
};

// ✅ Actualizar una variación
const actualizarVariacion = async (req, res) => {
    try {
        const { productoId, id: variacionId } = req.params;
        const producto = await Producto.findById(productoId);
        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        const variacion = producto.variaciones.id(variacionId);
        if (!variacion) {
            return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });
        }

        let { tallaLetra, stock, precio } = req.body; // Usa 'let' para reasignar

        // --- CORRECCIÓN CLAVE AQUÍ ---
        if (stock !== undefined) {
            stock = Number(stock);
        }
        if (precio !== undefined) {
            precio = Number(precio);
        }
        // --- FIN CORRECCIÓN CLAVE ---

        const color = extraerColor(req.body); // Intenta extraer y validar el color

        // Actualiza solo los campos que se proporcionen en la solicitud
        if (tallaLetra !== undefined) variacion.tallaLetra = tallaLetra;
        
        if (stock !== undefined) {
            // La validación ahora asume que 'stock' ya fue convertido o es undefined
            if (isNaN(stock) || stock < 0) {
                return res.status(400).json({ mensaje: '🚫 El stock debe ser un número positivo o cero.' });
            }
            variacion.stock = stock;
        }
        
        if (precio !== undefined) {
            // La validación ahora asume que 'precio' ya fue convertido o es undefined
            if (isNaN(precio) || precio < 0) {
                return res.status(400).json({ mensaje: '🚫 El precio debe ser un número positivo o cero.' });
            }
            variacion.precio = precio;
        }
        
        if (color) { // Solo actualiza si extraerColor devuelve un objeto de color válido
            variacion.color = color;
        } else if (req.body.color !== undefined) { // Si se intentó enviar color pero fue inválido
             return res.status(400).json({ mensaje: '🚫 El campo "color" enviado no tiene un formato válido (con "hex" y "nombre").' });
        }

        // Manejo de imágenes: Si se envían nuevas, se eliminan las viejas y se suben las nuevas
        if (req.files && req.files.length > 0) {
            await eliminarImagenesCloudinary(variacion.imagenes); // Elimina imágenes antiguas
            variacion.imagenes = await manejarCargaDeImagenes(req.files); // Sube y asigna nuevas imágenes
        }

        await producto.save();
        res.status(200).json({ mensaje: '✅ Variación actualizada con éxito.', producto });
    } catch (error) {
        console.error("🐛 Error al actualizar variación:", error.message, error.stack);
        res.status(500).json({ mensaje: '❌ Error interno del servidor al actualizar variación.', error: error.message });
    }
};

// ✅ Eliminar variación
const eliminarVariacion = async (req, res) => {
    try {
        const { productoId, id: variacionId } = req.params;

        const producto = await Producto.findById(productoId);
        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        const variacion = producto.variaciones.id(variacionId);
        if (!variacion) {
            return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });
        }

        await eliminarImagenesCloudinary(variacion.imagenes); // Elimina las imágenes de Cloudinary

        variacion.deleteOne(); // Elimina la variación del array del subdocumento
        await producto.save();

        res.status(200).json({ mensaje: '✅ Variación eliminada con éxito.', producto });
    } catch (error) {
        console.error("🐛 Error al eliminar variación:", error.message, error.stack);
        res.status(500).json({ mensaje: '❌ Error interno del servidor al eliminar variación.', error: error.message });
    }
};

// ✅ Reducir stock de una variación
const reducirStockVariacion = async (req, res) => {
    try {
        const { productoId, variacionId } = req.params;
        const { cantidad } = req.body;

        // Convertir cantidad a número inmediatamente
        const numericCantidad = Number(cantidad);

        if (isNaN(numericCantidad) || numericCantidad <= 0) {
            return res.status(400).json({ mensaje: '🚫 La cantidad a reducir es obligatoria y debe ser un número positivo.' });
        }

        const producto = await Producto.findById(productoId);
        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        const variacion = producto.variaciones.id(variacionId);
        if (!variacion) {
            return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });
        }

        // Asegúrate de que el stock de la variación sea tratado como número
        if (Number(variacion.stock) < numericCantidad) { // Usamos numericCantidad ya convertida
            return res.status(400).json({ mensaje: '🚫 Stock insuficiente para esta operación.', stockDisponible: variacion.stock });
        }

        variacion.stock -= numericCantidad; // Reducir stock con la cantidad numérica
        await producto.save();

        res.status(200).json({ mensaje: '✅ Stock reducido correctamente.', variacionActualizada: variacion });
    } catch (error) {
        console.error("🐛 Error al reducir stock:", error.message, error.stack);
        res.status(500).json({ mensaje: '❌ Error al reducir stock', error: error.message });
    }
};

module.exports = {
    agregarVariacion,
    obtenerVariaciones,
    actualizarVariacion,
    eliminarVariacion,
    reducirStockVariacion,
};