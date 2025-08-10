const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuración del almacenamiento en Cloudinary con optimización
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'productos',
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg', 'avif', 'webp'], // Se añadió webp
    transformation: [
      { width: 800, height: 800, crop: 'limit' }, // Redimensiona si excede 800px
      { quality: 'auto' }, // Antes: 'auto:best' (ahora más ligero sin perder calidad)
      { fetch_format: 'auto' } // Entrega en formato óptimo (WebP/AVIF si es posible)
    ],
  },
});

// Middleware de multer para subir imágenes
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype;
    const extension = file.originalname.split('.').pop().toLowerCase();
    console.log('📷 Intentando subir archivo:', file.originalname);
    console.log('🔎 Tipo MIME recibido:', mime);

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/avif',
      'image/webp',
      'image/pjpeg'
    ];
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'avif', 'webp'];

    // Archivos con tipo MIME genérico
    if (mime === 'application/octet-stream') {
      if (allowedExtensions.includes(extension)) {
        return cb(null, true);
      }
      console.warn('⛔ Archivo rechazado por extensión no válida:', extension);
      return cb(new Error('❌ El formato del archivo no es válido. Solo se permiten imágenes JPG, JPEG, PNG, AVIF y WebP.'));
    }

    // Archivos con tipo MIME claro
    if (allowedMimeTypes.includes(mime)) {
      return cb(null, true);
    }

    console.warn('⛔ Tipo MIME no permitido:', mime);
    return cb(new Error('❌ El tipo de imagen no está permitido. Asegúrate de subir un archivo en formato JPG, JPEG, PNG, AVIF o WebP.'));
  },
});

module.exports = upload;
