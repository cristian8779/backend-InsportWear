const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuración del almacenamiento en Cloudinary para imágenes de perfil de usuario
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'usuarios', // 📂 Carpeta separada para usuarios
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg', 'avif', 'webp'],
    transformation: [
      { width: 600, height: 600, crop: 'fit' }, // Mantiene proporción y evita recortes bruscos
      { quality: 'auto:best' },                 // Máxima calidad posible
      { fetch_format: 'auto' }                  // Usa el mejor formato soportado por el navegador
    ],
  },
});

const uploadUsuario = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite: 5MB
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype;
    const extension = file.originalname.split('.').pop().toLowerCase();

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/avif',
      'image/webp',
      'image/pjpeg'
    ];
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'avif', 'webp'];

    console.log('👤 Subiendo imagen de usuario:', file.originalname);
    console.log('🔍 Tipo MIME recibido:', mime);

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

module.exports = uploadUsuario;
