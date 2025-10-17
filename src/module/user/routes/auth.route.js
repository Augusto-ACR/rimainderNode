// src/module/user/routes/auth.route.js
import { Router } from 'express';
import { register, login, registerFromTelegram } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/register-telegram', registerFromTelegram);

export default router;
