// src/module/event/controllers/event.controller.js (filtrado por usuario)
import { request, response } from 'express';
import AppDatasource from '../../user/providers/datasource.provider.js';
import { Event } from '../entities/event.entity.js';
import { createEventSchema, updateEventSchema } from '../schema/event.schema.js';
import { sendTelegramMessage } from '../../../utils/telegram.js';
import { User } from '../../user/entities/user.entity.js';   


const repo = AppDatasource.getRepository(Event);
const userRepo = AppDatasource.getRepository(User);

const CATEGORY_EMOJI = {
  'cumpleaños': '🎂',
  'examen': '📝',
  'deportes': '🏅',
  'trabajo': '💼',
  'medico': '🩺',
  'viaje': '✈️',
  'otro': '📌',
};

// GET /events?year=YYYY&month=MM  -> eventos del mes DEL USUARIO
export const listByMonth = async (req = request, res = response) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!year || !month) return res.status(400).json({ message: 'year y month son requeridos' });
    if (!req.user?.id) return res.status(401).json({ message: 'No autenticado' });

    const events = await repo.find({
      where: { year, month, user: { id: req.user.id } },
      order: { day: 'ASC', time: 'ASC' }
    });
    return res.json({ events });
  } catch (err) {
    return res.status(500).json({ message: 'Error listando eventos', error: String(err) });
  }
};

// POST /events  { title, date: YYYY-MM-DD, time: HH:MM }
export const createEvent = async (req = request, res = response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'No autenticado' });
    const { error, value } = createEventSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

  const { title, date, time, category, description } = value; 
    
    const [y, m, d] = date.split('-').map(Number);

    const ev = repo.create({ title, date, time, year: y, month: m, day: d, category: category || 'otro', description: description || null,   user: { id: req.user.id } });
    await repo.save(ev);
    try {
      const owner = await userRepo.findOne({ where: { id: req.user.id } });
      if (owner?.chat_id) {
        // Formatear fecha a dd-mm-YYYY
        const [yyyy, mm, dd] = date.split('-');
        const fecha = `${dd}-${mm}-${yyyy}`;
        const emoji = CATEGORY_EMOJI[ev.category] || '📌';
        const lineaComentario = ev.description ? `• ${ev.description}` : "";
        
        const mensaje =
  `🗓️ Nuevo evento creado ✨\n \n` +
  `<b>  ${title} ${emoji}</b> \n ` +
  `• Fecha: ${fecha}\n ` +
  `• Hora: ${time}\n ` +
  `${lineaComentario}`.trim(); // quita salto si no hay comentario

await sendTelegramMessage(mensaje, owner.chat_id, 'HTML');
      }
    } catch (e) {
      console.warn('No se pudo enviar Telegram:', e.message);
      // no rompemos la respuesta al cliente si falló Telegram
    }
    return res.status(201).json({ message: 'Evento creado', event: ev });
  } catch (err) {
    return res.status(500).json({ message: 'Error creando evento', error: String(err) });
  }
};

// PUT /events/:id  -> sólo si pertenece al usuario
export const updateEvent = async (req = request, res = response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'No autenticado' });
    const id = Number(req.params.id);
    const { error, value } = updateEventSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const ev = await repo.findOne({ where: { id }, relations: ['user'] });
    if (!ev || ev.user?.id !== req.user.id) return res.status(404).json({ message: 'Evento no encontrado' });

    if (value.date) {
      const [y, m, d] = value.date.split('-').map(Number);
      ev.year = y; ev.month = m; ev.day = d;
      ev.date = value.date;
    }
    if (value.title) ev.title = value.title;
    if (value.time) ev.time = value.time;

    await repo.save(ev);
    return res.json({ message: 'Evento actualizado', event: ev });
  } catch (err) {
    return res.status(500).json({ message: 'Error actualizando evento', error: String(err) });
  }
};

// DELETE /events/:id -> sólo si pertenece al usuario
export const deleteEvent = async (req = request, res = response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'No autenticado' });

    const id = Number(req.params.id);
    const ev = await repo.findOne({ where: { id }, relations: ['user'] });

    if (!ev || ev.user?.id !== req.user.id)
      return res.status(404).json({ message: 'Evento no encontrado' });

    // Guardamos el título antes de eliminar
    const titulo = ev.title;

    // Eliminamos el evento
    await repo.remove(ev);

    // Enviar mensaje a Telegram
    try {
        const owner = await userRepo.findOne({ where: { id: req.user.id } });

           const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const time = `${hours}:${minutes}`;

                const mensaje =
  `🗓️ Evento resuelto ✨\n \n` +
  `<b>  ${titulo} </b> Fue resuelto por ${req.user.username}\n ` +
  `• Hora: ${time}\n `.trim(); // quita salto si no hay comentario

      await sendTelegramMessage(mensaje,owner.chat_id, 'HTML');
    } catch (err) {
      console.error("Error enviando Telegram:", err);
    }

    return res.json({ message: `El evento "${titulo}" fue resuelto y eliminado` });
  } catch (err) {
    return res.status(500).json({ message: 'Error eliminando evento', error: String(err) });
  }
};