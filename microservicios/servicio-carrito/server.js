const express = require('express');
const mongoose = require('mongoose');
const carritoRoutes = require('./routes/carritoRoutes');
const conectarDB = require('./config/database');
const cors = require('cors');
require('dotenv').config(); // Cargar variables del .env si existe

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a la base de datos
conectarDB();

// Rutas del microservicio
app.use('/api', carritoRoutes);

// Ruta base
app.get('/', (req, res) => {
  res.send('Microservicio de carrito activo 🚀');
});

// Levantar servidor en el puerto 3005
const PORT = 3005;
app.listen(PORT, () => {
  console.log(`✅ Microservicio de carrito corriendo en ${PORT}`);
});
