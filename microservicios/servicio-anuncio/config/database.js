const mongoose = require('mongoose');

// Oculta el warning de strictQuery de Mongoose
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('❌ ERROR: No se encontró MONGO_URI en el archivo .env');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI, {
      // Puedes agregar opciones aquí si lo necesitas
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// Eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Error de Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose desconectado de MongoDB');
});

// Manejo de señales de terminación
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔄 Conexión a MongoDB cerrada por terminación de la aplicación');
  process.exit(0);
});

module.exports = connectDB;
