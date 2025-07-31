const Producto = require('../models/Producto');
const cloudinary = require('../config/cloudinary');

// ---
// 📦 ¡Vamos a añadir una nueva variación a tu producto!
// Esta función te permite definir diferentes tallas, colores y existencias para un producto.
// ¡Y ahora puedes subir varias fotos para cada variación!
// ---
const agregarVariacion = async (req, res) => {
    try {
        const { productoId } = req.params;
        // ✨ CORRECCIÓN: Ahora incluimos 'precio' en la desestructuración de req.body
        const { tallaNumero, tallaLetra, color, stock, precio } = req.body;

        // Primero, verificamos que tenga al menos una talla. ¡Es importante para organizar!
        if (!tallaNumero && !tallaLetra) {
            console.log("⚠️ ¡Ups! Necesitamos una talla (número o letra) para esta variación.");
            return res.status(400).json({ mensaje: '⚠️ Para que la variación sea útil, ¡necesita una talla! Por favor, agrega tallaNúmero o tallaLetra.' });
        }

        // ✨ ADICIÓN: Validación opcional para el precio de la variación
        // Si tu esquema de variación tiene 'precio' como 'required: true', ¡esta validación es clave!
        if (precio === undefined || isNaN(Number(precio)) || Number(precio) < 0) { // El min en el esquema es 0
            console.log("⚠️ Error al agregar variación: Precio inválido o faltante.");
            return res.status(400).json({ mensaje: '⚠️ Cada variación debe tener un precio válido y no negativo.' });
        }

        // Buscamos tu producto. ¡Queremos asegurarnos de que existe antes de añadirle cosas!
        const producto = await Producto.findById(productoId);
        if (!producto) {
            console.log(`🚫 ¡Oh no! No encontramos ningún producto con el ID ${productoId}.`);
            return res.status(404).json({ mensaje: '🚫 ¡Parece que ese producto no existe! Por favor, verifica el ID y vuelve a intentarlo.' });
        }

        // Preparamos la nueva variación con los datos que nos diste
        const nuevaVariacion = {
            tallaNumero,
            tallaLetra,
            color,
            stock: Number(stock) || 0,
            // ✨ CORRECCIÓN: Añadimos el precio a la nueva variación
            precio: Number(precio),
            // ✨ CORRECCIÓN: 'imagenes' es un array, no 'imagen' y 'public_id' separados.
            imagenes: [],
        };

        // Si nos enviaste fotos, ¡las subimos y las guardamos!
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            console.log(`📸 ¡Excelente! Procesando ${req.files.length} fotos para tu nueva variación.`);
            for (const file of req.files) {
                nuevaVariacion.imagenes.push({
                    url: file.path, // La dirección donde tu foto estará en Cloudinary
                    public_id: file.filename, // El identificador único de la foto en Cloudinary (útil para borrarla después)
                });
            }
            console.log("👍 Todas las fotos se han procesado correctamente.");
        } else {
            console.log("ℹ️ No se adjuntaron fotos para esta variación. ¡No hay problema!");
        }

        // ¡Añadimos la nueva variación a la lista de variaciones de tu producto!
        producto.variaciones.push(nuevaVariacion);
        // Marcamos el stock general del producto como 0, porque ahora cada variación tiene su propio stock.
        producto.stock = 0; 

        // ¡Guardamos todos los cambios en la base de datos!
        await producto.save();
        console.log(`🎉 ¡Felicidades! Se agregó una nueva variación al producto con ID ${productoId}.`);
        res.status(201).json({ mensaje: '✅ ¡Variación agregada con éxito! Tu producto ahora tiene más opciones. 🎉', producto });
    } catch (error) {
        console.error("🐛 ¡Hubo un error inesperado al añadir la variación!", error);
        res.status(500).json({ mensaje: '❌ ¡Uy! No pudimos agregar la variación. Algo salió mal en nuestro lado. Inténtalo de nuevo más tarde.', error: error.message });
    }
};

