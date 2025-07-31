const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'variaciones', // 👈 Nuevo folder en Cloudinary
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'jpeg', 'avif'],
        transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
        ],
    },
});

const uploadVariaciones = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB por archivo
    fileFilter: (req, file, cb) => {
        const mime = file.mimetype;
        const extension = file.originalname.split('.').pop().toLowerCase();

        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/avif',
            'image/pjpeg'
        ];
        const allowedExtensions = ['jpeg', 'jpg', 'png', 'avif'];

        if (mime === 'application/octet-stream') {
            if (allowedExtensions.includes(extension)) return cb(null, true);
            return cb(new Error('❌ Formato no válido. Solo imágenes JPG, JPEG, PNG y AVIF.'));
        }

        if (allowedMimeTypes.includes(mime)) return cb(null, true);
        return cb(new Error('❌ Tipo de imagen no permitido.'));
    },
});

// ⚡️ CAMBIO AQUÍ: Usamos .array() para permitir múltiples archivos
// 'imagenes' es el nombre del campo en tu formulario (ej. <input type="file" name="imagenes" multiple>)
// El '5' es el número máximo de archivos que se pueden subir en una sola solicitud.
module.exports = uploadVariaciones.array('imagenes', 5);