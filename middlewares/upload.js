const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuración del almacenamiento en Cloudinary con optimización
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'productos',
    resource_type: 'image', // Solo imágenes
    allowed_formats: ['jpg', 'png', 'jpeg', 'avif'], // Soporta AVIF
    transformation: [
      { width: 800, height: 800, crop: 'limit' }, // Redimensiona si es necesario
      { quality: 'auto:best' }, // Mantiene la mejor calidad posible
      { fetch_format: 'auto' } // Usa el mejor formato según el dispositivo
    ],
  },
});

// Middleware de multer para subir imágenes
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (req, file, cb) => {
    console.log('Tipo MIME recibido:', file.mimetype);
    
    // Lista de mimetypes permitidos
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/avif',
      'image/pjpeg'
    ];
    
    // Si el mimetype es 'application/octet-stream', validar por la extensión del archivo
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

module.exports = upload;
