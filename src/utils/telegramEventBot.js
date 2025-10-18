// ./src/utils/telegramEventBot.js
import express from 'express';
import AppDatasource from '../module/user/providers/datasource.provider.js';
import { Event } from '../module/user/entities/event.entity.js';
import { User } from '../module/user/entities/user.entity.js';
import { sendTelegramMessage } from './telegram.js';

const router = express.Router();
const eventRepo = AppDatasource.getRepository(Event);
const userRepo = AppDatasource.getRepository(User);

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

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Webhook para mensajes de eventos
router.post(`/bot${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const body = req.body;

  if (!body?.message?.text) return res.sendStatus(200);

  const msg = body.message;
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // Procesamos solo comandos /evento
  if (text.toLowerCase().startsWith('/evento')) {
    try {
      const args = text.replace('/evento', '').split(',').map(s => s.trim());
      console.log('Args parseados:', args);

      if (args.length < 3) {
        await sendTelegramMessage(
          `⚠️ Formato inválido. Debe ser:\n` +
          `/evento Título, YYYY-MM-DD, HH:MM, Categoría opcional, Descripción opcional`,
          chatId
        );
        return res.sendStatus(200);
      }

      const [title, date, time, categoryRaw, descriptionRaw] = args;

      // Validaciones básicas
      if (!title) throw new Error('El título es obligatorio');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Fecha inválida, usar YYYY-MM-DD');
      if (!/^\d{2}:\d{2}$/.test(time)) throw new Error('Hora inválida, usar HH:MM');

      const category = VALID_CATEGORIES.includes(categoryRaw?.toLowerCase())
        ? categoryRaw.toLowerCase()
        : 'otro';
      const description = descriptionRaw || null;

      // Obtenemos usuario
      const user = await userRepo.findOne({ where: { chat_id: chatId } });
      if (!user) {
        await sendTelegramMessage(
          '⚠️ No se encontró tu usuario. Por favor envía /start primero para registrarte.',
          chatId
        );
        return res.sendStatus(200);
      }

      // Crear evento
      const [y, m, d] = date.split('-').map(Number);
      const ev = eventRepo.create({
        title,
        date,
        time,
        year: y,
        month: m,
        day: d,
        category,
        description,
        user: { id: user.id }
      });
      await eventRepo.save(ev);

      // Enviar confirmación
      const emoji = CATEGORY_EMOJI[category] || '📌';
      const mensaje =
        `🗓️ Evento creado correctamente!\n\n` +
        `<b>${title} ${emoji}</b>\n` +
        `• Fecha: ${date}\n` +
        `• Hora: ${time}\n` +
        (description ? `• Descripción: ${description}\n` : '') +
        `• Categoría: ${category}`;

      await sendTelegramMessage(mensaje, chatId);

      return res.sendStatus(200);
    } catch (err) {
      console.error('Error creando evento desde Telegram:', err);
      await sendTelegramMessage(
        `⚠️ No se pudo crear el evento: ${err.message}`,
        chatId
      );
      return res.sendStatus(200);
    }
  } else {
    // Otros mensajes ignorados
    return res.sendStatus(200);
  }
});

export default router;
