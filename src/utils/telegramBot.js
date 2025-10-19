import express from "express";
import { sendTelegramMessage } from "./telegram.js";

import AppDatasource from "../module/user/providers/datasource.provider.js";
import { User } from "../module/user/entities/user.entity.js";
import { Event } from "../module/user/entities/event.entity.js";

const router = express.Router();

const API_BASE_URL = process.env.API_BASE_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const VALID_CATEGORIES = ['cumpleaños','examen','deportes','trabajo','medico','viaje','otro'];
const CATEGORY_EMOJI = {
  'cumpleaños': '🎂',
  'examen': '📝',
  'deportes': '🏅',
  'trabajo': '💼',
  'medico': '🩺',
  'viaje': '✈️',
  'otro': '📌',
};

// ...existing code...

router.post(`/bot${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const body = req.body;
  console.log("Webhook received:", JSON.stringify(body, null, 2));

  if (!body?.message) return res.sendStatus(200);

  // Obtener repositorios aquí (DESPUÉS de que AppDatasource haya sido inicializado en index.js)
  let userRepo;
  let eventRepo;
  try {
    userRepo = AppDatasource.getRepository(User);
    eventRepo = AppDatasource.getRepository(Event);
  } catch (err) {
    console.error('Error obteniendo repositorios TypeORM (¿AppDatasource inicializado?):', err);
    // responder 200 para evitar retries de Telegram, pero loguear el problema
    return res.sendStatus(200);
  }

  const msg = body.message;
  const chatId = msg.chat.id;
  const rawText = (msg.text || "").trim();
  const text = rawText;

  // Normalizar comando: tomar primer token, quitar @botname, y lowercase
  const firstToken = text.split(/\s+/)[0] || "";
  const command = firstToken.split('@')[0].toLowerCase();

  try {
    // --- /start ---
    if (command === "/start") {
      const telegramUsername = msg.from?.username || `tg_${chatId}`;

      const response = await fetch(`${API_BASE_URL}/auth/register-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: chatId,
          username: telegramUsername,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("Error register-telegram:", response.status, data);
        try { await sendTelegramMessage("⚠️ Error en el servicio, intentá más tarde.", chatId); } catch(e){ console.error('sendTelegramMessage failed', e); }
        return res.sendStatus(200);
      }

      // Upsert: buscar usuario por chat_id, si no existe lo creamos
      let user = await userRepo.findOne({ where: { chat_id: chatId } });
      if (!user) {
        user = userRepo.create({
          username: data.username || telegramUsername,
          chat_id: chatId,
          token: data.token || null,
        });
        await userRepo.save(user);
      } else if (data.token) {
        await userRepo.update({ id: user.id }, { token: data.token });
      }

      // Mensaje al usuario (manejo de errores en el envío)
      try {
        if (data.password && data.password !== "Ya creada") {
          await sendTelegramMessage(
            `✅ Hola ${data.username}!\nTu cuenta fue creada automáticamente.\n\nUsuario: ${data.username}\nContraseña: ${data.password}\n\nPodés iniciar sesión en el calendario.`,
            chatId
          );
        } else {
          await sendTelegramMessage(
            `👋 Hola ${data.username || user.username}!\nYa tenés una cuenta registrada.`,
            chatId
          );
        }
      } catch (err) {
        console.error('Error enviando mensaje de bienvenida:', err);
      }

      return res.sendStatus(200);
    }

    // ...el resto del handler queda igual pero usando userRepo/eventRepo locales...
    // Asegúrate de envolver cada llamada a sendTelegramMessage en try/catch para no romper el handler.

    return res.sendStatus(200);
  } catch (err) {
    console.error("Error processing Telegram webhook:", err);
    try { if (chatId) await sendTelegramMessage(`⚠️ Error: ${err.message}`, chatId); } catch(e){console.error('sendTelegramMessage failed', e); }
    return res.sendStatus(200);
  }
});

export default router;