// ---
// 🔍 ¡Vamos a ver las variaciones de tu producto!
// Aquí puedes ver todas las opciones de tallas y colores de un producto.
// ¡Incluso puedes usar filtros para encontrar justo lo que buscas!
// ---
const obtenerVariaciones = async (req, res) => {
    try {
        const { productoId } = req.params;
        const { tallaNumero, tallaLetra, color } = req.query;

        const producto = await Producto.findById(productoId);
        if (!producto) {
            console.log(`🚫 ¡Oh no! No encontramos ningún producto con el ID ${productoId}.`);
            return res.status(404).json({ mensaje: '🚫 ¡Parece que ese producto no existe! No podemos mostrarte sus variaciones.' });
        }

        let variacionesFiltradas = producto.variaciones;

        if (tallaNumero) {
            variacionesFiltradas = variacionesFiltradas.filter(
                (v) => v.tallaNumero && v.tallaNumero.toString() === tallaNumero.toString()
            );
            console.log(`🔍 Filtrando por talla de número: "${tallaNumero}"`);
        }
        if (tallaLetra) {
            variacionesFiltradas = variacionesFiltradas.filter(
                (v) => v.tallaLetra && v.tallaLetra.toLowerCase() === tallaLetra.toLowerCase()
            );
            console.log(`🔍 Filtrando por talla de letra: "${tallaLetra}"`);
        }
        if (color) {
            variacionesFiltradas = variacionesFiltradas.filter(
                (v) => v.color && v.color.toLowerCase() === color.toLowerCase()
            );
            console.log(`🔍 Filtrando por color: "${color}"`);
        }

        const tallasNumeroSet = new Set();
        const tallasLetraSet = new Set();
        const coloresSet = new Set();

        producto.variaciones.forEach(v => {
            if (v.tallaNumero) tallasNumeroSet.add(v.tallaNumero);
            if (v.tallaLetra) tallasLetraSet.add(v.tallaLetra);
            if (v.color) coloresSet.add(v.color);
        });

        const filtrosDisponibles = {
            tallasNumero: Array.from(tallasNumeroSet).sort((a, b) => a - b),
            tallasLetra: Array.from(tallasLetraSet).sort(),
            colores: Array.from(coloresSet).sort(),
        };

        console.log(`🌟 ¡Variaciones obtenidas! Mostrando ${variacionesFiltradas.length} opciones para el producto con ID ${productoId}.`);
        res.json({ mensaje: '✅ ¡Aquí tienes las variaciones que buscabas!', variaciones: variacionesFiltradas, filtrosDisponibles });
    } catch (error) {
        console.error("🐛 ¡Hubo un error inesperado al obtener las variaciones!", error);
        res.status(500).json({ mensaje: '❌ ¡Uy! No pudimos obtener las variaciones. Algo salió mal en nuestro lado. Inténtalo de nuevo más tarde.', error: error.message });
    }
};

// ---
// 🗑️ ¡Es hora de eliminar una variación!
// Con esta función, puedes deshacerte de una variación que ya no necesites.
// ¡Y nos encargamos de borrar sus fotos de la nube automáticamente!
// ---
const eliminarVariacion = async (req, res) => {
    try {
        const { productoId, id } = req.params;

        const producto = await Producto.findById(productoId);
        if (!producto) {
            console.log(`🚫 ¡Oh no! No encontramos ningún producto con el ID ${productoId}.`);
            return res.status(404).json({ mensaje: '🚫 ¡Parece que ese producto no existe! No podemos eliminar su variación.' });
        }

        const variacion = producto.variaciones.id(id);
        if (!variacion) {
            console.log(`⚠️ ¡Esa variación no la encontramos! El ID ${id} no está en el producto ${productoId}.`);
            return res.status(404).json({ mensaje: '⚠️ ¡Esa variación no está por aquí! Asegúrate de que el ID sea correcto.' });
        }

        if (variacion.imagenes && variacion.imagenes.length > 0) {
            console.log(`🗑️ Preparando para eliminar ${variacion.imagenes.length} fotos de la variación "${id}" de Cloudinary.`);
            for (const img of variacion.imagenes) {
                if (img.public_id) {
                    await cloudinary.uploader.destroy(img.public_id);
                    console.log(`   - 👋 ¡Adiós foto! Se eliminó la imagen con ID ${img.public_id}.`);
                }
            }
            console.log("👍 Todas las fotos asociadas han sido eliminadas.");
        }

        variacion.remove();
        await producto.save();

        console.log(`🎉 ¡Éxito! La variación con ID ${id} fue eliminada del producto ${productoId}.`);
        res.json({ mensaje: '✅ ¡Variación eliminada con éxito! Ya no la verás por aquí.', producto });
    } catch (error) {
        console.error("🐛 ¡Hubo un error inesperado al eliminar la variación!", error);
        res.status(500).json({ mensaje: '❌ ¡Uy! No pudimos eliminar la variación. Algo salió mal en nuestro lado. Inténtalo de nuevo más tarde.', error: error.message });
    }
};

