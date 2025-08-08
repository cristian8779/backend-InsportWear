const cron = require('node-cron');
const Anuncio = require('../models/Anuncio');
const cloudinary = require('../config/cloudinary');

// Tarea programada: todos los días a las 00:00
cron.schedule('0 0 * * *', async () => {
  console.log('🕛 Iniciando limpieza de anuncios vencidos...');

  try {
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);

    // Buscar anuncios vencidos
    const vencidos = await Anuncio.find({ fechaFin: { $lt: hoy } });

    await Promise.all(vencidos.map(async (anuncio) => {
      if (anuncio.publicId) {
        try {
          await cloudinary.uploader.destroy(anuncio.publicId);
          console.log(`🗑️ Imagen eliminada de Cloudinary: ${anuncio.publicId}`);
        } catch (err) {
          console.warn(`⚠️ Error eliminando imagen Cloudinary (${anuncio.publicId}):`, err.message);
        }
      }
      await anuncio.deleteOne();
      console.log(`✅ Anuncio eliminado: ${anuncio._id}`);
    }));

    console.log(`📦 Limpieza completada. Total eliminados: ${vencidos.length}`);

  } catch (error) {
    console.error("❌ Error al ejecutar la limpieza de anuncios vencidos:", error.message);
  }
});
