import { Router } from 'express';
import { getCoachees, createCoachee } from '../controllers/coacheeController';

const router = Router();
router.get('/', getCoachees);
router.post('/', createCoachee);

export default router;