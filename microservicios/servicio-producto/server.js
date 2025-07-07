const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");

// Cargar variables de entorno
dotenv.config();

// Conexión a la base de datos
const connectDB = require("./config/database");
connectDB();

const app = express();

// Middlewares globales
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta estática para imágenes locales (opcional)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas del microservicio de producto (solo lo que le pertenece)
app.use("/api/productos", require("./routes/productoRoutes"));
app.use("/api/historial", require("./routes/historialRoutes"));
app.use("/api/resenas", require("./routes/resenaRoutes"));
app.use("/api/favoritos", require("./routes/favoritoRoutes"));

// Ruta por defecto
app.get("/", (req, res) => {
  res.send("🛒 Microservicio de productos activo con historial, reseñas y favoritos");
});

// Puerto de escucha
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Microservicio de producto corriendo en http://localhost:${PORT}`);
});
