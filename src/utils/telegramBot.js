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

// --- /crear: mostrar botón Web App ---
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

// --- web_app_data: enviar datos a tu API ---
if (body?.message?.web_app_data) {
  try {
    const data = JSON.parse(body.message.web_app_data.data);
    console.log("Datos recibidos desde WebApp:", data);

    const user = await userRepo.findOne({ where: { chat_id: chatId } });
    if (!user) {
      await sendTelegramMessage(
        "⚠️ No se encontró tu usuario. Enviá /start primero para registrarte.",
        chatId
      );
      return res.sendStatus(200);
    }

    const { title, date, time, category, description } = data;
    if (!title || !date || !time) {
      await sendTelegramMessage("⚠️ Faltan datos obligatorios.", chatId);
      return res.sendStatus(200);
    }

    const cat = VALID_CATEGORIES.includes(category?.toLowerCase())
      ? category.toLowerCase()
      : "otro";

    // --- Enviar al API REST con token del usuario ---
    const payload = { title, date, time, category: cat };
    if (description) payload.description = description;

    const resApi = await fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`, // <-- el JWT de tu usuario
      },
      body: JSON.stringify(payload),
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
