// src/app.js
import express from 'express';
import dotenv from 'dotenv';

import authRoutes from './module/user/routes/auth.route.js';
import userRoutes from './module/user/routes/user.route.js';
import eventRoutes from './module/user/routes/event.route.js';
import telegramBot from './utils/telegramBot.js'; 
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


app.use(express.static(path.join(__dirname, '..', 'public')));

dotenv.config();



app.use(express.json());

app.set('port', Number(process.env.PORT) || 3000);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/events', eventRoutes);
app.use(telegramBot)

app.get('/', (_req, res) => res.send('OK'));

export default app;
