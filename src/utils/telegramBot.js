// ./src/utils/telegramBot.js
import express from "express";
import { sendTelegramMessage } from "./telegram.js";

const router = express.Router();

// Variables de entorno
const API_BASE_URL = process.env.API_BASE_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Webhook de Telegram
router.post(`/bot${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const body = req.body;

  console.log("Webhook received:", JSON.stringify(body, null, 2));

  if (body?.message?.text) {
    const msg = body.message;
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") {
      try {
        const telegramUsername = msg.from.username || `tg_${chatId}`;

        console.log("Calling backend /register-telegram with:", {
          telegram_id: chatId,
          username: telegramUsername,
        });

        const response = await fetch(`${API_BASE_URL}/auth/register-telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_id: chatId,
            username: telegramUsername,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Error en backend");
        }

        // Mensajes según si la cuenta es nueva o ya existente
        if (data.password && data.password !== "Ya creada") {
          await sendTelegramMessage(
            `✅ Hola ${data.username}!\nTu cuenta fue creada automáticamente.\n\nUsuario: ${data.username}\nContraseña: ${data.password}\n\nPodés iniciar sesión en el calendario.`,
            chatId
          );
        } else {
          await sendTelegramMessage(
            `👋 Hola ${data.username}!\nYa tenés una cuenta registrada.\nID de usuario: ${data.id}\nSi olvidaste tu contraseña, podés recuperarla desde la web.`,
            chatId
          );
        }
      } catch (err) {
        console.error("Error handling /start:", err);
        await sendTelegramMessage(
          `⚠️ Error interno. Por favor intentá nuevamente más tarde.`,
          chatId
        );
      }
    }
  }

  res.sendStatus(200);
});

export default router;
