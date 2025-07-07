const generarPlantillaRol = (nombre, nuevoRol, token) => {
  // Asegurarse de que solo usamos el token, no un link malformado
  const BASE_URL = "https://crud-master-api-uf7o.onrender.com";
  const link = `${BASE_URL}/confirmar-rol.html?token=${encodeURIComponent(token)}`;

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de cambio de rol</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        border-left: 6px solid #e74c3c;
        overflow: hidden;
      }
      .header {
        text-align: center;
        padding: 30px 20px 10px;
      }
      .header h2 {
        margin: 20px 0 10px;
        color: #e74c3c;
      }
      .body {
        padding: 0 30px 30px;
      }
      .body p {
        font-size: 16px;
        line-height: 1.6;
        margin: 20px 0;
      }
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button {
        background-color: #e74c3c;
        color: #fff;
        padding: 14px 28px;
        text-decoration: none;
        font-weight: bold;
        border-radius: 6px;
        font-size: 16px;
        display: inline-block;
      }
      .footer {
        font-size: 12px;
        color: #999;
        text-align: center;
        padding: 20px 30px;
        border-top: 1px solid #eee;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Invitación para cambio de rol</h2>
      </div>
      <div class="body">
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Se ha solicitado que tu cuenta adquiera el rol de <strong style="color:#e74c3c;">${nuevoRol}</strong> dentro de nuestra plataforma.</p>
        <p>Este enlace estará activo por <strong>5 minutos</strong> y es válido una sola vez. Si deseas confirmar este cambio, haz clic en el botón:</p>
        <div class="button-container">
          <a class="button" href="${link}" target="_blank" rel="noopener noreferrer">Aceptar rol de ${nuevoRol}</a>
        </div>
        <p>Si no reconoces esta solicitud, simplemente ignora este correo. No se aplicará ningún cambio si no confirmas.</p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Soportee. Todos los derechos reservados.
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = generarPlantillaRol;
