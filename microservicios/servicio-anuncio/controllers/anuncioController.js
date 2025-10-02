const axios = require("axios");
const Anuncio = require("../models/Anuncio"); // ✅ Sin .js
const cloudinary = require("../config/cloudinary");
const moment = require("moment-timezone");

// Servicios externos para obtener productos y categorías
const { obtenerProductos, obtenerCategorias } = require("../utils/externalServices");

// 🧹 Función auxiliar para limpiar imagen de Cloudinary
const limpiarImagenCloudinary = async (publicId, contexto = "") => {
    if (!publicId) return;
    
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image',
        });
        console.log(`🧹 Imagen eliminada de Cloudinary ${contexto}: ${publicId}`);
    } catch (error) {
        console.error(`⚠️ Error al eliminar imagen de Cloudinary ${contexto}:`, error.message);
    }
};

// ✅ Obtener hasta 5 anuncios activos por fecha
const obtenerActivos = async (req, res) => {
    try {
        const hoy = moment().tz("America/Bogota").startOf('day').toDate();
        const activos = await Anuncio.find({
            fechaInicio: { $lte: hoy },
            fechaFin: { $gte: hoy },
        }).limit(5);
        res.json(activos);
    } catch (error) {
        console.error("❌ Error al obtener anuncios:", error);
        res.status(500).json({
            error: "Hubo un problema al obtener los anuncios activos. Intenta nuevamente más tarde.",
        });
    }
};

// ✅ Obtener todos los anuncios (para administración)
const obtenerTodos = async (req, res) => {
    try {
        const { rol } = req.usuario;

        if (!["admin", "superAdmin"].includes(rol)) {
            return res.status(403).json({
                error: "No tienes permisos para ver todos los anuncios.",
            });
        }

        const { page = 1, limit = 10, estado } = req.query;
        const opciones = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        };

        let filtro = {};
        
        // Filtrar por estado si se especifica
        if (estado === 'activo') {
            const hoy = moment().tz("America/Bogota").startOf('day').toDate();
            filtro = {
                fechaInicio: { $lte: hoy },
                fechaFin: { $gte: hoy },
            };
        } else if (estado === 'expirado') {
            const hoy = moment().tz("America/Bogota").startOf('day').toDate();
            filtro = {
                fechaFin: { $lt: hoy },
            };
        } else if (estado === 'programado') {
    const ahora = new Date(); // hora exacta del momento
    filtro = {
        fechaInicio: { $gt: ahora },
    };
}


        const anuncios = await Anuncio.find(filtro)
            .sort({ createdAt: -1 })
            .limit(opciones.limit)
            .skip((opciones.page - 1) * opciones.limit);

        const total = await Anuncio.countDocuments(filtro);

        res.json({
            anuncios,
            totalPages: Math.ceil(total / opciones.limit),
            currentPage: opciones.page,
            total
        });

    } catch (error) {
        console.error("❌ Error al obtener anuncios:", error);
        res.status(500).json({
            error: "No se pudieron obtener los anuncios.",
        });
    }
};

