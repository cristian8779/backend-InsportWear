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

// Crear instancia de la app
const app = express();

// Middlewares globales
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta para servir imágenes si las guardas localmente (opcional)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas
app.use("/api/categorias", require("./routes/categoriaRoutes"));
;

// Ruta base
app.get("/", (req, res) => {
  res.send("🧩 Microservicio de Categorías activo.");
});

// Levantar el servidor
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`🚀 Microservicio de Categorías corriendo en http://localhost:${PORT}`);
});
