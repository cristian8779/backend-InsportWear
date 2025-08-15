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
        background-color: #f8fafc;
        font-family: 'Inter', Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        line-height: 1.6;
      }

      .card {
        background-color: #ffffff;
        max-width: 520px;
        width: 100%;
        border-radius: 24px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        text-align: center;
        position: relative;
        overflow: hidden;
        border: 1px solid #e1e5e9;
      }

      .header {
        background-color: #fefefe;
        padding: 40px 30px;
        position: relative;
        border-bottom: 3px solid #f1f5f9;
      }

      .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(248, 250, 252, 0.3);
      }

      .emoji {
        font-size: 64px;
        margin-bottom: 20px;
        display: block;
        filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1));
        position: relative;
        z-index: 1;
      }

      .header h2 {
        font-size: 26px;
        margin-bottom: 8px;
        color: #1a202c;
        font-weight: 700;
        position: relative;
        z-index: 1;
      }

      .subtitle {
        color: #4a5568;
        font-size: 16px;
        font-weight: 500;
        position: relative;
        z-index: 1;
      }

      .content {
        padding: 40px 30px;
      }

      .greeting {
        font-size: 18px;
        color: #1a202c;
        font-weight: 600;
        margin-bottom: 24px;
      }

      .message {
        font-size: 16px;
        color: #4a5568;
        margin-bottom: 32px;
        line-height: 1.7;
        padding: 20px;
        background-color: #f7fafc;
        border-radius: 16px;
        border-left: 4px solid #22543d;
      }

      .role-highlight {
        background-color: #f0fff4;
        color: #22543d;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 20px;
        display: inline-block;
        margin: 0 4px;
        font-size: 15px;
      }

      .code-section {
        background-color: #fef5f5;
        border-radius: 20px;
        padding: 32px;
        margin: 32px 0;
        text-align: center;
        border: 2px solid #fc8181;
        position: relative;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(252, 129, 129, 0.1);
      }

      .code-section::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background-color: #fc8181;
        border-radius: 20px 20px 0 0;
      }

      .code-label {
        font-size: 14px;
        color: #742a2a;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 16px;
      }

      .code {
        background-color: white;
        color: #e53e3e;
        font-weight: 700;
        font-size: 32px;
        letter-spacing: 8px;
        border-radius: 12px;
        padding: 20px 32px;
        display: inline-block;
        border: 3px solid #e53e3e;
        font-family: 'SF Mono', Consolas, monospace;
        box-shadow: 0 8px 16px rgba(229, 62, 62, 0.2);
        position: relative;
        transition: transform 0.2s ease;
      }

      .code:hover {
        transform: translateY(-2px);
      }

      .expiry {
        margin-top: 16px;
        font-size: 14px;
        color: #744210;
        font-weight: 500;
        padding: 8px 16px;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 20px;
        display: inline-block;
      }

      .instructions {
        background-color: #f0fff4;
        border-radius: 16px;
        padding: 24px;
        margin: 28px 0;
        border-left: 5px solid #48bb78;
        box-shadow: 0 6px 16px rgba(72, 187, 120, 0.1);
        text-align: left;
        position: relative;
      }

      .instructions::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background-color: #48bb78;
        border-radius: 16px 16px 0 0;
      }

      .instructions-title {
        font-size: 16px;
        font-weight: 600;
        color: #22543d;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .instruction-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 12px;
        font-size: 14px;
        color: #2f855a;
        line-height: 1.6;
      }

      .instruction-item:last-child {
        margin-bottom: 0;
      }

      .instruction-icon {
        background-color: #48bb78;
        color: white;
        font-size: 12px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .footer {
        background-color: #f8fafc;
        padding: 24px 30px;
        text-align: center;
        border-radius: 0 0 24px 24px;
        border-top: 1px solid #e2e8f0;
      }

      .footer-brand {
        font-weight: 700;
        color: #2d3748;
        font-size: 14px;
        margin-bottom: 4px;
      }

      .footer-text {
        font-size: 12px;
        color: #718096;
      }

      .divider {
        height: 1px;
        background-color: #e2e8f0;
        margin: 24px 0;
      }

      @media (max-width: 600px) {
        body {
          padding: 10px;
        }
        
        .content {
          padding: 24px 20px;
        }
        
        .header {
          padding: 32px 20px;
        }
        
        .code {
          font-size: 24px;
          letter-spacing: 4px;
          padding: 16px 24px;
        }
        
        .footer {
          padding: 20px;
        }
        
        .card {
          max-width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div class="emoji">📬</div>
        <h2>Invitación de Rol</h2>
        <div class="subtitle">Confirmación requerida</div>
      </div>
      
      <div class="content">
        <div class="greeting">¡Hola ${nombre}!</div>
        
        <div class="message">
          Has sido invitado a asumir el rol de 
          <span class="role-highlight">${nuevoRol}</span> 
          en nuestra app InsportWear.
        </div>
        
        <div class="code-section">
          <div class="code-label">Código de Verificación</div>
          <div class="code">${codigo}</div>
          <div class="expiry">⏱️ Expira en 5 minutos • Uso único</div>
        </div>
        
        <div class="instructions">
          <div class="instructions-title">
            📋 Para completar el proceso
          </div>
          
          <div style="color: #2f855a; font-size: 15px; line-height: 1.7; padding: 16px 0;">
            Para confirmar tu nuevo rol, debes 
            <strong>iniciar sesión en la app</strong> y 
            <strong>aceptar la invitación</strong> ingresando este código de verificación.
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div style="text-align: center; color: #718096; font-size: 14px;">
          Si no solicitaste este cambio de rol, puedes ignorar este mensaje.
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-brand">InsportWear</div>
        <div class="footer-text">
          © ${new Date().getFullYear()} Todos los derechos reservados
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = generarPlantillaRol;