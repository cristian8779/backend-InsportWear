const axios = require("axios");
const Anuncio = require("../models/Anuncio");
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
        const inicioDiaBogota = moment().tz("America/Bogota").startOf('day').toDate();
        const finDiaBogota = moment().tz("America/Bogota").endOf('day').toDate();
        
        const activos = await Anuncio.find({
            fechaInicio: { $lte: finDiaBogota },
            fechaFin: { $gte: inicioDiaBogota },
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
    console.log("🚀 obtenerTodos llamado");
    console.log("📥 Query params:", req.query);
    console.log("👤 Usuario:", req.usuario);
    
    try {
        const { rol } = req.usuario;

        if (!["admin", "superAdmin"].includes(rol)) {
            console.log("❌ Usuario sin permisos:", rol);
            return res.status(403).json({
                error: "No tienes permisos para ver todos los anuncios.",
            });
        }

        console.log("✅ Permisos verificados para:", rol);

        const { page = 1, limit = 10, estado } = req.query;
        const opciones = {
            page: parseInt(page),
            limit: parseInt(limit)
        };

        let filtro = {};
        let orden = { createdAt: -1 };

        // 🔧 CRÍTICO: Crear fechas en Bogotá y dejar que se conviertan a UTC automáticamente
        const ahora = moment().tz("America/Bogota");
        const inicioDiaBogota = ahora.clone().startOf('day').toDate(); // 2 oct 00:00 Bogotá → 2 oct 05:00 UTC
        const finDiaBogota = ahora.clone().endOf('day').toDate();       // 2 oct 23:59 Bogotá → 3 oct 04:59 UTC

        console.log("🕐 Debug fechas:", {
            ahoraLocal: ahora.format('YYYY-MM-DD HH:mm:ss Z'),
            inicioDiaLocal: moment(inicioDiaBogota).tz("America/Bogota").format('YYYY-MM-DD HH:mm:ss Z'),
            finDiaLocal: moment(finDiaBogota).tz("America/Bogota").format('YYYY-MM-DD HH:mm:ss Z'),
            inicioDiaUTC: moment(inicioDiaBogota).utc().format('YYYY-MM-DD HH:mm:ss Z'),
            finDiaUTC: moment(finDiaBogota).utc().format('YYYY-MM-DD HH:mm:ss Z'),
            inicioDiaISO: inicioDiaBogota.toISOString(),
            finDiaISO: finDiaBogota.toISOString()
        });

        if (estado === 'activo') {
            filtro = {
                fechaInicio: { $lte: finDiaBogota },
                fechaFin: { $gte: inicioDiaBogota },
            };
        } else if (estado === 'expirado') {
            filtro = {
                fechaFin: { $lt: inicioDiaBogota },
            };
        } else if (estado === 'programado') {
            filtro = {
                fechaInicio: { $gt: finDiaBogota },
            };
            orden = { fechaInicio: 1 };
            
            // 🔍 DEBUG EXTRA para programados
            console.log("🔍 DEBUG PROGRAMADO:");
            console.log("   finDiaBogota (Date):", finDiaBogota);
            console.log("   finDiaBogota (ISO):", finDiaBogota.toISOString());
            
            // Probar consulta directa
            const testQuery = await Anuncio.find({
                fechaInicio: { $gt: finDiaBogota }
            });
            console.log("   Anuncios con fechaInicio > finDiaBogota:", testQuery.length);
            if (testQuery.length > 0) {
                console.log("   Primer anuncio encontrado:", {
                    id: testQuery[0]._id,
                    fechaInicio: testQuery[0].fechaInicio,
                    fechaInicioISO: testQuery[0].fechaInicio.toISOString()
                });
            }
            
            // Listar TODOS los anuncios para ver qué hay
            const todosLosAnuncios = await Anuncio.find({}).select('fechaInicio fechaFin');
            console.log("   📊 TODOS los anuncios en BD:", todosLosAnuncios.map(a => ({
                id: a._id,
                inicio: a.fechaInicio.toISOString(),
                fin: a.fechaFin.toISOString()
            })));
        }

        const anuncios = await Anuncio.find(filtro)
            .sort(orden)
            .limit(opciones.limit)
            .skip((opciones.page - 1) * opciones.limit);

        const total = await Anuncio.countDocuments(filtro);

        // 📊 Debug detallado
        console.log(`📋 Estado solicitado: ${estado}`);
        console.log(`📋 Filtro aplicado:`, JSON.stringify(filtro, null, 2));
        console.log(`📋 Anuncios encontrados: ${anuncios.length}, Total: ${total}`);
        
        if (anuncios.length > 0) {
            console.log(`📋 Primer anuncio:`, {
                id: anuncios[0]._id,
                fechaInicio: anuncios[0].fechaInicio,
                fechaFin: anuncios[0].fechaFin
            });
        }

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
            await limpiarImagenCloudinary(imagenSubida, "- anuncio duplicado en fechas");
            return res.status(409).json({
                error: "Ya existe un anuncio activo para ese producto o categoría en ese rango de fechas.",
            });
        }

        // 🔗 Validar que el producto/categoría exista
        if (productoId) {
            try {
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
            }
        }

        if (categoriaId) {
            try {
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
        imagenSubida = null; // ✅ ya no hacer rollback

        console.log(`✅ Anuncio creado exitosamente: ${anuncio._id}`);
        res.status(201).json(anuncio);

    } catch (error) {
        console.error("❌ Error interno al crear el anuncio:", error);
        if (imagenSubida) {
            await limpiarImagenCloudinary(imagenSubida, "- error interno en creación");
        }
        if (error.code === 11000) {
            return res.status(409).json({
                error: "Ya existe un anuncio con características similares.",
            });
        }
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

// 🚨 Eliminar anuncios por productoId
const eliminarAnunciosPorProducto = async (req, res) => {
    try {
        const { productoId } = req.params;

        const anuncios = await Anuncio.find({ productoId });

        for (const anuncio of anuncios) {
            if (anuncio.publicId) {
                await limpiarImagenCloudinary(anuncio.publicId, "- eliminación masiva por producto");
            }
        }

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