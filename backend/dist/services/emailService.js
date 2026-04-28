"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarContratoPdf = exports.enviarCorreoBienvenida = exports.enviarContratoFirmado = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const enviarContratoFirmado = async (emailUsuario, datosPlan, nombreArchivoPDF) => {
    const htmlContent = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f7f7f7; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
        <h1 style="margin: 0; color: #2c3e50;">¡Bienvenido a InnovaAgile!</h1>
      </div>
      <div style="padding: 20px;">
        <p>Hola,</p>
        <p>Gracias por comprometerte con tu crecimiento. Adjunto encontrarás tu <strong>Contrato de Excelencia</strong> (si aplica) y a continuación un resumen de tu plan de acción:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2980b9;">Resumen del Plan de Acción</h3>
          <p><strong>Diagnóstico:</strong> ${datosPlan.diagnostico_problema || 'N/A'}</p>
          <p><strong>Hábitos Diarios:</strong> ${datosPlan.micro_habitos_diarios?.length || 0}</p>
          <p><strong>Hábito Semanal:</strong> ${datosPlan.micro_habito_semanal?.titulo || 'N/A'}</p>
        </div>

        <p>Estamos emocionados de acompañarte en este proceso.</p>
        <p>Saludos,<br>El equipo de InnovaAgile</p>
      </div>
    </div>
  `;
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"InnovaAgile" <no-reply@innovaagile.com>',
        to: emailUsuario,
        subject: 'Tu Contrato de Excelencia - InnovaAgile',
        html: htmlContent,
    };
    if (nombreArchivoPDF) {
        // Si tuviéramos un buffer del PDF o un path, lo agregaríamos acá. 
        // Por ahora solo mencionamos el nombre.
        // mailOptions.attachments = [{ filename: nombreArchivoPDF, path: ... }];
    }
    await transporter.sendMail(mailOptions);
};
exports.enviarContratoFirmado = enviarContratoFirmado;
const path_1 = __importDefault(require("path"));
const enviarCorreoBienvenida = async (emailUsuario, nombreUsuario, passwordTemp) => {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login';
    const htmlContent = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f7f7f7; padding: 20px; text-align: center; border-bottom: 4px solid #A9D42C;">
        <img src="cid:logo_innova" alt="InnovaAgile Logo" style="max-height: 40px;" />
      </div>
      <div style="padding: 30px 20px;">
        <h1 style="margin: 0 0 20px 0; color: #2c3e50; text-align: center;">¡Bienvenido a Accountability Coaching!</h1>
        <p>Hola <strong>${nombreUsuario}</strong>,</p>
        <p>Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso temporal:</p>
        
        <div style="background-color: #f1f5f9; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0;"><strong>Usuario:</strong> ${emailUsuario}</p>
          <p style="margin: 0;"><strong>Contraseña temporal:</strong> ${passwordTemp}</p>
        </div>

        <p style="color: #ef4444; font-weight: bold; text-align: center; font-size: 14px;">⚠️ Importante: Por tu seguridad, deberás cambiar tu contraseña en tu primer inicio de sesión.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #a9d42c; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Iniciar Sesión</a>
        </div>

        <p style="font-size: 14px; color: #666;">Saludos,<br>El equipo de InnovaAgile</p>
      </div>
    </div>
  `;
    const logoPath = path_1.default.join(__dirname, '../../../frontend/public/logo.png');
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"InnovaAgile" <no-reply@innovaagile.com>',
        to: emailUsuario,
        subject: '¡Bienvenido a Accountability Coaching!',
        html: htmlContent,
        attachments: [
            {
                filename: 'logo.png',
                path: logoPath,
                cid: 'logo_innova'
            }
        ]
    };
    await transporter.sendMail(mailOptions);
};
exports.enviarCorreoBienvenida = enviarCorreoBienvenida;
const enviarContratoPdf = async (emailUsuario, nombreUsuario, pdfBuffer) => {
    const htmlContent = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f7f7f7; padding: 20px; text-align: center; border-bottom: 4px solid #A9D42C;">
        <img src="cid:logo_innova" alt="InnovaAgile Logo" style="max-height: 40px;" />
      </div>
      <div style="padding: 30px 20px;">
        <h1 style="margin: 0 0 20px 0; color: #2c3e50; text-align: center;">¡Compromiso Firmado! ✍️</h1>
        <p>Hola <strong>${nombreUsuario}</strong>,</p>
        <p>Has sellado oficialmente tu Contrato de Excelencia. Nos entusiasma mucho acompañarte en esta transformación.</p>
        <p>Adjunto a este correo encontrarás una copia en PDF de tu contrato firmado, el cual detalla tus compromisos diarios y semanales, junto con las reglas de contingencia.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173/login'}" style="background-color: #a9d42c; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ir al Sistema</a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">Saludos,<br>El equipo de InnovaAgile</p>
      </div>
    </div>
  `;
    const logoPath = path_1.default.join(__dirname, '../../../frontend/public/logo.png');
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"InnovaAgile" <no-reply@innovaagile.com>',
        to: emailUsuario,
        subject: 'Tu Contrato de Excelencia - InnovaAgile',
        html: htmlContent,
        attachments: [
            {
                filename: 'logo.png',
                path: logoPath,
                cid: 'logo_innova'
            },
            {
                filename: 'Contrato_Excelencia.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };
    await transporter.sendMail(mailOptions);
};
exports.enviarContratoPdf = enviarContratoPdf;
