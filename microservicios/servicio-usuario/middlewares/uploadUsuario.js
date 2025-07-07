const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'usuarios', // <<< CARPETA SEPARADA
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg', 'avif'],
    transformation: [
      { width: 600, height: 600, crop: 'limit' }, // Perfil: tamaño más pequeño
      { quality: 'auto:best' },
      { fetch_format: 'auto' }
    ],
  },
});

const uploadUsuario = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
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
      return cb(new Error('Formato de imagen no válido.'));
    }

    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(new Error('Formato de imagen no válido.'));
  },
});

module.exports = uploadUsuario;
