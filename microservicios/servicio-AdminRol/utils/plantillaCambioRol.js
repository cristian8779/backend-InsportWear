const generarPlantillaRol = (nombre, nuevoRol, codigo) => {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Invitación de Rol - InsportWear</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        margin: 0;
        padding: 20px;
        background: #ffffff;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }

      .container {
        max-width: 480px;
        width: 100%;
      }

      .card {
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border: 1px solid #e2e8f0;
      }

      .header {
        background: #fafafa;
        padding: 48px 32px;
        text-align: center;
        border-bottom: 1px solid #e2e8f0;
      }

      .icon {
        width: 72px;
        height: 72px;
        background: #f7fafc;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        margin: 0 auto 20px;
        border: 2px solid #e2e8f0;
      }

      .header h1 {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
        color: #1a202c;
      }

      .header p {
        font-size: 15px;
        color: #718096;
        font-weight: 400;
      }

      .content {
        padding: 40px 32px;
      }

      .greeting {
        font-size: 16px;
        color: #1a202c;
        margin-bottom: 24px;
        font-weight: 400;
      }

      .greeting strong {
        font-weight: 600;
      }

      .message {
        font-size: 15px;
        color: #4a5568;
        line-height: 1.6;
        margin-bottom: 32px;
      }

      .role-badge {
        display: inline-block;
        background: #1a202c;
        color: white;
        padding: 6px 16px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        margin: 8px 0;
      }

      .code-container {
        background: #f7fafc;
        border-radius: 12px;
        padding: 32px 24px;
        text-align: center;
        margin-bottom: 32px;
        border: 2px dashed #e2e8f0;
      }

      .code-label {
        font-size: 13px;
        color: #718096;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 16px;
      }

      .code {
        background: white;
        color: #1a202c;
        font-weight: 700;
        font-size: 36px;
        letter-spacing: 12px;
        padding: 20px 24px;
        border-radius: 8px;
        display: inline-block;
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        border: 2px solid #1a202c;
        user-select: all;
      }

      .expiry {
        margin-top: 16px;
        font-size: 13px;
        color: #718096;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .info-box {
        background: #f7fafc;
        border-left: 4px solid #1a202c;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 24px;
      }

      .info-box p {
        font-size: 14px;
        color: #4a5568;
        line-height: 1.6;
        margin: 0;
      }

      .steps {
        margin-bottom: 32px;
      }

      .step {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }

      .step-number {
        width: 28px;
        height: 28px;
        background: #1a202c;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        flex-shrink: 0;
      }

      .step-content {
        flex: 1;
        padding-top: 3px;
      }

      .step-content p {
        font-size: 14px;
        color: #4a5568;
        line-height: 1.5;
        margin: 0;
      }

      .divider {
        height: 1px;
        background: #e2e8f0;
        margin: 32px 0;
      }

      .note {
        text-align: center;
        font-size: 13px;
        color: #718096;
        line-height: 1.5;
      }

      .footer {
        background: #f7fafc;
        padding: 24px 32px;
        text-align: center;
        border-top: 1px solid #e2e8f0;
      }

      .footer-brand {
        font-weight: 700;
        color: #1a202c;
        font-size: 15px;
        margin-bottom: 4px;
      }

      .footer-text {
        font-size: 12px;
        color: #a0aec0;
      }

      @media (max-width: 600px) {
        body {
          padding: 12px;
        }
        
        .header {
          padding: 40px 24px;
        }
        
        .content {
          padding: 32px 24px;
        }
        
        .code {
          font-size: 28px;
          letter-spacing: 8px;
          padding: 16px 20px;
        }
        
        .footer {
          padding: 20px 24px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="header">
          <div class="icon">🎯</div>
          <h1>Invitación de Rol</h1>
          <p>Confirmación requerida</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hola <strong>${nombre}</strong>,
          </div>
          
          <div class="message">
            Has sido invitado a asumir el rol de 
            <div class="role-badge">${nuevoRol}</div>
            en InsportWear.
          </div>
          
          <div class="code-container">
            <div class="code-label">Tu código de verificación</div>
            <div class="code">${codigo}</div>
            <div class="expiry">
              <span>⏱️</span>
              <span>Expira en 5 minutos</span>
            </div>
          </div>
          
          <div class="info-box">
            <p>
              <strong>Para aceptar esta invitación:</strong> Inicia sesión en la app e ingresa este código cuando se te solicite.
            </p>
          </div>
          
          <div class="divider"></div>
          
          <div class="note">
            Si no solicitaste este cambio de rol,<br>
            puedes ignorar este mensaje de forma segura.
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-brand">InsportWear</div>
          <div class="footer-text">
            © ${new Date().getFullYear()} Todos los derechos reservados
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = generarPlantillaRol;