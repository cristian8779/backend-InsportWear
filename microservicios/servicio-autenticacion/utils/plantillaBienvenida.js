const generarPlantillaBienvenida = (nombre) => {
  return `
    <div style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 0;">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
            <tr>
            <td align="center" valign="top" width="600">
            <![endif]-->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
              <tr>
                <td style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header con borde superior -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="background-color: #b30000; height: 8px; line-height: 8px; font-size: 8px;">&nbsp;</td>
                    </tr>
                  </table>
                  
                  <!-- Logo y saludo principal -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 40px 20px 20px; background-color: #ffffff;">
                        
                        <!-- Nombre de la empresa -->
                        <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: bold; color: #b30000; text-align: center; letter-spacing: 1px;">
                          InsportWear
                        </h1>
                        
                        <!-- Emoji de bienvenida -->
                        <div style="font-size: 48px; margin-bottom: 15px;">👋</div>
                        
                        <!-- Saludo personalizado -->
                        <h2 style="margin: 0 0 8px; font-size: 26px; font-weight: bold; color: #222222; text-align: center;">
                          ¡Bienvenido, ${nombre}!
                        </h2>
                        
                        <p style="margin: 0; font-size: 16px; color: #666666; text-align: center;">
                          Tu cuenta deportiva ha sido creada con éxito
                        </p>
                        
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Contenido principal -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 0 30px 30px; background-color: #ffffff;">
                        
                        <!-- Mensaje de bienvenida -->
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #b30000;">
                          <p style="margin: 0 0 15px; font-size: 16px; color: #333333; line-height: 1.6;">
                            <strong>¡Nos alegra tenerte en InsportWear!</strong> 🏃‍♂️
                          </p>
                          <p style="margin: 0; font-size: 15px; color: #555555; line-height: 1.6;">
                            Ya puedes explorar nuestra colección deportiva, descubrir promociones exclusivas y realizar tus compras de forma rápida y segura. Desde ropa deportiva hasta accesorios, tenemos todo lo que necesitas para tu vida activa.
                          </p>
                        </div>
                        
                        <!-- Beneficios -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                          <tr>
                            <td width="50%" align="center" style="padding: 15px;">
                              <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%); padding: 20px; border-radius: 12px; border: 2px solid #ffe0e0;">
                                <div style="font-size: 32px; margin-bottom: 12px;">🛡️</div>
                                <h3 style="margin: 0 0 8px; font-size: 16px; color: #b30000; font-weight: bold;">Compra Segura</h3>
                                <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.4;">Protección garantizada en cada transacción</p>
                              </div>
                            </td>
                            <td width="50%" align="center" style="padding: 15px;">
                              <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%); padding: 20px; border-radius: 12px; border: 2px solid #ffe0e0;">
                                <div style="font-size: 32px; margin-bottom: 12px;">🎯</div>
                                <h3 style="margin: 0 0 8px; font-size: 16px; color: #b30000; font-weight: bold;">Ofertas Exclusivas</h3>
                                <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.4;">Descuentos especiales para miembros</p>
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Productos deportivos destacados -->
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #b30000;">
                          <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: bold; color: #b30000; text-align: center;">
                            🏆 Descubre nuestros productos deportivos
                          </h3>
                          
                          <!-- Grid de productos -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="50%" align="center" style="padding: 10px;">
                                <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                  <div style="font-size: 28px; margin-bottom: 8px;">👕</div>
                                  <h4 style="margin: 0 0 5px; font-size: 14px; color: #333; font-weight: bold;">Ropa Deportiva</h4>
                                  <p style="margin: 0; font-size: 12px; color: #666;">Camisetas, shorts, sudaderas</p>
                                </div>
                              </td>
                              <td width="50%" align="center" style="padding: 10px;">
                                <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                  <div style="font-size: 28px; margin-bottom: 8px;">👟</div>
                                  <h4 style="margin: 0 0 5px; font-size: 14px; color: #333; font-weight: bold;">Calzado Deportivo</h4>
                                  <p style="margin: 0; font-size: 12px; color: #666;">Running, fútbol, basketball</p>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td width="50%" align="center" style="padding: 10px;">
                                <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                  <div style="font-size: 28px; margin-bottom: 8px;">🏋️</div>
                                  <h4 style="margin: 0 0 5px; font-size: 14px; color: #333; font-weight: bold;">Equipamiento</h4>
                                  <p style="margin: 0; font-size: 12px; color: #666;">Mancuernas, bandas, colchonetas</p>
                                </div>
                              </td>
                              <td width="50%" align="center" style="padding: 10px;">
                                <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                  <div style="font-size: 28px; margin-bottom: 8px;">🎒</div>
                                  <h4 style="margin: 0 0 5px; font-size: 14px; color: #333; font-weight: bold;">Accesorios</h4>
                                  <p style="margin: 0; font-size: 12px; color: #666;">Mochilas, botellas, gorras</p>
                                </div>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 15px 0 0; font-size: 14px; color: #666; text-align: center; font-style: italic;">
                            Todo lo que necesitas para alcanzar tus metas deportivas 💪
                          </p>
                        </div>
                        
                        <!-- Mensaje de soporte mejorado -->
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 12px; border-left: 4px solid #b30000; text-align: center;">
                          <div style="font-size: 24px; margin-bottom: 10px;">💬</div>
                          <h4 style="margin: 0 0 10px; font-size: 16px; color: #333333; font-weight: bold;">¿Necesitas ayuda?</h4>
                          <p style="margin: 0 0 15px; font-size: 14px; color: #666666; line-height: 1.5;">
                            Nuestro equipo de soporte deportivo está listo para ayudarte en cualquier momento.
                          </p>
                          <div style="background-color: white; padding: 12px; border-radius: 6px; display: inline-block;">
                            <p style="margin: 0; font-size: 13px; color: #b30000; font-weight: bold;">
                              📧 soporteinsportswear@gmail.com
                            </p>
                          </div>
                        </div>
                        
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Footer -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                        <p style="margin: 0 0 10px; font-size: 14px; color: #b30000; font-weight: bold;">
                          InsportWear - Tu tienda deportiva de confianza
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #999999;">
                          © ${new Date().getFullYear()} InsportWear. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
            </table>
            <!--[if (gte mso 9)|(IE)]>
            </td>
            </tr>
            </table>
            <![endif]-->
          </td>
        </tr>
      </table>
    </div>
  `;
};

module.exports = generarPlantillaBienvenida;