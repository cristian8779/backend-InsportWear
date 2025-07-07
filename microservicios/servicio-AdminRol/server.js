require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const conectarDB = require("./config/database");

const app = express();

// Conectar a la base de datos
conectarDB();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// 👉 Asegurate de tener estos archivos:
const adminRoutes = require("./routes/adminRoutes");
const rolRoutes = require("./routes/rolRoutes");

// ✅ Usar routers, no controladores directamente
app.use("/api/admin", adminRoutes);
app.use("/api/rol", rolRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("🚀 Microservicio AdminRol corriendo en el puerto 3008");
});

// Puerto
const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});
