const generarPlantillaRol = (nombre, nuevoRol, codigo) => {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Invitación</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f0f2f5;
        font-family: 'Inter', sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }

      .card {
        background-color: #ffffff;
        max-width: 480px;
        width: 100%;
        padding: 40px 30px;
        border-radius: 18px;
        box-shadow: 0 10px 35px rgba(0, 0, 0, 0.07);
        text-align: center;
        position: relative;
      }

      .emoji {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .card h2 {
        font-size: 22px;
        margin-bottom: 14px;
        color: #111827;
      }

      .card p {
        font-size: 16px;
        color: #374151;
        margin-bottom: 22px;
        line-height: 1.5;
      }

      .code {
        background-color: #fef2f2;
        color: #dc2626;
        font-weight: 700;
        font-size: 28px;
        letter-spacing: 6px;
        border-radius: 10px;
        padding: 18px 28px;
        display: inline-block;
        margin: 20px 0;
        border: 2px dashed #dc2626;
      }

      .alerta {
        margin-top: 30px;
        background-color: #fef2f2;
        border-left: 5px solid #ef4444;
        padding: 16px;
        border-radius: 8px;
        font-size: 14px;
        color: #991b1b;
        text-align: left;
      }

      .footer {
        margin-top: 35px;
        font-size: 12px;
        color: #9ca3af;
      }

      @media (max-width: 480px) {
        .code {
          font-size: 24px;
        }
        .card {
          padding: 30px 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="emoji">📬</div>
      <h2>Hola ${nombre},</h2>
      <p>Has sido invitado a asumir el rol de <strong>${nuevoRol}</strong> en nuestra plataforma.</p>
      <p>Usa este código para confirmar tu cambio de rol:</p>

      <div class="code">${codigo}</div>

      <p>Este código expira en <strong>5 minutos</strong> y solo puede usarse una vez.</p>

      <div class="alerta">
        ✅ Primero inicia sesión en la app.<br/>
        🔐 Luego dirígete a <strong>Verificación de rol</strong> y pega el código.
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