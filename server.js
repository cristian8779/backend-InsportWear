require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const { iniciarExpiracionAutomatica } = require('./config/cronJobs'); // ⏰

const app = express();
const PORT = process.env.PORT || 5000;

// 📦 Rutas
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const resetPasswordRoutes = require('./routes/resetPasswordRoutes');
const productoRoutes = require('./routes/productoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const favoritoRoutes = require('./routes/favoritoRoutes');
const resenaRoutes = require('./routes/resenas');
const historialRoutes = require('./routes/historial');
const loginRoutes = require('./routes/login.Routes');
const rolRoutes = require('./routes/rolRoutes');
const adminRoutes = require('./routes/adminRoutes');
const googleSearchRoutes = require('./routes/googleSearchRoutes'); // 👈 NUEVA RUTA

// 🛡️ Middlewares
app.use(express.json());
app.use(cors());

// 🗂️ Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// 🔌 Montar rutas
app.use('/api', authRoutes);
app.use('/api', usuarioRoutes);
app.use('/api', perfilRoutes);
app.use('/api', resetPasswordRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/favoritos', favoritoRoutes);
app.use('/api/resenas', resenaRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api', loginRoutes);
app.use('/api/rol', rolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/google-images', googleSearchRoutes); // 🔍 Imagen por internet (solo admin/superAdmin)

// Ruta base
app.get('/', (req, res) => {
  res.send('🚀 API funcionando correctamente');
});

// 🔌 DB + servidor
const startServer = async () => {
  try {
    await connectDB();
    iniciarExpiracionAutomatica();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🔥 Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
