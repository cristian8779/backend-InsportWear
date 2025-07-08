const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuración del almacenamiento en Cloudinary para anuncios
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'anuncios', // Carpeta específica para anuncios
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg', 'avif'],
    transformation: [
      { width: 1200, height: 400, crop: 'limit' }, // Tamaño típico de banner horizontal
      { quality: 'auto:eco' },                    // Calidad ajustada automáticamente (modo económico)
      { fetch_format: 'auto' }                    // Usa el mejor formato compatible (WebP, AVIF, etc.)
    ],
  },
});

// Middleware de multer para subir imágenes de anuncios
const uploadAnuncio = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite: 5MB
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype;
    const extension = file.originalname.split('.').pop().toLowerCase();
    console.log('📢 Subiendo imagen de anuncio:', file.originalname);
    console.log('🔍 Tipo MIME:', mime);

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/avif',
      'image/pjpeg'
    ];
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'avif'];

    if (mime === 'application/octet-stream') {
      if (allowedExtensions.includes(extension)) {
        return cb(null, true);
      }
      console.warn('⛔ Extensión no válida:', extension);
      return cb(new Error('❌ Formato inválido. Solo JPG, JPEG, PNG y AVIF.'));
    }

    if (allowedMimeTypes.includes(mime)) {
      return cb(null, true);
    }

    console.warn('⛔ Tipo MIME no permitido:', mime);
    return cb(new Error('❌ Tipo de imagen no permitido. Solo se aceptan JPG, JPEG, PNG y AVIF.'));
  },
});

module.exports = uploadAnuncio;
