// ./src/utils/telegramBot.js
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

const userRepo = AppDatasource.getRepository(User);
const eventRepo = AppDatasource.getRepository(Event);

router.post(`/bot${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const body = req.body;
  console.log("Webhook received:", JSON.stringify(body, null, 2));

  if (!body?.message) return res.sendStatus(200);

  const msg = body.message;
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  try {
    // --- /start ---
    if (text === "/start") {
      const telegramUsername = msg.from.username || `tg_${chatId}`;

      // Llamada al backend para registrar o devolver usuario
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

      // Guardar token en DB local (por si no viene actualizado)
      if (data.token) {
        await userRepo.update({ chat_id: chatId }, { token: data.token });
      }

      // Mensaje para usuario
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
      if (args.length < 3) {
        await sendTelegramMessage(
          `⚠️ Formato inválido. Debe ser:\n` +
          `/evento Título, YYYY-MM-DD, HH:MM, Categoría opcional, Descripción opcional`,
          chatId
        );
        return res.sendStatus(200);
      }

      const [title, date, time, categoryRaw, descriptionRaw] = args;
      if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
        await sendTelegramMessage("⚠️ Datos inválidos para el evento.", chatId);
        return res.sendStatus(200);
      }

      const category = VALID_CATEGORIES.includes(categoryRaw?.toLowerCase()) ? categoryRaw.toLowerCase() : 'otro';
      const description = descriptionRaw || null;

      const user = await userRepo.findOne({ where: { chat_id: chatId } });
      if (!user || !user.token) {
        await sendTelegramMessage(
          '⚠️ No se encontró tu usuario o tu token expiró. Por favor envía /start para registrarte.',
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
      await sendTelegramMessage(
        `🗓️ Evento creado correctamente!\n\n<b>${title} ${emoji}</b>\n• Fecha: ${date}\n• Hora: ${time}\n${description ? `• Descripción: ${description}\n` : ""}• Categoría: ${category}`,
        chatId,
        "HTML"
      );
      return res.sendStatus(200);
    }

    // --- /crear Web App ---
    if (text?.toLowerCase() === "/crear") {
      const WEBAPP_URL = "https://rimaindernode.onrender.com/form-evento.html";

      await sendTelegramMessage(
        "📝 Tocá el botón de abajo para crear un nuevo evento:",
        chatId,
        undefined,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🗓️ Crear evento", web_app: { url: WEBAPP_URL } }],
            ],
          },
        }
      );
      return res.sendStatus(200);
    }

    // --- Datos desde WebApp ---
    if (body?.message?.web_app_data) {
      try {
        const dataWeb = JSON.parse(body.message.web_app_data.data);
        const { title, date, time, category, description } = dataWeb;

        const user = await userRepo.findOne({ where: { chat_id: chatId } });
        if (!user || !user.token) {
          await sendTelegramMessage(
            "⚠️ No se encontró tu usuario o tu token expiró. Enviá /start para registrarte.",
            chatId
          );
          return res.sendStatus(200);
        }

        if (!title || !date || !time) {
          await sendTelegramMessage("⚠️ Faltan datos obligatorios.", chatId);
          return res.sendStatus(200);
        }

        const cat = VALID_CATEGORIES.includes(category?.toLowerCase()) ? category.toLowerCase() : "otro";

        // POST al backend usando JWT desde la DB
        const resApi = await fetch(`${API_BASE_URL}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ title, date, time, category: cat, description }),
        });

        if (!resApi.ok) {
          const errData = await resApi.json().catch(() => ({}));
          throw new Error(errData.message || "Error creando evento en API");
        }

        const { event } = await resApi.json();
        const emoji = CATEGORY_EMOJI[cat] || "📌";
        await sendTelegramMessage(
          `✅ Evento guardado correctamente!\n\n<b>${event.title} ${emoji}</b>\n📅 ${event.date} ${event.time}\n📂 ${cat}`,
          chatId,
          "HTML"
        );

        return res.sendStatus(200);
      } catch (error) {
        console.error("Error procesando web_app_data:", error);
        await sendTelegramMessage("⚠️ Ocurrió un error al guardar el evento.", chatId);
        return res.sendStatus(200);
      }
    }

  } catch (err) {
    console.error("Error processing Telegram webhook:", err);
    await sendTelegramMessage(`⚠️ Error: ${err.message}`, chatId);
    return res.sendStatus(200);
  }
});

export default router;
