import { Router } from 'express';
import { verifyWhatsAppWebhook, receiveWhatsAppMessage, testSendWhatsApp } from '../controllers/webhookController';

const router = Router();

router.get('/whatsapp', verifyWhatsAppWebhook);
router.post('/whatsapp', receiveWhatsAppMessage);
router.post('/whatsapp/test', testSendWhatsApp);

export default router;
