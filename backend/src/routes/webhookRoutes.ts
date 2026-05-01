import { Router } from 'express';
import { verifyWhatsAppWebhook, receiveWhatsAppMessage } from '../controllers/webhookController';

const router = Router();

router.get('/whatsapp', verifyWhatsAppWebhook);
router.post('/whatsapp', receiveWhatsAppMessage);

export default router;
