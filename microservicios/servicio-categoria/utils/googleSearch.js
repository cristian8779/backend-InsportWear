const axios = require('axios');

const buscarImagenesGoogle = async (query, cantidad = 10) => {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const CX = process.env.GOOGLE_CX;

  if (!API_KEY || !CX) throw new Error('❌ Faltan GOOGLE_API_KEY o GOOGLE_CX en el .env');

  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&searchType=image&cx=${CX}&key=${API_KEY}&num=${cantidad}`;

  const response = await axios.get(url);

  const imagenes = response.data.items?.map((item) => ({
    url: item.link,
    titulo: item.title,
    origen: item.image.contextLink,
  })) || [];

  return imagenes;
};

module.exports = { buscarImagenesGoogle };
