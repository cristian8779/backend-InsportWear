require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const conectarDB = require('./config/database');
const pagoRoutes = require('./routes/pagoRoutes');
const firmaRoutes = require('./routes/firmaRoutes');



const app = express();
const PORT = process.env.PORT || 3007;

// 🔌 Conexión a la base de datos
conectarDB();

// 🧱 Middlewares generales
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// 📦 Rutas de pago (ej: POST /api/pagos/crear)
app.use('/api/pagos', pagoRoutes);
app.use('/api/firmas', firmaRoutes);

// ❌ Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});

// 🚀 Servidor en marcha
app.listen(PORT, () => {
  console.log(`🚀 Servicio de pago escuchando en http://localhost:${PORT}`);
});
