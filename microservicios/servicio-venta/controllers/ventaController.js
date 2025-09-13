const Venta = require("../models/Venta");
const { verificarYReducirStock, obtenerProductoPorId } = require("../utils/servicioProducto");
const generarExcelVentas = require("../utils/exportarVentasExcel");
const expandirVentas = require("../utils/expandirVentas");
const { DateTime } = require("luxon");

// 🔍 Filtros para consultas
const construirFiltroVentas = ({ fechaInicio, fechaFin, estado }) => {
  const filtro = {};
  if (fechaInicio || fechaFin) {
    filtro.fecha = {};
    if (fechaInicio) filtro.fecha.$gte = DateTime.fromISO(fechaInicio).startOf("day").toJSDate();
    if (fechaFin) filtro.fecha.$lte = DateTime.fromISO(fechaFin).endOf("day").toJSDate();
  }
  if (estado) filtro.estado = estado;
  return filtro;
};

// 📦 Crear venta desde el frontend (usuario autenticado)
exports.crearVenta = async (req, res) => {
  try {
    const { productos, total } = req.body;
    const usuarioId = req.usuario.id;

    // 🔹 Solo para ventas manuales de admin reducimos stock
    const operacionesStock = productos.map((item) =>
      verificarYReducirStock({
        productoId: item.productoId,
        cantidad: item.cantidad,
        talla: item.talla,
        color: item.color,
        adminManual: true
      })
    );
    await Promise.all(operacionesStock);

    const productosLimpios = await Promise.all(
      productos.map(async (p) => {
        const productoId =
          typeof p.productoId === "object" && p.productoId !== null
            ? p.productoId._id?.toString() || p.productoId.toString()
            : p.productoId;

        if (!productoId) throw new Error("ProductoId inválido en el cuerpo de la venta.");

        let nombreProducto = "Producto eliminado";
        try {
          const producto = await obtenerProductoPorId(productoId);
          nombreProducto = producto?.nombre?.trim() || nombreProducto;
        } catch (err) {
          console.warn(`⚠️ Producto no encontrado (${productoId}): ${err.message}`);
        }

        return {
          productoId,
          nombreProducto,
          talla: p.talla || null,
          color: p.color || null,
          cantidad: p.cantidad || 0,
          precioUnitario: p.precioUnitario || 0,
        };
      })
    );

    const nuevaVenta = new Venta({
      usuarioId,
      productos: productosLimpios,
      total,
    });

    await nuevaVenta.save();
    res.status(201).json(nuevaVenta);
  } catch (error) {
    console.error("❌ Error en crearVenta:", error);
    res.status(500).json({ mensaje: "Error al procesar la venta.", error: error.message });
  }
};

// 📦 Crear venta desde microservicio de pagos (API Key)
exports.crearVentaDesdePago = async (req, res) => {
  try {
    const { usuarioId, productos, total, estadoPago, referenciaPago } = req.body;

    if (!usuarioId || !productos?.length || !total || !referenciaPago) {
      return res.status(400).json({ mensaje: "Faltan datos requeridos para registrar la venta." });
    }

    // 🔹 No reducimos stock para ventas desde pago

    const productosLimpios = await Promise.all(
      productos.map(async (p) => {
        const productoId =
          typeof p.productoId === "object"
            ? p.productoId._id?.toString() || p.productoId.toString()
            : p.productoId;

        if (!productoId) throw new Error("ProductoId inválido en venta.");

        let nombreProducto = "Producto eliminado";
        let talla = null;
        let color = null;
        let precioUnitario = 0;

        try {
          const producto = await obtenerProductoPorId(productoId);
          nombreProducto = producto?.nombre?.trim() || nombreProducto;

          // 🔹 Si hay variaciónId, obtener talla, color y precio desde la variación
          if (p.variacionId && producto.variaciones?.length) {
            const variacion = producto.variaciones.find(v => v._id === p.variacionId);
            if (variacion) {
              talla = variacion.tallaLetra || variacion.tallaNumero || null;
              color = variacion.color || null;
              precioUnitario = variacion.precio || producto.precio || 0;
            }
          } else {
            // Si no hay variación, usamos los datos que venga o del producto
            talla = p.talla || null;
            color = p.color || null;
            precioUnitario = p.precioUnitario || producto.precio || 0;
          }

        } catch (err) {
          console.warn(`⚠️ Producto no encontrado (${productoId}): ${err.message}`);
        }

        return {
          productoId,
          variacionId: p.variacionId || null,
          nombreProducto,
          talla,
          color,
          cantidad: p.cantidad || 0,
          precioUnitario, // <-- ahora correcto
        };
      })
    );

    const nuevaVenta = new Venta({
      usuarioId,
      productos: productosLimpios,
      total,
      estadoPago: estadoPago?.toLowerCase() || "pendiente",
      referenciaPago
    });

    await nuevaVenta.save();

    res.status(201).json({
      mensaje: "✅ Venta creada exitosamente desde microservicio de pagos.",
      venta: nuevaVenta
    });
  } catch (error) {
    console.error("❌ Error en crearVentaDesdePago:", error);
    res.status(500).json({
      mensaje: "Error al registrar la venta desde el microservicio de pagos.",
      error: error.message
    });
  }
};


