// utils/contadorBusquedas.js
const SearchQuota = require('../models/SearchQuota');

const registrarBusqueda = async () => {
  const hoy = new Date().toISOString().split('T')[0]; // '2025-07-11'

  let cuota = await SearchQuota.findOne({ fecha: hoy });

  if (!cuota) {
    cuota = await SearchQuota.create({ fecha: hoy, usadas: 1 }); // ← "reinicio" automático
  } else {
    cuota.usadas++;
    await cuota.save();
  }

  const restantes = 100 - cuota.usadas;
  return Math.max(restantes, 0); // nunca devolver negativo
};

module.exports = { registrarBusqueda };
