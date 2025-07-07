// utils/formatFecha.js

module.exports = function formatearFecha(fecha) {
  const fechaISO = fecha.toISOString().split('T')[0];
  const hoyISO = new Date().toISOString().split('T')[0];
  const ayerISO = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (fechaISO === hoyISO) return 'Hoy';
  if (fechaISO === ayerISO) return 'Ayer';

  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
