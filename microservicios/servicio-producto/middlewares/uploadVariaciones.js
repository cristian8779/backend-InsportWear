const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'variaciones',
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'jpeg', 'avif', 'webp'],
        transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:best' }, // Máxima calidad optimizada
            { format: 'webp' },       // Fuerza conversión a WebP al guardar
            { fetch_format: 'auto' }  // Entrega en el mejor formato compatible
        ],
    },
});

const uploadVariaciones = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
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

        if (mime === 'application/octet-stream') {
            if (allowedExtensions.includes(extension)) return cb(null, true);
            return cb(new Error('❌ Formato no válido. Solo JPG, JPEG, PNG, AVIF y WebP.'));
        }

        if (allowedMimeTypes.includes(mime)) return cb(null, true);
        return cb(new Error('❌ Tipo de imagen no permitido. Usa JPG, JPEG, PNG, AVIF o WebP.'));
    },
});

module.exports = uploadVariaciones.array('imagenes', 5);
