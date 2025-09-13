const axios = require("axios");
const VENTA_SERVICE_URL = process.env.VENTA_SERVICE_URL;

exports.crearVenta = async ({
  usuarioId,
  productos,
  total,
  estadoPago,
  referenciaPago,
  desdePago = false,
  apiKey = process.env.MICROSERVICIO_API_KEY, // 🔑 por defecto usa el .env
  tokenUsuario = null, // ✅ token JWT opcional
}) => {
  if (!VENTA_SERVICE_URL) {
    throw new Error("VENTA_SERVICE_URL no está configurada.");
  }

  try {
    // URL según si es venta desde pago o normal
    const url = desdePago
      ? `${VENTA_SERVICE_URL}/api/ventas/crear`
      : `${VENTA_SERVICE_URL}/api/ventas`;

    console.log("🟢 URL de venta:", url);

    // Headers
    const headers = {};

    // API Key
    if (desdePago) {
      if (!apiKey) throw new Error("❌ No se encontró MICROSERVICIO_API_KEY en .env");
      headers["x-api-key"] = apiKey;
      console.log("🟢 API Key enviada: ***");
    }

    // JWT
    if (tokenUsuario) {
      headers["Authorization"] = `Bearer ${tokenUsuario}`;
      console.log("🟢 Token JWT enviado: ***");
    } else {
      console.log("⚠️ No se envió token JWT");
    }

    // Logs detallados de los productos
    console.log("🟢 Productos enviados en la venta:");
    productos.forEach((p, i) => {
      console.log(
        `  [${i}] productoId: ${p.productoId}, variacionId: ${p.variacionId || "N/A"}, nombre: ${p.nombreProducto || "N/A"}, talla: ${p.talla || "N/A"}, color: ${p.color ? p.color.nombre : "N/A"}, cantidad: ${p.cantidad}, precioUnitario: ${p.precioUnitario || 0}`
      );
    });

    // Datos de la venta
    const dataVenta = { usuarioId, productos, total, estadoPago, referenciaPago };
    console.log("🟢 Datos de la venta:", JSON.stringify(dataVenta, null, 2));

    // Llamada al microservicio
    const res = await axios.post(url, dataVenta, { headers });

    console.log("✅ Venta creada con éxito:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Error al crear venta:", {
      url: desdePago ? "microservicio" : "frontend",
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    throw new Error(
      `Error al crear venta: ${
        error.response?.data?.mensaje ||
        error.response?.data?.error ||
        error.message
      }`
    );
  }
};