// 👤 Ventas del usuario autenticado
exports.obtenerVentasUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    let ventas = await Venta.find({ usuarioId }).sort({ fecha: -1 });

    if (!ventas.length) {
      return res.status(404).json({ mensaje: "Aún no has realizado ninguna venta." });
    }

    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener tus ventas.", error: error.message });
  }
};

// 📊 Todas las ventas con filtros (Admin)
exports.obtenerTodasLasVentas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, usuarioId, producto, estado } = req.query;
    const filtro = construirFiltroVentas({ fechaInicio, fechaFin, estado });

    let ventas = await Venta.find(filtro).sort({ fecha: -1 });

    if (usuarioId) {
      ventas = ventas.filter((v) => v.usuarioId?.toString() === usuarioId);
    }

    if (producto) {
      ventas = ventas.filter((v) =>
        v.productos.some((p) =>
          p.nombreProducto?.toLowerCase().includes(producto.toLowerCase())
        )
      );
    }

    if (!ventas.length) {
      return res.status(404).json({ mensaje: "No hay ventas con los filtros seleccionados." });
    }

    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al consultar las ventas.", error: error.message });
  }
};

// 🔄 Cambiar estado de una venta (Admin)
exports.actualizarEstadoVenta = async (req, res) => {
  try {
    const { estadoPago } = req.body;
    const { id } = req.params;

    const venta = await Venta.findByIdAndUpdate(id, { estadoPago }, { new: true });

    if (!venta) {
      return res.status(404).json({ mensaje: "La venta no fue encontrada." });
    }

    res.json(venta);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar el estado de la venta.",
      error: error.message,
    });
  }
};

// 🧾 Exportar ventas a Excel
exports.exportarVentasExcel = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const query = {};

    if (mes) {
      const year = parseInt(anio) || DateTime.now().year;
      const month = parseInt(mes);
      const fechaInicio = DateTime.local(year, month).startOf("month").toJSDate();
      const fechaFin = DateTime.local(year, month).endOf("month").toJSDate();
      query.fecha = { $gte: fechaInicio, $lte: fechaFin };
    }

    let ventas = await Venta.find(query).sort({ fecha: -1 });

    if (!ventas.length) {
      return res.status(404).json({ mensaje: "No se encontraron ventas para ese período." });
    }

    // Expande usuarios y productos antes de exportar
    ventas = await expandirVentas(ventas);

    const workbook = await generarExcelVentas(ventas);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=ventas.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al exportar Excel:", error);
    res.status(500).json({ mensaje: "Error al generar el archivo Excel", error: error.message });
  }
};

// 🗑️ Eliminar venta (Admin)
exports.eliminarVenta = async (req, res) => {
  try {
    const { id } = req.params;

    const ventaEliminada = await Venta.findByIdAndDelete(id);

    if (!ventaEliminada) {
      return res.status(404).json({ mensaje: "Venta no encontrada." });
    }

    res.json({ mensaje: "Venta eliminada correctamente.", venta: ventaEliminada });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al eliminar la venta.",
      error: error.message,
    });
  }
};
