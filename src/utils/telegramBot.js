// ./src/utils/telegramBot.js
import express from "express";
import { sendTelegramMessage } from "./telegram.js";

import AppDatasource from "../module/user/providers/datasource.provider.js";
import { User } from "../module/user/entities/user.entity.js";
import { Event } from "../module/event/entities/event.entity.js";

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

const userRepo = AppDatasource.getRepository(User);
const eventRepo = AppDatasource.getRepository(Event);

router.post(`/bot${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const body = req.body;
  console.log("Webhook received:", JSON.stringify(body, null, 2));

  if (!body?.message?.text) {
    return res.sendStatus(200);
  }

  const msg = body.message;
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  try {
    // --- /start ---
    if (text === "/start") {
      const telegramUsername = msg.from.username || `tg_${chatId}`;
      console.log("Processing /start for:", telegramUsername);

      const response = await fetch(`${API_BASE_URL}/auth/register-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: chatId,
          username: telegramUsername,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Error en backend");

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
      return res.sendStatus(200);
    }

    // --- /evento ---
    if (text.toLowerCase().startsWith("/evento")) {
      const args = text.replace("/evento", "").split(",").map(s => s.trim());
      console.log("Evento args:", args);

      if (args.length < 3) {
        await sendTelegramMessage(
          `⚠️ Formato inválido. Debe ser:\n` +
          `/evento Título, YYYY-MM-DD, HH:MM, Categoría opcional, Descripción opcional`,
          chatId
        );
        return res.sendStatus(200);
      }

      const [title, date, time, categoryRaw, descriptionRaw] = args;

      if (!title) throw new Error("El título es obligatorio");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Fecha inválida, usar YYYY-MM-DD");
      if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("Hora inválida, usar HH:MM");

      const category = VALID_CATEGORIES.includes(categoryRaw?.toLowerCase())
        ? categoryRaw.toLowerCase()
        : 'otro';
      const description = descriptionRaw || null;

      const user = await userRepo.findOne({ where: { chat_id: chatId } });
      if (!user) {
        await sendTelegramMessage(
          '⚠️ No se encontró tu usuario. Por favor envía /start primero para registrarte.',
          chatId
        );
        return res.sendStatus(200);
      }

      const [y, m, d] = date.split("-").map(Number);
      const ev = eventRepo.create({
        title,
        date,
        time,
        year: y,
        month: m,
        day: d,
        category,
        description,
        user: { id: user.id },
      });
      await eventRepo.save(ev);

      const emoji = CATEGORY_EMOJI[category] || "📌";
      const mensaje =
        `🗓️ Evento creado correctamente!\n\n` +
        `<b>${title} ${emoji}</b>\n` +
        `• Fecha: ${date}\n` +
        `• Hora: ${time}\n` +
        (description ? `• Descripción: ${description}\n` : "") +
        `• Categoría: ${category}`;

      await sendTelegramMessage(mensaje, chatId, "HTML");
      return res.sendStatus(200);
    }

    // otros mensajes
    return res.sendStatus(200);

  } catch (err) {
    console.error("Error processing Telegram webhook:", err);
    await sendTelegramMessage(`⚠️ Error: ${err.message}`, chatId);
    return res.sendStatus(200);
  }
});

export default router;
