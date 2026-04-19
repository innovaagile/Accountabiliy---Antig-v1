const generarPlantillaBase = (contenidoHTML: string): string => {
  return `
    <div style="background-color: #f7f9fa; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="border-top: 4px solid #A9D42C; padding: 30px; text-align: center;">
          <img src="URL_LOGO" alt="InnovaAgile" style="max-height: 40px;" />
        </div>
        <div style="padding: 0 40px 40px 40px;">
          ${contenidoHTML}
        </div>
        <div style="border-bottom: 4px solid #A9D42C; background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">© 2026 InnovaAgile - Accountability Coaching</p>
          <p style="margin: 5px 0 0 0;">Este es un email automático, por favor no respondas directamente.</p>
        </div>
      </div>
    </div>
  `;
};

export const enviarCorreoBienvenida = async (email: string, nombre: string, passwordTemp: string): Promise<void> => {
  const contenidoHTML = `
    <h1 style="color: #A9D42C; font-size: 24px; margin-bottom: 20px; text-align: center;">¡Bienvenido a Accountability Coaching!</h1>
    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hola <strong>${nombre}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso:</p>
    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Usuario:</strong> ${email}</p>
      <p style="margin: 0; font-size: 16px;"><strong>Contraseña temporal:</strong> ${passwordTemp}</p>
    </div>
    <p style="color: #ef4444; font-size: 14px; font-weight: bold; text-align: center;">⚠️ Importante: Por tu seguridad, deberás cambiar tu contraseña en tu primer inicio de sesión.</p>
  `;

  const html = generarPlantillaBase(contenidoHTML);

  console.log(`\n==========================================`);
  console.log(`[SIMULACIÓN DE EMAIL: BIENVENIDA]`);
  console.log(`Enviado a: ${email}`);
  console.log(`Asunto:   ¡Bienvenido a Accountability Coaching!`);
  console.log(`Cuerpo HTML:\n${html}`);
  console.log(`==========================================\n`);
};

export const enviarCorreoReseteo = async (email: string, nombre: string, nuevaPassword: string): Promise<void> => {
  const contenidoHTML = `
    <h1 style="color: #A9D42C; font-size: 24px; margin-bottom: 20px; text-align: center;">Reseteo de Contraseña</h1>
    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hola <strong>${nombre}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Se ha solicitado un reseteo de tu contraseña. Aquí tienes tu nueva clave temporal:</p>
    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Usuario:</strong> ${email}</p>
      <p style="margin: 0; font-size: 16px;"><strong>Nueva contraseña temporal:</strong> ${nuevaPassword}</p>
    </div>
    <p style="color: #ef4444; font-size: 14px; font-weight: bold; text-align: center;">⚠️ Importante: Por tu seguridad, deberás cambiar tu contraseña inmediatamente despues de iniciar sesión.</p>
  `;

  const html = generarPlantillaBase(contenidoHTML);

  console.log(`\n==========================================`);
  console.log(`[SIMULACIÓN DE EMAIL: RESETEO]`);
  console.log(`Enviado a: ${email}`);
  console.log(`Asunto:   Reseteo de Contraseña`);
  console.log(`Cuerpo HTML:\n${html}`);
  console.log(`==========================================\n`);
};
