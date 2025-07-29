// config/redis.js
const fetch = require('node-fetch');

const urlBase = process.env.REDIS_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redisClient = {
  async get(key) {
    const res = await fetch(`${urlBase}/get/${key}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },
  async set(key, value, options = {}) {
    // Upstash permite pasar opciones como { EX: segundos }
    let url = `${urlBase}/set/${key}/${value}`;
    if (options.EX) url += `?EX=${options.EX}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },
  async del(key) {
    const res = await fetch(`${urlBase}/del/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  }
};

console.log('✅ Redis REST API listo para usar');
module.exports = redisClient;
