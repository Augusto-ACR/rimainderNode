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

function normalizeCommand(text = "") {
  const first = text.split(/\s+/)[0] || "";
  return first.split('@')[0].toLowerCase();
}

router.post(`/bot${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const body = req.body;
  console.log("Webhook received:", JSON.stringify(body, null, 2));

  // Acknowledge quickly if no message
  if (!body?.message) return res.sendStatus(200);

  // Obtener repositorios (después de inicializar AppDatasource)
  let userRepo, eventRepo;
  try {
    userRepo = AppDatasource.getRepository(User);
    eventRepo = AppDatasource.getRepository(Event);
  } catch (err) {
    console.error('TypeORM repos not available yet:', err);
    return res.sendStatus(200);
  }

  const msg = body.message;
  const chatId = msg.chat?.id;
  const textRaw = (msg.text || "").trim();
  const command = normalizeCommand(textRaw);

  try {
    // --- /start ---
    if (command === "/start") {
      const telegramUsername = msg.from?.username || `tg_${chatId}`;

      const resp = await fetch(`${API_BASE_URL}/auth/register-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: chatId, username: telegramUsername }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        console.error("register-telegram error:", resp.status, data);
        try { await sendTelegramMessage("⚠️ Error en el servicio, intentá más tarde.", chatId); } catch(e){console.error('sendTelegramMessage failed', e);}
        return res.sendStatus(200);
      }

      // Upsert local DB
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

      // Mensaje según respuesta del backend
      try {
        if (data.password && data.password !== "Ya creada") {
          // Cuenta creada y backend devolvió contraseña
          await sendTelegramMessage(
            `✅ Hola ${data.username}!\nTu cuenta fue creada automáticamente.\n\nID de usuario: ${data.id || user.id}\nContraseña: ${data.password}\n\nUsá estos datos para iniciar sesión o para cambiar la contraseña.`,
            chatId
          );
        } else {
          // Cuenta existente
          await sendTelegramMessage(
            `👋 Hola ${data.username || user.username}!\nYa tenés una cuenta registrada.\nID de usuario: ${data.id || user.id}\nSi querés cambiar la contraseña usá la opción de recuperación en la web.`,
            chatId
          );
        }
      } catch (err) {
        console.error('sendTelegramMessage error on /start welcome:', err);
      }

      return res.sendStatus(200);
    }

    // --- /evento Título, YYYY-MM-DD, HH:MM, Categoría opcional, Descripción opcional
    if (command === "/evento") {
      const argsText = textRaw.replace(/^\/\S+\s*/i, ""); // todo después del comando
      const parts = argsText.split(",").map(s => s.trim()).filter(Boolean);
      if (parts.length < 3) {
        await sendTelegramMessage(
          `⚠️ Formato inválido. Usar:\n/evento Título, YYYY-MM-DD, HH:MM, categoría(opc), descripción(opc)`,
          chatId
        ).catch(()=>{});
        return res.sendStatus(200);
      }

      const [title, date, time, categoryRaw = "otro", description = null] = parts;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
        await sendTelegramMessage("⚠️ Fecha u hora en formato inválido.", chatId).catch(()=>{});
        return res.sendStatus(200);
      }

      const user = await userRepo.findOne({ where: { chat_id: chatId } });
      if (!user || !user.token) {
        await sendTelegramMessage('⚠️ No se encontró tu usuario. Enviá /start para registrarte.', chatId).catch(()=>{});
        return res.sendStatus(200);
      }

      // Llamada a API para crear evento usando token del usuario
      try {
        const resApi = await fetch(`${API_BASE_URL}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`,
          },
          body: JSON.stringify({ title, date, time, category: categoryRaw, description }),
        });

        if (!resApi.ok) {
          const errData = await resApi.json().catch(()=>({}));
          await sendTelegramMessage(`⚠️ Error creando evento: ${errData.message || resApi.status}`, chatId).catch(()=>{});
          return res.sendStatus(200);
        }

        const { event } = await resApi.json().catch(()=>({}));
        const emoji = CATEGORY_EMOJI[categoryRaw] || "📌";
        await sendTelegramMessage(
          `✅ Evento creado!\n\n<b>${event?.title || title} ${emoji}</b>\n📅 ${date} • ⏰ ${time}`,
          chatId,
          "HTML"
        ).catch(()=>{});

      } catch (err) {
        console.error("Error creating event via API:", err);
        await sendTelegramMessage("⚠️ Error al crear evento. Intentá más tarde.", chatId).catch(()=>{});
      }

      return res.sendStatus(200);
    }

    // --- /crear -> enviar botón WebApp
    if (command === "/crear") {
      const WEBAPP_URL = `${API_BASE_URL}/form-evento.html`;
      try {
        await sendTelegramMessage(
          "📝 Tocá el botón para crear un evento:",
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
      } catch (err) {
        console.error('sendTelegramMessage error on /crear:', err);
      }
      return res.sendStatus(200);
    }

    // --- web_app_data (datos enviados desde la WebApp)
    if (body.message?.web_app_data) {
      try {
        const dataWeb = JSON.parse(body.message.web_app_data.data);
        const { title, date, time, category = "otro", description = null } = dataWeb;

        const user = await userRepo.findOne({ where: { chat_id: chatId } });
        if (!user || !user.token) {
          await sendTelegramMessage("⚠️ No se encontró tu usuario. Enviá /start para registrarte.", chatId).catch(()=>{});
          return res.sendStatus(200);
        }

        const resApi = await fetch(`${API_BASE_URL}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`,
          },
          body: JSON.stringify({ title, date, time, category, description }),
        });

        if (!resApi.ok) {
          const errData = await resApi.json().catch(()=>({}));
          await sendTelegramMessage(`⚠️ Error guardando evento: ${errData.message || resApi.status}`, chatId).catch(()=>{});
          return res.sendStatus(200);
        }

        const { event } = await resApi.json().catch(()=>({}));
        const emoji = CATEGORY_EMOJI[category] || "📌";
        await sendTelegramMessage(
          `✅ Evento guardado!\n<b>${event?.title || title} ${emoji}</b>\n📅 ${date} • ⏰ ${time}`,
          chatId,
          "HTML"
        ).catch(()=>{});
      } catch (err) {
        console.error("Error processing web_app_data:", err);
        await sendTelegramMessage("⚠️ Ocurrió un error al guardar el evento.", chatId).catch(()=>{});
      }
      return res.sendStatus(200);
    }

    // --- Si no matchea ninguna ruta: enviar mensaje de ayuda (opcional)
    // Evitar que Telegram reintente: siempre responder 200
    return res.sendStatus(200);

  } catch (err) {
    console.error("Error processing Telegram webhook:", err);
    try { if (chatId) await sendTelegramMessage(`⚠️ Error interno: ${err.message}`, chatId); } catch(e){console.error('sendTelegramMessage failed', e); }
    return res.sendStatus(200);
  }
});

export default router;