// ---
// ✏️ ¡Es momento de actualizar una variación!
// Aquí puedes cambiar los detalles de una variación existente, ¡incluso sus fotos!
// Puedes borrar algunas fotos y añadir nuevas al mismo tiempo.
// ---
const actualizarVariacion = async (req, res) => {
    try {
        const { productoId, id } = req.params;
        // ✨ CORRECCIÓN: Ahora incluimos 'precio' en la desestructuración de req.body
        const { tallaNumero, tallaLetra, color, stock, precio, imagenesAEliminar } = req.body; 

        const producto = await Producto.findById(productoId);
        if (!producto) {
            console.log(`🚫 ¡Oh no! No encontramos ningún producto con el ID ${productoId}.`);
            return res.status(404).json({ mensaje: '🚫 ¡Parece que ese producto no existe! No podemos actualizar su variación.' });
        }

        const variacion = producto.variaciones.id(id);
        if (!variacion) {
            console.log(`⚠️ ¡Esa variación no la encontramos! El ID ${id} no está en el producto ${productoId}.`);
            return res.status(404).json({ mensaje: '⚠️ ¡Esa variación no está por aquí! Asegúrate de que el ID sea correcto.' });
        }

        // Actualizamos los detalles de la variación con la nueva información que nos diste
        if (tallaNumero !== undefined) variacion.tallaNumero = tallaNumero;
        if (tallaLetra !== undefined) variacion.tallaLetra = tallaLetra;
        if (color !== undefined) variacion.color = color;
        if (stock !== undefined) variacion.stock = Number(stock);
        // ✨ CORRECCIÓN: Actualizamos el precio si se provee
        if (precio !== undefined) {
             // ✨ ADICIÓN: Validación para el precio en la actualización
            if (isNaN(Number(precio)) || Number(precio) < 0) {
                console.log("⚠️ Error al actualizar variación: Precio inválido.");
                return res.status(400).json({ mensaje: '⚠️ El precio de la variación debe ser un número válido y no negativo.' });
            }
            variacion.precio = Number(precio);
        }

        // Si nos pediste eliminar algunas fotos existentes, ¡lo hacemos!
        if (imagenesAEliminar && Array.isArray(imagenesAEliminar) && variacion.imagenes) {
            console.log(`🗑️ Procesando ${imagenesAEliminar.length} fotos a eliminar de la variación "${id}".`);
            for (const public_id of imagenesAEliminar) {
                const index = variacion.imagenes.findIndex(img => img.public_id === public_id);
                if (index > -1) {
                    await cloudinary.uploader.destroy(public_id);
                    variacion.imagenes.splice(index, 1);
                    console.log(`   - 🗑️ Foto con ID ${public_id} eliminada con éxito.`);
                } else {
                    console.log(`   - 🧐 Curioso... La foto con ID ${public_id} no se encontró en la variación. ¡Puede que ya no estuviera!`);
                }
            }
        }

        // Si nos enviaste nuevas fotos, ¡las subimos y las añadimos a la variación!
        // `req.files` es usado para multer.
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            console.log(`📸 ¡Perfecto! Añadiendo ${req.files.length} nuevas fotos a la variación "${id}".`);
            for (const file of req.files) {
                variacion.imagenes.push({
                    url: file.path,
                    public_id: file.filename,
                });
            }
            console.log("👍 Todas las nuevas fotos se han añadido correctamente.");
        } else {
            console.log("ℹ️ No se adjuntaron nuevas fotos para esta actualización.");
        }

        await producto.save();

        console.log(`🎉 ¡Logrado! La variación con ID ${id} del producto ${productoId} ha sido actualizada.`);
        res.json({ mensaje: '✅ ¡Variación actualizada con éxito! Tus cambios están guardados. 🎉', producto });
    } catch (error) {
        console.error("🐛 ¡Hubo un error inesperado al actualizar la variación!", error);
        res.status(500).json({ mensaje: '❌ ¡Uy! No pudimos actualizar la variación. Algo salió mal en nuestro lado. Inténtalo de nuevo más tarde.', error: error.message });
    }
};

// ---
// 📉 ¡Vamos a reducir el stock de una variación!
// Esta función es útil cuando se vende un producto o necesitas ajustar la cantidad disponible.
// ---
const reducirStockVariacion = async (req, res) => {
    try {
        const { cantidad } = req.body;
        const { productoId, id } = req.params;

        const producto = await Producto.findById(productoId);
        if (!producto) {
            console.log(`🚫 ¡Oh no! No encontramos ningún producto con el ID ${productoId}.`);
            return res.status(404).json({ mensaje: '🚫 ¡Parece que ese producto no existe! No podemos reducir el stock de su variación.' });
        }

        const variacion = producto.variaciones.id(id);
        if (!variacion) {
            console.log(`⚠️ ¡Esa variación no la encontramos! El ID ${id} no está en el producto ${productoId}.`);
            return res.status(404).json({ mensaje: '⚠️ ¡Esa variación no está por aquí! Asegúrate de que el ID sea correcto.' });
        }

        if (variacion.stock < cantidad) {
            console.log(`🛑 ¡Stock insuficiente! Solo tenemos ${variacion.stock} y quieres reducir ${cantidad}.`);
            return res.status(400).json({ mensaje: `⚠️ ¡No hay suficiente stock! Solo quedan ${variacion.stock} unidades de esta variación.` });
        }

        variacion.stock -= cantidad;
        await producto.save();

        console.log(`🎉 ¡Stock reducido con éxito para la variación ${id}! Nuevo stock: ${variacion.stock}.`);
        res.json({ mensaje: '✅ ¡Stock reducido con éxito! La cantidad de esta variación ha sido actualizada.', variacion });
    } catch (error) {
        console.error('🐛 ¡Hubo un error inesperado al reducir el stock de la variación!', error);
        res.status(500).json({ mensaje: '❌ ¡Uy! No pudimos reducir el stock. Algo salió mal en nuestro lado. Inténtalo de nuevo más tarde.', error: error.message });
    }
};

module.exports = {
    agregarVariacion,
    obtenerVariaciones,
    eliminarVariacion,
    actualizarVariacion,
    reducirStockVariacion,
};