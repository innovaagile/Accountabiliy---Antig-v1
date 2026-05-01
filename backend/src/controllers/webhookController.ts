import { Request, Response } from 'express';
import { sendTemplateMessage } from '../services/whatsappService';


export const verifyWhatsAppWebhook = (req: Request, res: Response): void => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WA_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

export const receiveWhatsAppMessage = (req: Request, res: Response): void => {
  const body = req.body;
  if (body.object) {
    console.log('Mensaje de WhatsApp recibido:', JSON.stringify(body, null, 2));
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
};

export const testSendWhatsApp = async (req: Request, res: Response): Promise<void> => {
  const { to, templateName } = req.body;
  if (!to || !templateName) {
    res.status(400).json({ error: 'Faltan los parámetros "to" y "templateName".' });
    return;
  }
  try {
    const result = await sendTemplateMessage(to, templateName);
    res.status(200).json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
