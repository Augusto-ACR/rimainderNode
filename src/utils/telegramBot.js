// ./src/utils/telegramBot.js
import express from 'express';
import fetch from 'node-fetch';
import { sendTelegramMessage } from './telegram.js';

const router = express.Router();

// Leer variables de entorno
const API_BASE_URL = process.env.API_BASE_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Webhook de Telegram
router.post(`/bot${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const body = req.body;

  // Logueamos todo lo que llega para depuración
  console.log('Webhook received:', JSON.stringify(body, null, 2));

  if (body?.message?.text) {
    const msg = body.message;
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
      try {
        // Generar username si no existe
        const telegramUsername = msg.from.username || `tg_${chatId}`;

        console.log('Calling backend /register-telegram with:', {
          telegram_id: chatId,
          username: telegramUsername,
        });

        const response = await fetch(`${API_BASE_URL}/auth/register-telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: chatId,
            username: telegramUsername,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          await sendTelegramMessage(
            `✅ Hola ${data.username}!\nTu cuenta fue creada automáticamente.\n\nUsuario: ${data.username}\nContraseña: ${data.password}\n\nPodés iniciar sesión en el calendario.`,
            chatId
          );
        } else {
          await sendTelegramMessage(
            `👋 Hola ${telegramUsername}!\nYa tenés una cuenta registrada.`,
            chatId
          );
        }
      } catch (err) {
        console.error('Error handling /start:', err);
        await sendTelegramMessage(
          `⚠️ Error interno. Por favor intentá nuevamente más tarde.`,
          chatId
        );
      }
    }
  }

  // Siempre respondemos 200 a Telegram
  res.sendStatus(200);
});

export default router;
