const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuración del almacenamiento en Cloudinary para categorías
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'categorias', // 📂 Separa las imágenes de categorías
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg', 'avif'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto:best' },
      { fetch_format: 'auto' }
    ],
  },
});

const uploadCategoria = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    console.log('Tipo MIME recibido:', file.mimetype);

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/avif',
      'image/pjpeg'
    ];

    if (file.mimetype === 'application/octet-stream') {
      const allowedExtensions = ['jpeg', 'jpg', 'png', 'avif'];
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      if (allowedExtensions.includes(fileExtension)) {
        return cb(null, true);
      }
      return cb(new Error('Formato de imagen no válido. Solo JPG, JPEG, PNG y AVIF son permitidos.'));
    }

    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(new Error('Formato de imagen no válido. Solo JPG, JPEG, PNG y AVIF son permitidos.'));
  },
});

module.exports = uploadCategoria;
