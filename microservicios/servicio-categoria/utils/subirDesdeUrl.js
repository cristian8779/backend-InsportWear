const axios = require('axios');
const cloudinary = require('../config/cloudinary');
const path = require('path');

const subirImagenDesdeUrl = async (url, carpeta = 'categorias') => {
  try {
    const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.avif'];
    const extension = path.extname(new URL(url).pathname).toLowerCase();

    // 1. Validación de extensión
    if (!extensionesPermitidas.includes(extension)) {
      throw new Error(`🚫 Formato de imagen no válido: "${extension}". Solo se permiten: JPG, JPEG, PNG, AVIF.`);
    }

    // 2. Descargar imagen desde la URL
    const respuesta = await axios.get(url, { responseType: 'arraybuffer' });
    const mimeType = respuesta.headers['content-type'];

    // 3. Validación de tipo MIME
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/avif', 'image/jpg'];
    if (!tiposPermitidos.includes(mimeType)) {
      throw new Error(`⚠️ El tipo de imagen "${mimeType}" no está permitido. Usa imágenes en formato JPG, JPEG, PNG o AVIF.`);
    }

    // 4. Convertir a base64
    const base64 = Buffer.from(respuesta.data, 'binary').toString('base64');
    const dataUri = `data:${mimeType};base64,${base64}`;

    // 5. Subir a Cloudinary
    const resultado = await cloudinary.uploader.upload(dataUri, {
      folder: carpeta,
    });

    return resultado.secure_url;

  } catch (error) {
    // ⚠️ Mensaje claro para el usuario final
    throw new Error(`❌ No se pudo cargar la imagen desde internet. Motivo: ${error.message}`);
  }
};

module.exports = subirImagenDesdeUrl;
