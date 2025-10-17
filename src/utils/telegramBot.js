import express from 'express';
import { envs } from '../configuration/envs.js';
import { sendTelegramMessage } from './telegram.js';

const router = express.Router();

router.post(`/bot${envs.TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const body = req.body;

  // Si es un mensaje con texto
  if (body?.message?.text) {
    const msg = body.message;
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
      try {
        const response = await fetch(`${envs.API_BASE_URL}/api/register-telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: chatId,
            username: msg.from.username,
          }),
        });
        const data = await response.json();

        if (response.status === 201) {
          await sendTelegramMessage(
            `✅ Hola ${data.username}!\nTu cuenta fue creada.\n\nUsuario: ${data.username}\nContraseña: ${data.password}`,
            chatId
          );
        } else {
          await sendTelegramMessage(
            `👋 Hola ${data.username || msg.from.username}!\nYa tenés una cuenta registrada.`,
            chatId
          );
        }
      } catch (err) {
        await sendTelegramMessage(`⚠️ Error interno.`, chatId);
      }
    }
  }

  res.sendStatus(200);
});

export default router;