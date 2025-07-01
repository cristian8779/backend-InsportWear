const Venta = require("../models/Venta");
const Producto = require("../models/Producto");
const ExcelJS = require("exceljs");
const { DateTime } = require("luxon");  // <-- Import Luxon

// Utils: construcción de filtros reutilizable
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

// Crear una nueva venta
exports.crearVenta = async (req, res) => {
  try {
    const { productos, total } = req.body;
    const usuarioId = req.usuario.id;

    const actualizacionesStock = productos.map(async (item) => {
      const producto = await Producto.findById(item.productoId);
      if (!producto) throw new Error(`Producto con ID ${item.productoId} no encontrado`);

      const variacion = producto.variaciones.find(
        v => v.talla === item.talla && v.color === item.color
      );

      if (!variacion || variacion.stock < item.cantidad) {
        throw new Error("Uno de los productos no tiene suficiente stock.");
      }

      variacion.stock -= item.cantidad;
      return producto.save();
    });

    await Promise.all(actualizacionesStock);

    const nuevaVenta = new Venta({ usuarioId, productos, total });
    await nuevaVenta.save();

    res.status(201).json(nuevaVenta);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al procesar la venta.", error: error.message });
  }
};

// Obtener ventas del usuario autenticado
exports.obtenerVentasUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const ventas = await Venta.find({ usuarioId })
      .populate("productos.productoId", "nombre");

    if (!ventas.length) {
      return res.status(404).json({ mensaje: "Aún no has realizado ninguna venta." });
    }

    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener tus ventas.", error: error.message });
  }
};

// Obtener todas las ventas (admin) con filtros
exports.obtenerTodasLasVentas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, usuario, usuarioId, producto, estado } = req.query;
    const filtro = construirFiltroVentas({ fechaInicio, fechaFin, estado });

    let ventas = await Venta.find(filtro)
      .populate("usuarioId", "nombre email")
      .populate("productos.productoId", "nombre");

    if (usuario) {
      ventas = ventas.filter(v =>
        v.usuarioId?.nombre?.toLowerCase().includes(usuario.toLowerCase())
      );
    }

    if (usuarioId) {
      ventas = ventas.filter(v => v.usuarioId?._id?.toString() === usuarioId);
    }

    if (producto) {
      ventas = ventas.filter(v =>
        v.productos.some(p =>
          p.productoId?.nombre?.toLowerCase().includes(producto.toLowerCase())
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

// Actualizar estado de una venta
exports.actualizarEstadoVenta = async (req, res) => {
  try {
    const { estado } = req.body;
    const { id } = req.params;

    const venta = await Venta.findByIdAndUpdate(id, { estado }, { new: true });

    if (!venta) {
      return res.status(404).json({ mensaje: "La venta no fue encontrada." });
    }

    res.json(venta);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar el estado de la venta.", error: error.message });
  }
};

exports.exportarVentasExcel = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const query = {};

    if (mes) {
      const year = parseInt(anio) || DateTime.now().year;
      const month = parseInt(mes); // 1-12

      const fechaInicio = DateTime.local(year, month).startOf("month").toJSDate();
      const fechaFin = DateTime.local(year, month).endOf("month").toJSDate();
      query.fecha = { $gte: fechaInicio, $lte: fechaFin };
    }

    const ventas = await Venta.find(query)
      .sort({ fecha: -1 })
      .populate("usuarioId", "nombre")
      .populate("productos.productoId", "nombre imagen");

    if (!ventas.length) {
      return res.status(404).json({ mensaje: "No se encontraron ventas para ese período." });
    }

    const workbook = new ExcelJS.Workbook();
    const hojaResumen = workbook.addWorksheet("Resumen de Ventas");
    const hojaDetalle = workbook.addWorksheet("Detalle de Productos");

    hojaResumen.columns = [
      { header: "ID de Venta", key: "id", width: 36 },
      { header: "Cliente", key: "cliente", width: 25 },
      { header: "Total ($)", key: "total", width: 18 },
      { header: "Cantidad de Productos", key: "cantidadProductos", width: 22 },
      { header: "Fecha de Compra", key: "fecha", width: 28 },
      { header: "Estado", key: "estado", width: 16 },
    ];

    hojaDetalle.columns = [
      { header: "ID de Venta", key: "ventaId", width: 36 },
      { header: "Cliente", key: "cliente", width: 25 },
      { header: "Producto", key: "producto", width: 30 },
      { header: "Talla", key: "talla", width: 12 },
      { header: "Color", key: "color", width: 12 },
      { header: "Cantidad", key: "cantidad", width: 14 },
      { header: "Precio Unitario ($)", key: "precioUnitario", width: 20 },
      { header: "Subtotal ($)", key: "subtotal", width: 20 },
    ];

    const headerStyle = {
      font: { bold: true, color: { argb: 'FF000000' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      }
    };

    hojaResumen.getRow(1).eachCell(cell => cell.style = headerStyle);
    hojaDetalle.getRow(1).eachCell(cell => cell.style = headerStyle);

    const estadoColorMap = {
      Pendiente: 'FFFDFD96',
      Enviado: 'FFADD8E6',
      Entregado: 'FF90EE90',
      Cancelado: 'FFFF7F7F'
    };

    // FILAS DE RESUMEN
    ventas.forEach(v => {
      const cantidadTotal = v.productos.reduce((sum, p) => sum + p.cantidad, 0);
      const row = hojaResumen.addRow({
        id: v._id.toString(),
        cliente: v.usuarioId?.nombre || "Usuario eliminado",
        total: v.total,
        cantidadProductos: cantidadTotal,
        fecha: DateTime.fromJSDate(v.fecha)
          .setZone("America/Bogota")
          .setLocale("es")
          .toFormat("cccc, dd 'de' LLLL 'de' yyyy, hh:mm a"),
        estado: v.estado || "Pendiente"
      });

      const estadoCell = row.getCell("estado");
      estadoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: estadoColorMap[v.estado] || 'FFDDDDDD' }
      };
    });

    // FILAS DE DETALLE
    ventas.forEach(v => {
      v.productos.forEach(p => {
        hojaDetalle.addRow({
          ventaId: v._id.toString(),
          cliente: v.usuarioId?.nombre || "Usuario eliminado",
          producto: p.productoId?.nombre || "Producto eliminado",
          talla: p.talla,
          color: p.color,
          cantidad: p.cantidad,
          precioUnitario: p.precioUnitario,
          subtotal: p.precioUnitario * p.cantidad,
        });
      });
    });

    const currencyFormat = '"$"#,##0.00;[Red]\\-"$"#,##0.00';
    hojaResumen.getColumn("total").numFmt = currencyFormat;
    hojaDetalle.getColumn("precioUnitario").numFmt = hojaDetalle.getColumn("subtotal").numFmt = currencyFormat;

    [hojaResumen, hojaDetalle].forEach(sheet => {
      sheet.eachRow((row, i) => {
        row.height = 22;
        row.eachCell(cell => {
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=ventas.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error al exportar Excel:", error);
    res.status(500).json({ mensaje: "Error al generar el archivo Excel", error: error.message });
  }
};
