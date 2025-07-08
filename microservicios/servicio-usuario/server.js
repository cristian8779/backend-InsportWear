const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
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

// ❌ ELIMINADO: express-fileupload
// app.use(fileUpload({ useTempFiles: true }));

// Archivos estáticos (en caso de usarlos localmente)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas principales
app.use("/api/perfil", require("./routes/perfilRoutes"));
app.use("/api/usuario", require("./routes/usuarioRoutes"));
app.use("/api/password", require("./routes/resetPasswordRoutes")); // Restablecer contraseña

// Servir archivos estáticos (útil para HTMLs de pruebas)
app.use(express.static(path.join(__dirname, "public")));

// Puerto de escucha
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Microservicio de usuario corriendo en http://localhost:${PORT}`);
});
