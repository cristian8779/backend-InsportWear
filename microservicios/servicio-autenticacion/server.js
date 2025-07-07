const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const autenticacionRuta = require('./routes/authRoutes');
const authGoogleRoutes = require("./routes/authGoogleRoutes"); // Ya lo tienes aquí


dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use('/api/auth', autenticacionRuta);
app.use('/api/auth/google', authGoogleRoutes); // Usa la variable
app.use("/api/auth/credencial", require("./routes/credencialRoutes"));



const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Microservicio de autenticación corriendo en http://localhost:${PORT}`);
});
