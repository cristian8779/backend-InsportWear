const ExcelJS = require("exceljs");
const { DateTime } = require("luxon");

const generarExcelVentas = async (ventas) => {
  const workbook = new ExcelJS.Workbook();
  
  // Metadatos del workbook
  workbook.creator = "Insportswear - Sistema de Ventas";
  workbook.company = "Insportswear";
  workbook.created = new Date();
  workbook.modified = new Date();
  
  const hojaResumen = workbook.addWorksheet("📊 Resumen de Ventas");
  const hojaDetalle = workbook.addWorksheet("📋 Detalle de Productos");
  
  // === PALETA DE COLORES BLANCO PASTEL PURO ===
  const colores = {
    primario: "FFF0F0F0",        // Gris muy claro
    secundario: "FFF8F8F8",      // Gris súper claro
    acento: "FFE8E8E8",          // Gris claro para acentos
    exito: "FFE8F5E8",           // Verde pastel muy suave
    advertencia: "FFFFF8E1",     // Amarillo crema muy suave
    error: "FFFFEEE6",           // Rosa crema muy suave
    neutro: "FFFFFFFF",          // Blanco puro
    neutroMedio: "FFFAFAFA",     // Blanco con toque gris muy sutil
    neutroClaro: "FFFDFDFD",     // Blanco casi puro
    textoClaro: "FFFFFFFF",      // Blanco
    textoOscuro: "FF333333",     // Gris oscuro suave para texto
    textoPrimario: "FF666666",   // Gris medio para títulos
    bordes: "FFEEEEEE"           // Gris muy claro para bordes
  };

  // === ESTILOS REUTILIZABLES ===
  const estilos = {
    // Header principal
    tituloHeader: {
      font: { 
        bold: true, 
        size: 18, 
        color: { argb: colores.textoPrimario },
        name: "Segoe UI"
      },
      fill: { 
        type: "pattern",
        pattern: "solid", 
        fgColor: { argb: colores.neutroClaro }
      },
      alignment: { 
        horizontal: "center", 
        vertical: "middle", 
        wrapText: true 
      },
      border: {
        top: { style: "thin", color: { argb: colores.bordes } },
        bottom: { style: "thin", color: { argb: colores.bordes } },
        left: { style: "thin", color: { argb: colores.bordes } },
        right: { style: "thin", color: { argb: colores.bordes } }
      }
    },
    
    // Subtítulo
    subtitulo: {
      font: { 
        bold: true, 
        size: 12, 
        color: { argb: colores.textoOscuro },
        name: "Segoe UI"
      },
      fill: { 
        type: "pattern", 
        pattern: "solid", 
        fgColor: { argb: colores.neutroMedio } 
      },
      alignment: { 
        horizontal: "center", 
        vertical: "middle", 
        wrapText: true 
      },
      border: {
        top: { style: "thin", color: { argb: colores.bordes } },
        bottom: { style: "thin", color: { argb: colores.bordes } },
        left: { style: "thin", color: { argb: colores.bordes } },
        right: { style: "thin", color: { argb: colores.bordes } }
      }
    },
    
    // Encabezados de columnas
    encabezado: {
      font: { 
        bold: true, 
        size: 10, 
        color: { argb: colores.textoOscuro },
        name: "Segoe UI"
      },
      fill: { 
        type: "pattern", 
        pattern: "solid", 
        fgColor: { argb: colores.secundario } 
      },
      alignment: { 
        horizontal: "center", 
        vertical: "middle", 
        wrapText: true 
      },
      border: {
        top: { style: "thin", color: { argb: colores.bordes } },
        bottom: { style: "thin", color: { argb: colores.bordes } },
        left: { style: "thin", color: { argb: colores.bordes } },
        right: { style: "thin", color: { argb: colores.bordes } }
      }
    },
    
    // Celdas normales
    celda: {
      font: { 
        size: 10, 
        color: { argb: colores.textoOscuro },
        name: "Segoe UI"
      },
      alignment: { 
        vertical: "middle", 
        wrapText: true,
        horizontal: "center"
      },
      border: {
        top: { style: "thin", color: { argb: colores.bordes } },
        bottom: { style: "thin", color: { argb: colores.bordes } },
        left: { style: "thin", color: { argb: colores.bordes } },
        right: { style: "thin", color: { argb: colores.bordes } }
      }
    },
    
    // Celdas de texto (nombres, etc)
    celdaTexto: {
      font: { 
        size: 10, 
        color: { argb: colores.textoOscuro },
        name: "Segoe UI"
      },
      alignment: { 
        vertical: "middle", 
        wrapText: true,
        horizontal: "left"
      },
      border: {
        top: { style: "thin", color: { argb: colores.bordes } },
        bottom: { style: "thin", color: { argb: colores.bordes } },
        left: { style: "thin", color: { argb: colores.bordes } },
        right: { style: "thin", color: { argb: colores.bordes } }
      }
    },
    
    // Números/moneda
    moneda: {
      font: { 
        size: 10, 
        color: { argb: colores.textoOscuro },
        name: "Segoe UI",
        bold: true
      },
      alignment: { 
        horizontal: "right", 
        vertical: "middle" 
      },
      border: {
        top: { style: "thin", color: { argb: colores.bordes } },
        bottom: { style: "thin", color: { argb: colores.bordes } },
        left: { style: "thin", color: { argb: colores.bordes } },
        right: { style: "thin", color: { argb: colores.bordes } }
      }
    },
    
    // Números normales (para cantidad)
    numero: {
      font: { 
        size: 10, 
        color: { argb: colores.textoOscuro },
        name: "Segoe UI",
        bold: true
      },
      alignment: { 
        horizontal: "center", 
        vertical: "middle" 
      },
      border: {
        top: { style: "thin", color: { argb: colores.bordes } },
        bottom: { style: "thin", color: { argb: colores.bordes } },
        left: { style: "thin", color: { argb: colores.bordes } },
        right: { style: "thin", color: { argb: colores.bordes } }
      }
    }
  };

  // === CONFIGURACIÓN HOJA RESUMEN ===
  hojaResumen.columns = [
    { header: "ID de Venta", key: "id", width: 25 },
    { header: "Cliente", key: "cliente", width: 30 },
    { header: "Total", key: "total", width: 16 },
    { header: "Productos", key: "cantidadProductos", width: 12 },
    { header: "Fecha de Compra", key: "fecha", width: 35 },
    { header: "Estado", key: "estadoPago", width: 16 }
  ];

  // === CONFIGURACIÓN HOJA DETALLE ===
  hojaDetalle.columns = [
    { header: "ID Venta", key: "ventaId", width: 25 },
    { header: "Cliente", key: "cliente", width: 28 },
    { header: "Producto", key: "producto", width: 38 },
    { header: "Talla", key: "talla", width: 10 },
    { header: "Color", key: "color", width: 16 },
    { header: "Cant.", key: "cantidad", width: 8 },
    { header: "Precio Unit.", key: "precioUnitario", width: 16 },
    { header: "Subtotal", key: "subtotal", width: 16 }
  ];

  // === FUNCIÓN PARA CREAR HEADER CON TÍTULO ===
  const crearHeaderConTitulo = (hoja, subtitulo, columnas) => {
    // Fila 1: Título principal
    hoja.spliceRows(1, 0, [""]);
    hoja.mergeCells(1, 1, 1, columnas);
    const tituloCell = hoja.getCell(1, 1);
    tituloCell.value = "INSPORTSWEAR";
    tituloCell.style = estilos.tituloHeader;
    hoja.getRow(1).height = 40;
    
    // Fila 2: Subtítulo del reporte
    hoja.spliceRows(2, 0, [subtitulo]);
    hoja.mergeCells(2, 1, 2, columnas);
    const subtituloCell = hoja.getCell(2, 1);
    subtituloCell.value = subtitulo;
    subtituloCell.style = estilos.subtitulo;
    hoja.getRow(2).height = 25;
    
    // Fila 3: Espaciador
    hoja.spliceRows(3, 0, []);
    hoja.getRow(3).height = 8;
  };

  // === CREAR HEADERS ===
  const fechaActual = DateTime.now().setZone("America/Bogota").setLocale("es").toFormat("dd/MM/yyyy");
  const horaActual = DateTime.now().setZone("America/Bogota").setLocale("es").toFormat("HH:mm");
  
  crearHeaderConTitulo(hojaResumen, `📊 REPORTE DE VENTAS - ${fechaActual} ${horaActual}`, 6);
  crearHeaderConTitulo(hojaDetalle, `📋 DETALLE DE PRODUCTOS VENDIDOS - ${fechaActual} ${horaActual}`, 8);

  // === APLICAR ESTILOS A ENCABEZADOS ===
  hojaResumen.getRow(4).eachCell(cell => {
    cell.style = estilos.encabezado;
  });
  hojaResumen.getRow(4).height = 28;

  hojaDetalle.getRow(4).eachCell(cell => {
    cell.style = estilos.encabezado;
  });
  hojaDetalle.getRow(4).height = 28;

  // === MAPEOS MEJORADOS CON COLORES PASTEL SUAVES ===
  const estadoPagoConfig = {
    approved: {
      texto: "✅ Aprobado",
      color: colores.exito,
      textoColor: colores.textoOscuro
    },
    pending: {
      texto: "⏳ Pendiente",
      color: colores.advertencia,
      textoColor: colores.textoOscuro
    },
    failed: {
      texto: "❌ Fallido",
      color: colores.error,
      textoColor: colores.textoOscuro
    }
  };

  // === LLENAR HOJA RESUMEN ===
  let totalVentas = 0;
  let totalProductos = 0;
  let filaIndex = 5; // Empezar después del header
  
  for (const v of ventas) {
    const cantidadTotal = Array.isArray(v.productos)
      ? v.productos.reduce((sum, p) => sum + (p.cantidad || 0), 0)
      : 0;

    const fechaObj = v.fecha instanceof Date ? DateTime.fromJSDate(v.fecha) : null;
    const fechaFormateada = fechaObj
      ? fechaObj.setZone("America/Bogota").setLocale("es").toFormat("cccc, dd 'de' LLLL 'de' yyyy, hh:mm a")
      : "Fecha inválida";

    const estadoConfig = estadoPagoConfig[v.estadoPago] || estadoPagoConfig.pending;
    
    const row = hojaResumen.addRow({
      id: v._id?.toString() || "N/A",
      cliente: v.nombreUsuario || "Usuario eliminado",
      total: v.total || 0,
      cantidadProductos: cantidadTotal,
      fecha: fechaFormateada,
      estadoPago: estadoConfig.texto
    });

    // Aplicar estilos a cada celda con colores alternos suaves
    const isEvenRow = filaIndex % 2 === 0;
    const fillColor = isEvenRow ? colores.neutroClaro : colores.neutro;
    
    row.eachCell((cell, colNumber) => {
      const baseStyle = {
        ...estilos.celda,
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } }
      };
      
      if (colNumber === 1) { // ID - texto alineado a la izquierda
        cell.style = { ...baseStyle, alignment: { horizontal: "left", vertical: "middle", wrapText: true } };
      } else if (colNumber === 2) { // Cliente - texto alineado a la izquierda
        cell.style = { ...estilos.celdaTexto, fill: { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } } };
      } else if (colNumber === 3) { // Total - moneda
        cell.style = { ...estilos.moneda, fill: { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } } };
      } else if (colNumber === 4) { // Cantidad - número sin signo
        cell.style = { ...estilos.numero, fill: { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } } };
      } else if (colNumber === 5) { // Fecha - texto
        cell.style = { ...estilos.celdaTexto, fill: { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } } };
      } else if (colNumber === 6) { // Estado
        cell.style = {
          ...estilos.celda,
          font: { 
            ...estilos.celda.font, 
            bold: true, 
            color: { argb: estadoConfig.textoColor } 
          },
          fill: { 
            type: "pattern", 
            pattern: "solid", 
            fgColor: { argb: estadoConfig.color } 
          },
          alignment: { horizontal: "center", vertical: "middle" }
        };
      }
    });

    row.height = 26;
    filaIndex++;
    
    // Acumular totales
    totalVentas += v.total || 0;
    totalProductos += cantidadTotal;
  }

  // === FILA DE TOTALES EN RESUMEN ===
  const filaTotales = hojaResumen.addRow({
    id: "",
    cliente: "📊 TOTALES GENERALES:",
    total: totalVentas,
    cantidadProductos: totalProductos,
    fecha: `${ventas.length} ventas registradas`,
    estadoPago: ""
  });

  filaTotales.eachCell((cell, colNumber) => {
    cell.style = {
      ...estilos.encabezado,
      fill: { 
        type: "pattern", 
        pattern: "solid", 
        fgColor: { argb: colores.primario }
      },
      font: { 
        ...estilos.encabezado.font, 
        size: 11,
        color: { argb: colores.textoOscuro },
        bold: true
      }
    };
    if (colNumber === 3 || colNumber === 4) {
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 2 || colNumber === 5) {
      cell.alignment = { horizontal: "left", vertical: "middle" };
    }
  });
  filaTotales.height = 30;

  // === LLENAR HOJA DETALLE ===
  let detalleFilaIndex = 5;
  
  for (const v of ventas) {
    const cliente = v.nombreUsuario || "Usuario eliminado";

    if (!Array.isArray(v.productos)) continue;

    for (const p of v.productos) {
      if (!p.nombreProducto || typeof p.nombreProducto !== "string" || !p.nombreProducto.trim()) {
        console.warn(`⚠️ Producto sin nombre en venta ${v._id}, productoId: ${JSON.stringify(p.productoId)}`);
      }

      const row = hojaDetalle.addRow({
        ventaId: v._id?.toString() || "N/A",
        cliente,
        producto: p.nombreProducto?.trim() || "❓ Producto eliminado",
        talla: p.talla || "-",
        color: p.color?.nombre || "-",
        cantidad: p.cantidad || 0,
        precioUnitario: p.precioUnitario || 0,
        subtotal: (p.precioUnitario || 0) * (p.cantidad || 0)
      });

      // Aplicar estilos con filas alternas suaves
      const isEvenRow = detalleFilaIndex % 2 === 0;
      const fillColor = isEvenRow ? colores.neutroClaro : colores.neutro;

      row.eachCell((cell, colNumber) => {
        const baseStyle = {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } }
        };
        
        if (colNumber === 1) { // ID Venta
          cell.style = { ...estilos.celda, ...baseStyle, alignment: { horizontal: "left", vertical: "middle", wrapText: true } };
        } else if (colNumber === 2 || colNumber === 3) { // Cliente y Producto
          cell.style = { ...estilos.celdaTexto, ...baseStyle };
        } else if (colNumber === 4 || colNumber === 5) { // Talla y Color
          cell.style = { ...estilos.celda, ...baseStyle };
        } else if (colNumber === 6) { // Cantidad - SIN formato de moneda
          cell.style = { ...estilos.numero, ...baseStyle };
        } else if (colNumber === 7 || colNumber === 8) { // Precio y Subtotal
          cell.style = { ...estilos.moneda, ...baseStyle };
        }
      });

      row.height = 24;
      detalleFilaIndex++;
    }
  }

  // === FORMATO DE MONEDA Y NÚMEROS ===
  const formatoMoneda = '"$"#,##0;[Red]\\-"$"#,##0';
  const formatoNumero = '#,##0'; // Para cantidades sin signo de moneda
  
  hojaResumen.getColumn("total").numFmt = formatoMoneda;
  hojaResumen.getColumn("cantidadProductos").numFmt = formatoNumero;
  
  hojaDetalle.getColumn("cantidad").numFmt = formatoNumero; // Solo números
  hojaDetalle.getColumn("precioUnitario").numFmt = formatoMoneda;
  hojaDetalle.getColumn("subtotal").numFmt = formatoMoneda;

  // === FILTROS AUTOMÁTICOS ===
  hojaResumen.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: hojaResumen.rowCount - 1, column: 6 }
  };

  hojaDetalle.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: hojaDetalle.rowCount, column: 8 }
  };

  // === CONGELAR PANELES ===
  hojaResumen.views = [{ state: "frozen", xSplit: 0, ySplit: 4 }];
  hojaDetalle.views = [{ state: "frozen", xSplit: 0, ySplit: 4 }];

  // === CONFIGURACIONES FINALES ===
  [hojaResumen, hojaDetalle].forEach(sheet => {
    // Configurar impresión
    sheet.pageSetup = {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      margins: {
        left: 0.7, right: 0.7,
        top: 0.75, bottom: 0.75,
        header: 0.3, footer: 0.3
      }
    };

    // Configurar encabezado y pie de página con marca
    sheet.headerFooter.oddHeader = "&C&\"Segoe UI,Bold\"&14INSPORTSWEAR - Reporte de Ventas";
    sheet.headerFooter.oddFooter = "&L&D &T&C&\"Segoe UI\"&10Sistema de Gestión Insportswear&RPágina &P de &N";
  });

  // === AGREGAR HOJA DE INFORMACIÓN ===
  const hojaInfo = workbook.addWorksheet("ℹ️ Información");
  hojaInfo.columns = [
    { header: "Campo", key: "campo", width: 25 },
    { header: "Valor", key: "valor", width: 40 }
  ];

  // Header para hoja info
  crearHeaderConTitulo(hojaInfo, "ℹ️ INFORMACIÓN DEL REPORTE", 2);

  // Aplicar estilo al encabezado
  hojaInfo.getRow(4).eachCell(cell => {
    cell.style = estilos.encabezado;
  });

  // Información del reporte
  const infoData = [
    { campo: "📅 Fecha de Generación", valor: DateTime.now().setZone("America/Bogota").setLocale("es").toFormat("cccc, dd 'de' LLLL 'de' yyyy, HH:mm:ss") },
    { campo: "👕 Empresa", valor: "Insportswear" },
    { campo: "📊 Total de Ventas", valor: `${ventas.length} registros` },
    { campo: "💰 Monto Total", valor: `$${totalVentas.toLocaleString('es-CO', { minimumFractionDigits: 2 })}` },
    { campo: "📦 Productos Vendidos", valor: `${totalProductos} unidades` },
    { campo: "🔧 Generado por", valor: "Sistema de Gestión Insportswear" }
  ];

  infoData.forEach((item, index) => {
    const row = hojaInfo.addRow(item);
    const isEvenRow = index % 2 === 0;
    const fillColor = isEvenRow ? colores.neutroClaro : colores.neutro;
    
    row.eachCell((cell, colNumber) => {
      if (colNumber === 1) {
        cell.style = { 
          ...estilos.encabezado, 
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: colores.secundario } },
          alignment: { horizontal: "left", vertical: "middle" }
        };
      } else {
        cell.style = { 
          ...estilos.celdaTexto, 
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } },
          font: { ...estilos.celdaTexto.font, bold: true }
        };
      }
    });
    row.height = 25;
  });

  return workbook;
};

module.exports = generarExcelVentas;