const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuración del almacenamiento en Cloudinary para categorías
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'categorias', // 📂 Carpeta separada para imágenes de categorías
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg', 'avif', 'webp'], // Añadido WebP
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' }, // Antes 'auto:best', ahora más ligero
      { fetch_format: 'auto' }
    ],
  },
});

const uploadCategoria = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    console.log('📂 Subiendo imagen de categoría:', file.originalname);
    console.log('🔍 Tipo MIME recibido:', file.mimetype);

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/avif',
      'image/webp',
      'image/pjpeg'
    ];
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'avif', 'webp'];

    // Caso de tipo MIME genérico
    if (file.mimetype === 'application/octet-stream') {
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      if (allowedExtensions.includes(fileExtension)) {
        return cb(null, true);
      }
      return cb(new Error('❌ Formato no válido: Solo se permiten imágenes en JPG, JPEG, PNG, AVIF o WebP.'));
    }

    // Caso de tipo MIME reconocido
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(new Error('❌ Tipo de imagen no permitido. Por favor, sube archivos en formato JPG, JPEG, PNG, AVIF o WebP.'));
  },
});

module.exports = uploadCategoria;
