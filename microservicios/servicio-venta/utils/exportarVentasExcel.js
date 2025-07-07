const ExcelJS = require("exceljs");
const { DateTime } = require("luxon");

const generarExcelVentas = async (ventas) => {
  const workbook = new ExcelJS.Workbook();
  const hojaResumen = workbook.addWorksheet("Resumen de Ventas");
  const hojaDetalle = workbook.addWorksheet("Detalle de Productos");

  // Columnas de resumen
  hojaResumen.columns = [
    { header: "ID de Venta", key: "id", width: 36 },
    { header: "Cliente", key: "cliente", width: 25 },
    { header: "Total ($)", key: "total", width: 18 },
    { header: "Cantidad de Productos", key: "cantidadProductos", width: 22 },
    { header: "Fecha de Compra", key: "fecha", width: 28 },
    { header: "Estado de Pago", key: "estadoPago", width: 20 },
  ];

  // Columnas de detalle
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
    font: { bold: true, color: { argb: "FF000000" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDDDDD" } },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  };

  // Estilo para encabezados
  hojaResumen.getRow(1).eachCell(cell => (cell.style = headerStyle));
  hojaDetalle.getRow(1).eachCell(cell => (cell.style = headerStyle));

  const estadoPagoColorMap = {
    approved: "FF90EE90",
    pending: "FFFDFD96",
    failed: "FFFF7F7F",
  };

  // === HOJA RESUMEN ===
  for (const v of ventas) {
    const cantidadTotal = Array.isArray(v.productos)
      ? v.productos.reduce((sum, p) => sum + (p.cantidad || 0), 0)
      : 0;

    const fechaObj = v.fecha instanceof Date ? DateTime.fromJSDate(v.fecha) : null;
    const fechaFormateada = fechaObj
      ? fechaObj.setZone("America/Bogota").setLocale("es").toFormat("cccc, dd 'de' LLLL 'de' yyyy, hh:mm a")
      : "Fecha inválida";

    const row = hojaResumen.addRow({
      id: v._id?.toString() || "N/A",
      cliente: v.nombreUsuario || "Usuario eliminado",
      total: v.total || 0,
      cantidadProductos: cantidadTotal,
      fecha: fechaFormateada,
      estadoPago: v.estadoPago || "pending",
    });

    row.getCell("estadoPago").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: estadoPagoColorMap[v.estadoPago] || "FFDDDDDD" },
    };
  }

  // === HOJA DETALLE ===
  for (const v of ventas) {
    const cliente = v.nombreUsuario || "Usuario eliminado";

    if (!Array.isArray(v.productos)) continue;

    for (const p of v.productos) {
      // Debug fuerte si el nombre no vino
      if (!p.nombreProducto || typeof p.nombreProducto !== "string" || !p.nombreProducto.trim()) {
        console.warn(`⚠️ Producto sin nombre en venta ${v._id}, productoId: ${JSON.stringify(p.productoId)}`);
      }

      hojaDetalle.addRow({
        ventaId: v._id?.toString() || "N/A",
        cliente,
        producto: p.nombreProducto?.trim() || "Producto eliminado",
        talla: p.talla || "-",
        color: p.color || "-",
        cantidad: p.cantidad || 0,
        precioUnitario: p.precioUnitario || 0,
        subtotal: (p.precioUnitario || 0) * (p.cantidad || 0),
      });
    }
  }

  // Formato de moneda
  const currencyFormat = '"$"#,##0.00;[Red]\\-"$"#,##0.00';
  hojaResumen.getColumn("total").numFmt = currencyFormat;
  hojaDetalle.getColumn("precioUnitario").numFmt = currencyFormat;
  hojaDetalle.getColumn("subtotal").numFmt = currencyFormat;

  // Estilo global
  [hojaResumen, hojaDetalle].forEach(sheet => {
    sheet.eachRow(row => {
      row.height = 22;
      row.eachCell(cell => {
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });
  });

  return workbook;
};

module.exports = generarExcelVentas;
