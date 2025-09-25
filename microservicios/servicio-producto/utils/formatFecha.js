// utils/formatFecha.js - Corregido para zona horaria de Colombia

module.exports = function formatearFecha(fecha) {
  // 🇨🇴 Convertir tanto la fecha recibida como "hoy" y "ayer" a zona horaria de Colombia
  const fechaColombia = new Date(fecha.toLocaleString("en-US", {timeZone: "America/Bogota"}));
  const hoy = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Bogota"}));
  
  // Crear fechas para "ayer" en zona horaria de Colombia
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  
  // Convertir a formato ISO solo la parte de fecha (YYYY-MM-DD)
  const fechaISO = fechaColombia.toISOString().split('T')[0];
  const hoyISO = hoy.toISOString().split('T')[0];
  const ayerISO = ayer.toISOString().split('T')[0];
  
  if (fechaISO === hoyISO) return 'Hoy';
  if (fechaISO === ayerISO) return 'Ayer';
  
  // Para fechas más antiguas, formatear en español colombiano
  return fechaColombia.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Bogota'
  });
};