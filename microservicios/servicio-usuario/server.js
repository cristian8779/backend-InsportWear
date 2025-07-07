const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const fileUpload = require("express-fileupload");
const path = require("path");


// Cargar variables de entorno
dotenv.config();

// Conexión a la base de datos
const connectDB = require("./config/database");
connectDB(); // Ejecutar conexión

const app = express();

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas principales
app.use("/api/perfil", require("./routes/perfilRoutes"));
app.use("/api/usuario", require("./routes/usuarioRoutes"));
app.use("/api/password", require("./routes/resetPasswordRoutes")); // 🚨 NUEVO: ruta de restablecimiento


// Servir archivos estáticos (por si usas HTML para restablecer)
app.use(express.static(path.join(__dirname, "public")));

// Puerto de escucha
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Microservicio de usuario corriendo en http://localhost:${PORT}`);
});
