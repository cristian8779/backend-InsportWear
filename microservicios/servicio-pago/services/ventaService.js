const axios = require("axios");
const VENTA_SERVICE_URL = process.env.VENTA_SERVICE_URL;
const API_KEY = process.env.MICROSERVICIO_API_KEY; // 🔑 por defecto usa el .env

// =======================
// Crear Venta
// =======================
exports.crearVenta = async ({
  usuarioId,
  productos,
  total,
  estadoPago = "approved",
  referenciaPago,
  tokenUsuario = null, // ✅ token JWT opcional
  nombreUsuario = null,
  telefonoUsuario = null,
  direccionUsuario = null,
  desdePago = false,
}) => {
  if (!VENTA_SERVICE_URL) {
    throw new Error("VENTA_SERVICE_URL no está configurada.");
  }

  if (!API_KEY) {
    throw new Error("❌ No se encontró MICROSERVICIO_API_KEY en .env");
  }

  try {
    // URL fija solo para ventas desde microservicio de pagos
    const url = `${VENTA_SERVICE_URL}/api/ventas/crear`;
    console.log("🟢 URL de venta:", url);

    // Headers con API Key
    const headers = {
      "x-api-key": API_KEY,
    };

    // JWT opcional
    if (tokenUsuario) {
      headers["Authorization"] = `Bearer ${tokenUsuario}`;
      console.log("🟢 Token JWT enviado: ***");
    } else {
      console.log("⚠️ No se envió token JWT");
    }

    // Validación de productos
    if (!Array.isArray(productos) || productos.length === 0) {
      throw new Error("La venta debe contener al menos un producto.");
    }

    // Logs detallados de los productos
    console.log("🟢 Productos enviados en la venta:");
    productos.forEach((p, i) => {
      console.log(
        `  [${i}] productoId: ${p.productoId}, variacionId: ${
          p.variacionId || "N/A"
        }, nombre: ${p.nombreProducto || "N/A"}, talla: ${
          p.talla || "N/A"
        }, color: ${p.color ? p.color.nombre : "N/A"}, cantidad: ${
          p.cantidad
        }, precioUnitario: ${p.precioUnitario || 0}`
      );
    });

    // Datos de la venta
    const dataVenta = {
      usuarioId,
      productos,
      total,
      estadoPago,
      referenciaPago,
      nombreUsuario,
      telefonoUsuario,
      direccionUsuario,
      desdePago,
    };

    console.log("🟢 Datos de la venta:", JSON.stringify(dataVenta, null, 2));

    // Llamada al microservicio
    const res = await axios.post(url, dataVenta, { headers });

    console.log("✅ Venta creada con éxito:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Error al crear venta desde microservicio de pagos:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    throw new Error(
      `Error al crear venta desde microservicio de pagos: ${
        error.response?.data?.mensaje ||
        error.response?.data?.error ||
        error.message
      }`
    );
  }
};

// =======================
// Buscar Venta por Referencia
// =======================
exports.buscarPorReferencia = async (referenciaPago, usuarioId) => {
  if (!VENTA_SERVICE_URL) {
    throw new Error("VENTA_SERVICE_URL no está configurada.");
  }

  if (!API_KEY) {
    throw new Error("❌ No se encontró MICROSERVICIO_API_KEY en .env");
  }

  try {
    const url = `${VENTA_SERVICE_URL}/api/ventas/referencia/${referenciaPago}?usuarioId=${usuarioId}`;
    console.log("🔎 Buscando venta por referencia:", url);

    const headers = {
      "x-api-key": API_KEY,
    };

    const res = await axios.get(url, { headers });

    console.log("✅ Venta encontrada por referencia:", res.data);
    return res.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log("⚠️ No se encontró venta con esa referencia.");
      return null;
    }

    console.error("❌ Error al buscar venta por referencia:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    throw new Error(
      `Error al buscar venta por referencia: ${
        error.response?.data?.mensaje ||
        error.response?.data?.error ||
        error.message
      }`
    );
  }
};
