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

// 🧱 Middlewares generales - CORS actualizado para WebViews
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://api.soportee.store',
    'https://mellow-pasca-a7bd11.netlify.app',
    null // ✅ CRÍTICO: Permite solicitudes desde WebViews (origin: null)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// 🛡️ Middleware adicional para manejar preflight y WebViews
app.use((req, res, next) => {
  // Permite explícitamente el origen null para WebViews
  if (req.headers.origin === null || req.headers.origin === 'null') {
    res.header('Access-Control-Allow-Origin', 'null');
  }
  
  // Manejo específico para solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '86400'); // 24 horas
    return res.sendStatus(200);
  }
  
  next();
});

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