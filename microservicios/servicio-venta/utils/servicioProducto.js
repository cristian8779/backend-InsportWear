const axios = require("axios");

const BASE_URL_PRODUCTO = process.env.URL_MICROSERVICIO_PRODUCTO; // http://localhost:3003/api/productos
const BASE_URL_USUARIO = process.env.URL_MICROSERVICIO_USUARIO;    // http://localhost:3002/api/usuario

if (!BASE_URL_PRODUCTO || !BASE_URL_USUARIO) {
  console.error("❌ Variables de entorno no configuradas correctamente:");
  console.error("🔑 URL_MICROSERVICIO_PRODUCTO:", BASE_URL_PRODUCTO);
  console.error("🔑 URL_MICROSERVICIO_USUARIO:", BASE_URL_USUARIO);
  throw new Error("❌ Configuración de microservicios inválida.");
}

// 🔍 Obtener producto por ID (producto padre)
exports.obtenerProductoPorId = async (productoId) => {
  console.log("📦 Obtener producto por ID:", productoId);
  try {
    const { data } = await axios.get(`${BASE_URL_PRODUCTO}/${productoId}`);

    if (!data.producto) throw new Error("Producto no encontrado");

    const producto = data.producto;

    // Mapear variaciones incluyendo imagen
    const variaciones = (producto.variaciones || []).map(v => ({
      _id: v._id,
      tallaLetra: v.tallaLetra,
      tallaNumero: v.tallaNumero,
      color: v.color || null,
      precio: v.precio,
      stock: v.stock,
      imagen: v.imagen || null
    }));

    return {
      _id: producto._id,
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      imagen: producto.imagen || null,
      imagenes: producto.imagenes || [],
      variaciones
    };

  } catch (error) {
    console.error("❌ Error al obtener el producto por ID:", productoId, error.message);
    throw new Error(`Error al obtener el producto: ${error.response?.data?.mensaje || error.message}`);
  }
};

/**
 * ✅ Verifica y descuenta stock
 * @param {Object} params
 * @param {String} params.productoId
 * @param {String|null} params.variacionId
 * @param {Number} params.cantidad
 * @param {String|null} params.talla
 * @param {Object|null} params.color { hex, nombre }
 * @param {Boolean} params.adminManual
 * @param {Boolean} params.desdePago
 */
exports.verificarYReducirStock = async ({
  productoId,
  variacionId = null,
  cantidad,
  talla = null,
  color = null,
  adminManual = false,
  desdePago = false
}) => {
  console.log("🔹 verificarYReducirStock llamado:", { productoId, variacionId, cantidad, talla, color, adminManual, desdePago });

  if (!productoId || cantidad == null || cantidad <= 0) {
    throw new Error("❌ ProductoId o cantidad inválida para reducir stock.");
  }

  // 1️⃣ Obtener producto padre
  const producto = await exports.obtenerProductoPorId(productoId);
  if (!producto) throw new Error(`Producto con ID ${productoId} no encontrado`);
  console.log("🟢 Producto encontrado:", producto._id);

  // ⚠️ Reducir stock solo si es admin/manual o desde pago
  if (!adminManual && !desdePago) {
    console.log("⚠️ No se reducirá stock: no es admin/manual ni desde pago.");
    return;
  }

  // 2️⃣ Manejo de variaciones
  if (producto.variaciones?.length) {
    let variacion;

    if (variacionId) {
      variacion = producto.variaciones.find(v => v._id === variacionId);
    } else {
      variacion = producto.variaciones.find(v => {
        const mismoTalla = v.tallaLetra === talla || v.tallaNumero === talla;
        const mismoColor = v.color && color
          ? v.color.hex === color.hex && v.color.nombre === color.nombre
          : !v.color && !color;
        return mismoTalla && mismoColor;
      });
    }

    if (!variacion) throw new Error("Variación no encontrada para la talla/color indicados.");
    console.log("🟢 Variación encontrada:", variacion._id, "Stock actual:", variacion.stock);

    if (variacion.stock < cantidad) throw new Error("No hay suficiente stock en la variación solicitada.");

    // Reducir stock de la variación
    console.log("🔄 Reduciendo stock de la variación:", variacion._id, "Cantidad:", cantidad);
    await axios.put(
      `${BASE_URL_PRODUCTO}/${producto._id}/variaciones/${variacion._id}/reducir-stock`,
      { cantidad }
    );
    console.log("✅ Stock de variación actualizado.");
  } else {
    // 🔹 Producto sin variaciones
    console.log("🟢 Producto sin variaciones. Stock actual:", producto.stock);
    if (producto.stock < cantidad) throw new Error("Stock insuficiente en el producto.");
    console.log("🔄 Reduciendo stock del producto:", producto._id, "Cantidad:", cantidad);
    await axios.put(`${BASE_URL_PRODUCTO}/${producto._id}/reducir-stock`, { cantidad });
    console.log("✅ Stock del producto actualizado.");
  }
};

// 👤 Obtener usuario desde microservicio de usuarios
exports.obtenerUsuarioPorId = async (usuarioId) => {
  console.log("📌 Obtener usuario ID:", usuarioId);
  try {
    const { data } = await axios.get(`${BASE_URL_USUARIO}/${usuarioId}`);
    console.log("✅ Usuario obtenido:", data.usuario ? data.usuario._id : null);
    return data.usuario;
  } catch (error) {
    console.error("❌ Error al obtener el usuario:", usuarioId, error.message);
    throw new Error(`Error al obtener el usuario: ${error.response?.data?.mensaje || error.message}`);
  }
};
