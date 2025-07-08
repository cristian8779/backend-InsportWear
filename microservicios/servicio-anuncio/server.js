require("dotenv").config();
const express = require("express");
const cors = require("cors");
const anuncioRoutes = require("./routes/anuncio.routes");
const connectDB = require("./config/database");

// 🔌 Conectar a la base de datos
connectDB();

// 🚀 Inicializar app
const app = express();

// 🧹 Cargar tarea programada (cron job de limpieza de anuncios vencidos)
require("./jobs/limpiarAnunciosVencidos");

// 🔐 Middlewares base
app.use(cors());
app.use(express.json());

// 📦 Rutas
app.use("/api/anuncios", anuncioRoutes);

// 🛠️ Ruta de prueba o estado
app.get("/", (req, res) => {
  res.send("✅ API de anuncios funcionando correctamente");
});

// 🛡️ Middleware opcional de manejo global de errores
app.use((err, req, res, next) => {
  console.error("❌ Error no controlado:", err.stack);
  res.status(500).json({ error: "Error interno del servidor." });
});

// 🔊 Levantar el servidor
const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`✅ Servidor de Anuncios corriendo en http://localhost:${PORT}`);
});
