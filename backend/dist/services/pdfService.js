"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContractPDF = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const generateContractPDF = async (firma, planGenerado) => {
    let browser;
    try {
        browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        // Cargar logo y convertir a Base64
        const logoPath = path_1.default.join(__dirname, '../../../../frontend/public/logo.png');
        let base64Logo = '';
        if (fs_1.default.existsSync(logoPath)) {
            const logoBuffer = fs_1.default.readFileSync(logoPath);
            base64Logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
        // Mapeo dinámico de hábitos
        const habitosDiarios = planGenerado.micro_habitos_diarios || [];
        const habitoSemanal = planGenerado.micro_habito_semanal;
        const habitosDiariosHTML = habitosDiarios.map((h, index) => `
      <div class="habit-box">
        <strong>${index + 1}. ${h.titulo} (Diario)</strong><br/>
        <em>Acción:</em> ${h.accion}<br/>
        <em>Disparador:</em> ${h.disparador}<br/>
        <em>Medición:</em> ${h.medicion}
      </div>
    `).join('');
        const habitoSemanalHTML = habitoSemanal ? `
      <div class="habit-box">
        <strong>4. ${habitoSemanal.titulo} (Semanal)</strong><br/>
        <em>Acción:</em> ${habitoSemanal.accion}<br/>
        <em>Disparador:</em> ${habitoSemanal.disparador}<br/>
        <em>Medición:</em> ${habitoSemanal.medicion}
      </div>
    ` : '';
        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333333;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            font-size: 14px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #A9D42C;
            padding-bottom: 20px;
          }
          .header img {
            max-height: 60px;
          }
          h1 {
            color: #1B254B;
            font-size: 24px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 20px;
          }
          h2 {
            color: #A9D42C;
            font-size: 18px;
            margin-top: 30px;
            border-bottom: 1px solid #eeeeee;
            padding-bottom: 5px;
          }
          p {
            text-align: justify;
            margin-bottom: 15px;
          }
          .habit-box {
            background-color: #f9f9f9;
            border-left: 4px solid #A9D42C;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 4px;
          }
          .signature-section {
            margin-top: 60px;
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #cccccc;
            width: 60%;
            margin-left: auto;
            margin-right: auto;
          }
          .signature-text {
            font-style: italic;
            font-size: 16px;
            color: #1B254B;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${base64Logo ? `<img src="${base64Logo}" alt="InnovaAgile" />` : '<h2>INNOVAAGILE</h2>'}
          <h1>Contrato Personal de Excelencia Ejecutiva</h1>
        </div>

        <h2>I. Declaración De Identidad</h2>
        <p>
          Reconozco que la disciplina no es un rasgo de personalidad estático, sino un <strong>sistema de diseño</strong>. 
          A través de este contrato, me comprometo a implementar micro-comportamientos diarios y semanales 
          que alterarán fundamentalmente mi enfoque, productividad y liderazgo en el entorno profesional.
        </p>

        <h2>II. El Sistema Binario (Reglas De Oro)</h2>
        <p>
          Entiendo que el progreso se rige por un sistema estrictamente binario: 
          <strong>1 (Cumplido)</strong> o <strong>0 (Incumplido)</strong>. No existen excusas, medias tintas ni "intentos". 
          Este sistema elimina la carga cognitiva de la negociación interna; la acción simplemente se ejecuta como está diseñada.
        </p>

        <h2>III. Pases De Contingencia (Los 3 Comodines)</h2>
        <p>
          Reconozco la realidad del caos ejecutivo. Por lo tanto, durante este ciclo de 20 días hábiles, 
          dispongo exactamente de <strong>3 Comodines (Pases de Contingencia)</strong>. 
          Un comodín me permite registrar un "1" en un día donde fue humanamente imposible cumplir. 
          Una vez agotados los 3 comodines, cualquier falla adicional resulta en un incumplimiento del ciclo.
        </p>

        <h2>IV. Los Hábitos A Que Me Comprometo</h2>
        <p>
          A partir de la firma de este documento, incorporaré inquebrantablemente las siguientes 
          acciones estratégicas en mi rutina:
        </p>
        
        ${habitosDiariosHTML}
        ${habitoSemanalHTML}

        <h2>V. El Compromiso De Integridad</h2>
        <p>
          Acepto que si fallo sin comodines, mi racha se reinicia automáticamente. 
          En tal evento, me comprometo a documentar mi aprendizaje mediante una nota de voz reflexiva, 
          analizando el fallo sistémico para evitar su recurrencia. La honestidad brutal es el único camino hacia la excelencia.
        </p>

        <h2>VI. Compromiso De InnovaAgile</h2>
        <p>
          Nosotros, como tus coaches estratégicos, nos comprometemos a auditar tu sistema, 
          proveer aislamiento técnico de fallas y acompañarte incondicionalmente para asegurar 
          que estos micro-hábitos se cristalicen en tu nueva identidad profesional.
        </p>

        <div class="signature-section">
          <p>Firmado digitalmente por:</p>
          <p class="signature-text">${firma}</p>
          <p style="font-size: 12px; color: #888;">Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
      </body>
      </html>
    `;
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        // Generar Buffer del PDF (puppeteer 19+ devuelve un Uint8Array que puede ser convertido a Buffer)
        const pdfUint8Array = await page.pdf({
            format: 'A4',
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
            printBackground: true
        });
        return Buffer.from(pdfUint8Array);
    }
    catch (error) {
        console.error('Error generando PDF de contrato:', error);
        throw new Error('No se pudo generar el documento PDF.');
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
};
exports.generateContractPDF = generateContractPDF;
