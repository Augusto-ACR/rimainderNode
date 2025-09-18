// src/module/event/routes/event.route.js (protegido con authGuard)
import { Router } from 'express';
import { listByMonth, createEvent, updateEvent, deleteEvent } from '../controllers/event.controller.user.js';
import { authGuard } from '../midleware/auth.middleware.js';

const router = Router();

router.use(authGuard); // todas /events requieren estar logueado

router.get('/', listByMonth);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
