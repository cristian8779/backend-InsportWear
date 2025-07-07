require("dotenv").config();
const express = require("express");
const cors = require("cors");
const conectarDB = require("./config/database");

const ventaRoutes = require("./routes/ventaRoutes");

const app = express(); // 🔥 ESTA LÍNEA es la que te falta

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar base de datos
conectarDB();

// Rutas
app.use("/api/ventas", ventaRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("🚀 Microservicio de VENTAS funcionando");
});

// Puerto
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`✅ Servidor de VENTAS activo en http://localhost:${PORT}`);
});
