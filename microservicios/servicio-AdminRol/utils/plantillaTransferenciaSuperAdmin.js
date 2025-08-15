const generarPlantillaTransferenciaSuperAdmin = (emailDestinatario, codigo) => {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Transferencia de SuperAdmin - InsportWear</title>
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
        line-height: 1.6;
        min-height: 100vh;
      }
      
      .email-container {
        background: #ffffff;
        max-width: 600px;
        margin: 0 auto;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        border: 1px solid #e1e5e9;
      }
      
      .header {
        background-color: #fefefe;
        padding: 40px;
        text-align: center;
        position: relative;
        border-radius: 24px 24px 0 0;
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
        border-radius: 24px 24px 0 0;
      }
      
      .logo {
        font-size: 72px;
        margin-bottom: 20px;
        display: block;
        filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
        position: relative;
        z-index: 1;
      }
      
      .header h1 {
        color: #1a202c;
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 1;
      }
      
      .header .subtitle {
        color: #4a5568;
        font-size: 16px;
        font-weight: 500;
        position: relative;
        z-index: 1;
      }
      
      .content {
        padding: 48px 40px;
      }
      
      .greeting {
        font-size: 20px;
        color: #1a202c;
        font-weight: 600;
        margin-bottom: 24px;
      }
      
      .message {
        font-size: 16px;
        color: #4a5568;
        margin-bottom: 36px;
        line-height: 1.7;
        padding: 24px;
        background-color: #f7fafc;
        border-radius: 16px;
        border-left: 4px solid #22543d;
      }
      
      .code-section {
        background-color: #fef5f5;
        border-radius: 24px;
        padding: 40px;
        margin: 36px 0;
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
        height: 6px;
        background-color: #fc8181;
        border-radius: 24px 24px 0 0;
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
        background: white;
        color: #e53e3e;
        font-weight: 700;
        font-size: 42px;
        letter-spacing: 12px;
        border-radius: 16px;
        padding: 28px 40px;
        display: inline-block;
        border: 3px solid #e53e3e;
        font-family: 'SF Mono', Consolas, monospace;
        box-shadow: 0 12px 24px rgba(229, 62, 62, 0.2);
        position: relative;
        transition: transform 0.2s ease;
      }
      
      .code:hover {
        transform: translateY(-2px);
      }
      
      .expiry {
        margin-top: 20px;
        font-size: 14px;
        color: #744210;
        font-weight: 500;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 20px;
        display: inline-block;
      }
      
      .instructions {
        background-color: #f0fff4;
        border-radius: 20px;
        padding: 32px;
        margin: 36px 0;
        border-left: 6px solid #48bb78;
        box-shadow: 0 8px 20px rgba(72, 187, 120, 0.1);
        position: relative;
      }
      
      .instructions::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background-color: #48bb78;
        border-radius: 20px 20px 0 0;
      }
      
      .instructions-title {
        font-size: 18px;
        font-weight: 600;
        color: #22543d;
        margin-bottom: 20px;
      }
      
      .step {
        margin-bottom: 20px;
        font-size: 15px;
        color: #2f855a;
        padding-left: 40px;
        position: relative;
        line-height: 1.7;
        padding: 16px 16px 16px 52px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 12px;
        margin-bottom: 12px;
      }
      
      .step:last-child {
        margin-bottom: 0;
      }
      
      .step-number {
        background-color: #48bb78;
        color: white;
        font-weight: 600;
        font-size: 14px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        text-align: center;
        line-height: 32px;
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        box-shadow: 0 4px 8px rgba(72, 187, 120, 0.3);
      }
      
      .warning {
        background-color: #fffaf0;
        border-left: 6px solid #ed8936;
        border-radius: 16px;
        padding: 28px;
        margin: 28px 0;
        box-shadow: 0 8px 20px rgba(237, 137, 54, 0.1);
        position: relative;
      }
      
      .warning::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background-color: #ed8936;
        border-radius: 16px 16px 0 0;
      }
      
      .warning-title {
        font-weight: 600;
        color: #9c4221;
        font-size: 16px;
        margin-bottom: 12px;
      }
      
      .warning p {
        color: #7b341e;
        font-size: 14px;
        margin: 0;
        line-height: 1.6;
      }
      
      .footer {
        background-color: #f8fafc;
        padding: 32px 40px;
        text-align: center;
        border-radius: 0 0 24px 24px;
        border-top: 1px solid #e2e8f0;
      }
      
      .footer-brand {
        font-weight: 700;
        color: #2d3748;
        font-size: 16px;
        margin-bottom: 8px;
      }
      
      .footer-text {
        font-size: 12px;
        color: #718096;
      }
      
      .divider {
        height: 1px;
        background-color: #e2e8f0;
        margin: 36px 0;
      }
      
      .contact-info {
        text-align: center;
        color: #718096;
        font-size: 14px;
        padding: 20px;
        background: rgba(247, 250, 252, 0.5);
        border-radius: 16px;
        margin-top: 24px;
        border: 1px solid #e2e8f0;
      }
      
      @media (max-width: 600px) {
        body {
          padding: 10px;
        }
        
        .content {
          padding: 32px 24px;
        }
        
        .header {
          padding: 32px 24px;
        }
        
        .code {
          font-size: 28px;
          letter-spacing: 6px;
          padding: 20px 28px;
        }
        
        .footer {
          padding: 24px;
        }
        
        .step {
          padding: 12px 12px 12px 44px;
        }
        
        .step-number {
          width: 28px;
          height: 28px;
          line-height: 28px;
          font-size: 12px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">🔑</div>
        <h1>Transferencia de SuperAdmin</h1>
        <div class="subtitle">Confirmación requerida</div>
      </div>
      
      <div class="content">
        <div class="greeting">¡Hola ${emailDestinatario}!</div>
        
        <div class="message">
          Se te está <strong>transfiriendo el rol de SuperAdmin</strong> en la app InsportWear. 
          Este es un rol con privilegios administrativos completos que te permitirá gestionar todos 
          los aspectos de la aplicación.
        </div>
        
        <div class="code-section">
          <div class="code-label">Código de Verificación</div>
          <div class="code">${codigo}</div>
          <div class="expiry">⏱️ Expira en 5 minutos • Uso único</div>
        </div>
        
        <div class="instructions">
          <div class="instructions-title">📋 Pasos para completar la transferencia</div>
          
          <div class="step">
            <div class="step-number">1</div>
            <div>
              <strong>Inicia sesión</strong> en la aplicación InsportWear con tu cuenta de usuario.
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">2</div>
            <div>
              <strong>Acepta la invitación</strong> de transferencia de SuperAdmin que aparece pendiente.
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">3</div>
            <div>
              <strong>Ingresa este código</strong> en el campo de verificación para confirmar la transferencia.
            </div>
          </div>
        </div>
        
        <div class="warning">
          <div class="warning-title">⚠️ Importante</div>
          <p>
            Debes estar autenticado y haber aceptado la invitación antes de usar este código. 
            Si no ves la invitación pendiente, contacta al administrador actual o revisa tu 
            conexión a internet.
          </p>
        </div>
        
        <div class="divider"></div>
        
        <div class="contact-info">
          Si no solicitaste esta transferencia o tienes dudas sobre este proceso, 
          contacta inmediatamente al equipo de soporte.
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

module.exports = generarPlantillaTransferenciaSuperAdmin;