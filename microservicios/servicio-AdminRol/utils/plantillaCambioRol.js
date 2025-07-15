const generarPlantillaRol = (nombre, nuevoRol, codigo) => {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Confirmación de cambio de rol</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        overflow: hidden;
        border-left: 5px solid #d32f2f;
      }
      .header {
        background-color: #d32f2f;
        padding: 20px;
        text-align: center;
      }
      .header h2 {
        margin: 0;
        font-size: 22px;
        color: #fff;
      }
      .body {
        padding: 30px;
        text-align: center;
      }
      .body p {
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      .code-box {
        background-color: #fff2f2;
        border: 2px dashed #d32f2f;
        padding: 16px 28px;
        border-radius: 8px;
        font-size: 26px;
        font-weight: bold;
        letter-spacing: 6px;
        color: #d32f2f;
        display: inline-block;
        margin: 20px 0;
      }
      .mensaje-alerta {
        font-size: 14px;
        color: #d32f2f;
        background-color: #fff0f0;
        padding: 14px 16px;
        border-left: 4px solid #d32f2f;
        border-radius: 6px;
        margin-top: 25px;
        text-align: left;
      }
      .footer {
        font-size: 12px;
        color: #999;
        text-align: center;
        padding: 20px;
        border-top: 1px solid #eee;
        background-color: #fafafa;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Invitación para cambio de rol</h2>
      </div>
      <div class="body">
        <p><strong>Hola ${nombre},</strong></p>
        <p>Un SuperAdmin ha solicitado que tu cuenta obtenga el rol de <strong>${nuevoRol}</strong> dentro de nuestra plataforma.</p>
        <p>Para aceptar el cambio, ingresa este código desde la app:</p>
        <div class="code-box">${codigo}</div>
        <p>Este código expira en <strong>5 minutos</strong> y solo es válido una vez.</p>

        <div class="mensaje-alerta">
          Para aceptar esta invitación, primero debes <strong>iniciar sesión en la app</strong> y luego dirigirte a la sección de verificación de rol para ingresar el código.
        </div>
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
