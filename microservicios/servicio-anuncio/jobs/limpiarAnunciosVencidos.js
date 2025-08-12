const cron = require('node-cron');
const Anuncio = require('../models/Anuncio');
const cloudinary = require('../config/cloudinary');
const moment = require('moment-timezone');

// 🧹 Función auxiliar para limpiar imagen de Cloudinary
const limpiarImagenCloudinary = async (publicId, contexto = "") => {
    if (!publicId) return false;
    
    try {
        const resultado = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image',
        });
        
        if (resultado.result === 'ok') {
            console.log(`🗑️ Imagen eliminada de Cloudinary ${contexto}: ${publicId}`);
            return true;
        } else {
            console.warn(`⚠️ Imagen no encontrada en Cloudinary ${contexto}: ${publicId}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error al eliminar imagen de Cloudinary ${contexto}: ${publicId}`, error.message);
        return false;
    }
};

// 🕛 Tarea programada: todos los días a las 00:00 (medianoche)
cron.schedule('0 0 * * *', async () => {
    console.log('🕛 Iniciando limpieza automática de anuncios vencidos...');
    console.log('📅 Fecha actual:', moment().tz("America/Bogota").format('YYYY-MM-DD HH:mm:ss'));

    try {
        // Calcular fecha actual en zona horaria de Colombia
        const hoy = moment().tz("America/Bogota").startOf('day').toDate();
        console.log(`🔍 Buscando anuncios vencidos antes de: ${hoy.toISOString()}`);

        // Buscar anuncios vencidos (fechaFin menor a hoy)
        const anunciosVencidos = await Anuncio.find({ 
            fechaFin: { $lt: hoy } 
        });

        console.log(`📊 Anuncios vencidos encontrados: ${anunciosVencidos.length}`);

        if (anunciosVencidos.length === 0) {
            console.log('✅ No hay anuncios vencidos para eliminar');
            return;
        }

        // Contadores para estadísticas
        let imagenesEliminadas = 0;
        let imagenesError = 0;
        let anunciosEliminados = 0;
        let anunciosError = 0;

        // Procesar cada anuncio vencido
        await Promise.all(anunciosVencidos.map(async (anuncio) => {
            try {
                // 1️⃣ Eliminar imagen de Cloudinary si existe
                if (anuncio.publicId) {
                    const imagenEliminada = await limpiarImagenCloudinary(
                        anuncio.publicId, 
                        `- limpieza automática`
                    );
                    
                    if (imagenEliminada) {
                        imagenesEliminadas++;
                    } else {
                        imagenesError++;
                    }
                } else {
                    console.log(`ℹ️ Anuncio ${anuncio._id} no tiene imagen asociada`);
                }

                // 2️⃣ Eliminar anuncio de la base de datos
                await Anuncio.findByIdAndDelete(anuncio._id);
                anunciosEliminados++;
                
                console.log(`✅ Anuncio eliminado: ${anuncio._id} (Vencido: ${anuncio.fechaFin.toISOString().split('T')[0]})`);

            } catch (error) {
                anunciosError++;
                console.error(`❌ Error procesando anuncio ${anuncio._id}:`, error.message);
            }
        }));

        // 📊 Resumen de la limpieza
        console.log('\n📋 RESUMEN DE LIMPIEZA AUTOMÁTICA:');
        console.log(`✅ Anuncios eliminados: ${anunciosEliminados}`);
        console.log(`❌ Anuncios con error: ${anunciosError}`);
        console.log(`🗑️ Imágenes eliminadas de Cloudinary: ${imagenesEliminadas}`);
        console.log(`⚠️ Imágenes con error en Cloudinary: ${imagenesError}`);
        console.log(`🕛 Limpieza completada a las: ${moment().tz("America/Bogota").format('HH:mm:ss')}`);

    } catch (error) {
        console.error("❌ Error crítico en la limpieza automática de anuncios:", error.message);
        console.error("Stack trace:", error.stack);
    }
});

// 🔄 Tarea adicional: verificación cada 6 horas (opcional)
cron.schedule('0 */6 * * *', async () => {
    try {
        const hoy = moment().tz("America/Bogota").startOf('day').toDate();
        const vencidosCount = await Anuncio.countDocuments({ 
            fechaFin: { $lt: hoy } 
        });
        
        if (vencidosCount > 0) {
            console.log(`⚠️ ALERTA: ${vencidosCount} anuncios vencidos pendientes de limpieza`);
        }
    } catch (error) {
        console.error("❌ Error en verificación periódica:", error.message);
    }
});

console.log('⏰ Cron jobs de limpieza de anuncios iniciados:');
console.log('   🕛 Limpieza automática: Todos los días a las 00:00');
console.log('   🔄 Verificación: Cada 6 horas');
console.log('   🌍 Zona horaria: America/Bogota');