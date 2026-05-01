import axios from 'axios';

export const sendTemplateMessage = async (to: string, templateName: string) => {
  const token = process.env.WA_TOKEN;
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Las credenciales de WhatsApp no están configuradas en las variables de entorno.');
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const data = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'es_CL' // Idioma español Chile, según aprobación de Meta
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Cristián' },
            { type: 'text', text: 'Revisión de plataforma' }
          ]
        }
      ]
    }
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Mensaje enviado exitosamente:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error enviando mensaje de WhatsApp:', error.response?.data || error.message);
    throw error;
  }
};
