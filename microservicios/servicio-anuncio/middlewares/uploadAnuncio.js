const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuración del almacenamiento en Cloudinary para anuncios con máxima calidad
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'anuncios', // Carpeta específica para anuncios
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg', 'avif', 'webp'],
    transformation: [
      { width: 1200, height: 400, crop: 'fit' },  // Mantiene proporción sin distorsionar
      { quality: 'auto:best' },                   // Calidad máxima automática
      { fetch_format: 'auto' }                    // Formato óptimo para cada navegador
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
      'image/webp',
      'image/pjpeg'
    ];
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'avif', 'webp'];

    // Caso especial: tipo MIME genérico
    if (mime === 'application/octet-stream') {
      if (allowedExtensions.includes(extension)) {
        console.log('✅ Archivo aceptado por extensión:', extension);
        return cb(null, true);
      }
      console.warn('⛔ Extensión no válida:', extension);
      return cb(new Error('❌ Formato inválido. Solo JPG, JPEG, PNG, AVIF o WebP.'));
    }

    // Validación normal por MIME
    if (allowedMimeTypes.includes(mime)) {
      console.log('✅ Archivo aceptado por MIME:', mime);
      return cb(null, true);
    }

    console.warn('⛔ Tipo MIME no permitido:', mime);
    return cb(new Error('❌ Tipo de imagen no permitido. Solo se aceptan JPG, JPEG, PNG, AVIF o WebP.'));
  },
});

module.exports = uploadAnuncio;
