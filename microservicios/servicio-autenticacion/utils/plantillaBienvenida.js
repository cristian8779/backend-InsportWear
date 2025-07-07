const generarPlantillaBienvenida = (nombre) => {
  return `
    <div style="margin: 0; padding: 0; background-color: #f4f4f4;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border-top: 8px solid #b30000; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
              <tr>
                <td align="center" style="padding: 32px 24px 16px; font-family: Arial, sans-serif;">
                  <div style="font-size: 48px;">👋</div>
                  <h2 style="font-size: 24px; color: #222222; margin: 16px 0 8px;">¡Bienvenido, ${nombre}!</h2>
                  <p style="font-size: 16px; color: #555555; margin: 0;">Tu cuenta ha sido creada con éxito.</p>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding: 0 32px 24px; font-family: Arial, sans-serif; font-size: 15px; color: #333333; line-height: 1.6;">
                  <p>¡Nos alegra tenerte en nuestra app! Ya puedes explorar productos, descubrir promociones exclusivas y realizar tus compras de forma rápida y segura.</p>
                  <p>Si tienes alguna duda, nuestro equipo de soporte está aquí para ayudarte.</p>
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="myecomapp://home" style="
                      background-color: #b30000;
                      color: #ffffff;
                      padding: 14px 28px;
                      border-radius: 8px;
                      text-decoration: none;
                      font-weight: bold;
                      display: inline-block;
                      font-size: 16px;
                      transition: background-color 0.3s ease;
                    ">
                      Ir a la tienda
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="font-size: 12px; color: #999999; padding: 20px 32px; font-family: Arial, sans-serif;">
                  © ${new Date().getFullYear()} . Todos los derechos reservados.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

module.exports = generarPlantillaBienvenida;
