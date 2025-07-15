const generarPlantillaCodigoReset = (nombre = "usuario", codigo) => {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Restablecer tu contraseña</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f5f6fa; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6fa; padding:40px 0;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:600px; background:#ffffff; border-radius:10px; box-shadow:0 4px 20px rgba(0,0,0,0.08); overflow:hidden; border-top:5px solid #BE0C0C;">
            <tr>
              <td align="center" style="padding:30px 20px 10px;">
                <img src="https://img.icons8.com/ios-filled/100/fa5252/lock--v1.png" width="60" height="60" alt="Ícono de candado" />
                <h2 style="margin-top:20px; font-size:22px; color:#222;">Hola, ${nombre} 👋</h2>
                <p style="font-size:16px; color:#555; margin:8px 0 0;">Recibimos una solicitud para cambiar tu contraseña.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 30px;">
                <p style="font-size:15px; color:#444; line-height:1.6; margin-bottom:24px;">
                  Para continuar, introduce este código de verificación en el formulario donde lo estás solicitando. 
                  Este código es válido solo por <strong>5 minutos</strong>.
                </p>
                <div style="font-size:32px; letter-spacing:6px; font-weight:bold; color:#BE0C0C; background:#fbeaea; padding:16px 24px; border-radius:10px; display:inline-block;">
                  ${codigo}
                </div>
                <p style="font-size:14px; color:#888; margin-top:24px;">
                  Si tú no solicitaste este cambio, puedes ignorar este mensaje. Tu cuenta sigue segura.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 30px 30px; font-size:14px; color:#666;">
                <p style="margin-bottom:10px;">¿Necesitas ayuda adicional?</p>
                <p>Escríbenos a <a href="mailto:soporte@soportee.store" style="color:#BE0C0C; text-decoration:none;">soporte@soportee.store</a>. Estaremos encantados de ayudarte.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px; font-size:12px; color:#999;">
                © ${new Date().getFullYear()} Soportee. Todos los derechos reservados.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

module.exports = generarPlantillaCodigoReset;
