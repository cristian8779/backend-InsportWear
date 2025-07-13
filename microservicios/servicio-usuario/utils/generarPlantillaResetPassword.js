const generarPlantillaResetPassword = (nombre, token) => {
const url = `https://api.soportee.store/reset-password.html?token=${token}`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Restablecer contraseña</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <table
              border="0"
              cellpadding="0"
              cellspacing="0"
              width="100%"
              style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border-top: 8px solid #BE0C0C; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);"
            >
              <tr>
                <td align="center" style="padding: 32px 24px 16px;">
                  <img
                    src="https://img.icons8.com/ios-filled/100/fa5252/lock--v1.png"
                    alt="Ícono de seguridad"
                    width="64"
                    height="64"
                    style="display:block; margin-bottom: 16px;"
                  />
                  <h2 style="font-size: 22px; color: #222222; margin: 16px 0 8px; font-weight: 600;">
                    Hola, ${nombre}
                  </h2>
                  <p style="font-size: 16px; color: #555555; margin: 0;">
                    Recibimos una solicitud para restablecer tu contraseña.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding: 0 32px 24px; font-size: 15px; color: #333333; line-height: 1.6;">
                  <p>
                    Haz clic en el botón a continuación para establecer una nueva contraseña. Este enlace expirará en
                    <strong>10 minutos</strong> por motivos de seguridad.
                  </p>
                  <div style="text-align: center; margin-top: 30px;">
                    <a
                      href="${url}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        background-color: #BE0C0C;
                        color: #ffffff;
                        padding: 14px 28px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: bold;
                        display: inline-block;
                        font-size: 16px;
                      "
                    >
                      Restablecer contraseña
                    </a>
                  </div>
                  <p style="margin-top: 24px;">
                    Si tú no solicitaste este cambio, simplemente ignora este correo. Tu contraseña actual seguirá siendo válida.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="font-size: 12px; color: #999999; padding: 20px 32px;">
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

module.exports = generarPlantillaResetPassword;
