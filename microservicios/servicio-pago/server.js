require('dotenv').config();
const path = require('path');
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
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://api.soportee.store',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json());

// 📦 Rutas de pago
app.use('/api/pagos', pagoRoutes);
app.use('/api/firmas', firmaRoutes);

// 🗂 Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// ❌ Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});

// 🚀 Servidor en marcha
app.listen(PORT, () => {
  console.log(`🚀 Servicio de pago escuchando en http://localhost:${PORT}`);
});
