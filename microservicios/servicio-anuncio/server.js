require("dotenv").config();
const express = require("express");
const cors = require("cors");
const anuncioRoutes = require("./routes/anuncio.routes");
const connectDB = require("./config/database");

// Conectar a la base de datos
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/anuncios", anuncioRoutes);

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`✅ Servidor de Anuncios corriendo en http://localhost:${PORT}`);
});