// ✅ Crear un nuevo anuncio con rollback de imagen mejorado
const crearAnuncio = async (req, res) => {
    let imagenSubida = null; // Para tracking de rollback
    
    try {
        const { rol, id: usuarioId } = req.usuario;

        // 🔒 Validación de permisos ANTES de procesar imagen
        if (!["admin", "superAdmin"].includes(rol)) {
            // Limpiar imagen si no tiene permisos
            if (req.file?.filename) {
                await limpiarImagenCloudinary(req.file.filename, "- error de permisos");
            }
            return res.status(403).json({
                error: "No tienes permisos para crear anuncios.",
            });
        }

        const { fechaInicio, fechaFin, productoId, categoriaId } = req.body;

        // 📋 Validaciones básicas ANTES de procesar imagen
        if (!productoId && !categoriaId) {
            if (req.file?.filename) {
                await limpiarImagenCloudinary(req.file.filename, "- error de validación: falta producto/categoría");
            }
            return res.status(400).json({
                error: "Debes asociar el anuncio a un producto o una categoría.",
            });
        }

        if (!fechaInicio || !fechaFin) {
            if (req.file?.filename) {
                await limpiarImagenCloudinary(req.file.filename, "- error de validación: faltan fechas");
            }
            return res.status(400).json({
                error: "Debes especificar la fecha de inicio y la de finalización del anuncio.",
            });
        }

        // 📅 Validación de fechas
        const fechaInicioDate = moment.tz(fechaInicio, "America/Bogota").startOf('day').toDate();
        const fechaFinDate = moment.tz(fechaFin, "America/Bogota").endOf('day').toDate();

        if (fechaFinDate < fechaInicioDate) {
            if (req.file?.filename) {
                await limpiarImagenCloudinary(req.file.filename, "- error de validación: fechas inválidas");
            }
            return res.status(400).json({
                error: "La fecha de finalización no puede ser anterior a la de inicio.",
            });
        }

        // 🖼️ Validación de imagen
        if (!req.file || !req.file.path || !req.file.filename) {
            return res.status(400).json({
                error: "Debes subir una imagen válida para el anuncio.",
            });
        }

        // 📷 Registrar imagen para posible rollback
        imagenSubida = req.file.filename;
        console.log(`📷 Imagen registrada para rollback: ${imagenSubida}`);

        const imagenUrl = req.file.path;
        const publicId = req.file.filename;

        // 🔍 Validar si ya existe anuncio con fechas solapadas
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
            // Rollback: eliminar imagen si ya existe anuncio
            await limpiarImagenCloudinary(imagenSubida, "- anuncio duplicado en fechas");
            return res.status(409).json({
                error: "Ya existe un anuncio activo para ese producto o categoría en ese rango de fechas.",
            });
        }

        // 🔗 Validar que el producto/categoría exista (opcional pero recomendado)
        if (productoId) {
            try {
                // Verificar que el producto existe en el microservicio
                const productos = await obtenerProductos();
                const productoExiste = productos.some(p => p._id === productoId);
                
                if (!productoExiste) {
                    await limpiarImagenCloudinary(imagenSubida, "- producto no encontrado");
                    return res.status(404).json({
                        error: "El producto especificado no existe.",
                    });
                }
            } catch (err) {
                console.warn("⚠️ No se pudo verificar la existencia del producto:", err.message);
                // Continuar sin validar si el servicio no está disponible
            }
        }

        if (categoriaId) {
            try {
                // Verificar que la categoría existe en el microservicio
                const categorias = await obtenerCategorias();
                const categoriaExiste = categorias.some(c => c._id === categoriaId);
                
                if (!categoriaExiste) {
                    await limpiarImagenCloudinary(imagenSubida, "- categoría no encontrada");
                    return res.status(404).json({
                        error: "La categoría especificada no existe.",
                    });
                }
            } catch (err) {
                console.warn("⚠️ No se pudo verificar la existencia de la categoría:", err.message);
                // Continuar sin validar si el servicio no está disponible
            }
        }

        // 🔗 Generar deeplink
        let deeplink = "/";
        if (productoId) deeplink = `/producto/${productoId}`;
        else if (categoriaId) deeplink = `/categoria/${categoriaId}`;

        // 💾 Crear y guardar el anuncio
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
        
        // ✅ Si llegamos aquí, todo salió bien - no hacer rollback
        imagenSubida = null;
        
        console.log(`✅ Anuncio creado exitosamente: ${anuncio._id}`);
        res.status(201).json(anuncio);

    } catch (error) {
        console.error("❌ Error interno al crear el anuncio:", error);
        
        // 🧹 ROLLBACK: Eliminar imagen de Cloudinary si algo falló
        if (imagenSubida) {
            await limpiarImagenCloudinary(imagenSubida, "- error interno en creación");
        }
        
        // Verificar si el error es por un duplicado de MongoDB
        if (error.code === 11000) {
            return res.status(409).json({
                error: "Ya existe un anuncio con características similares.",
            });
        }
        
        // Error de validación de MongoDB
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: `Errores de validación: ${errores.join(', ')}`,
            });
        }
        
        res.status(500).json({
            error: "No se pudo crear el anuncio por un problema interno. Intenta nuevamente más tarde.",
        });
    }
};

// ✅ Eliminar anuncio (sin cambios, ya está bien)
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

        // Eliminar imagen de Cloudinary
        if (anuncio.publicId) {
            await limpiarImagenCloudinary(anuncio.publicId, "- eliminación de anuncio");
        }

        await Anuncio.findByIdAndDelete(req.params.id);
        
        console.log(`✅ Anuncio eliminado exitosamente: ${req.params.id}`);
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

// 🚨 Eliminar anuncios por productoId (para cuando se borra un producto)
const eliminarAnunciosPorProducto = async (req, res) => {
    try {
        const { productoId } = req.params;

        // Buscar anuncios relacionados
        const anuncios = await Anuncio.find({ productoId });

        // Eliminar imágenes en Cloudinary asociadas a esos anuncios
        for (const anuncio of anuncios) {
            if (anuncio.publicId) {
                await limpiarImagenCloudinary(anuncio.publicId, "- eliminación masiva por producto");
            }
        }

        // Eliminar anuncios en DB
        await Anuncio.deleteMany({ productoId });

        console.log(`✅ Se eliminaron los anuncios relacionados con el producto ${productoId}`);
        res.json({ mensaje: `Se eliminaron ${anuncios.length} anuncios relacionados con el producto ${productoId}` });

    } catch (error) {
        console.error("❌ Error al eliminar anuncios por producto:", error);
        res.status(500).json({ error: "No se pudieron eliminar los anuncios relacionados a este producto." });
    }
};



module.exports = {
    obtenerActivos,
    obtenerTodos,
    crearAnuncio,
    eliminarAnuncio,
    obtenerProductos: obtenerProductosDesdeServicio,
    obtenerCategorias: obtenerCategoriasDesdeServicio,
    eliminarAnunciosPorProducto
};