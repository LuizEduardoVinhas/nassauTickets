import { Router } from 'express';
import { emitirTicket, chamarProximoTicket, obterPainel } from '../controllers/ticketController.js';

const router = Router();

router.post('/emissao', emitirTicket);
router.post('/chamar-proximo', chamarProximoTicket);
router.get('/painel', obterPainel); 

export default router;