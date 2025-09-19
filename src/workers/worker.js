// src/workers/worker.js
import 'reflect-metadata';
import AppDatasource from '../module/user/providers/datasource.provider.js';
import { Event } from '../module/user/entities/event.entity.js';
import { User } from '../module/user/entities/user.entity.js';
import { sendTelegramMessage } from '../utils/telegram.js';
import cron from 'node-cron';

const CATEGORY_EMOJI = {
  'cumpleaños': '🎂',
  'examen': '📝',
  'deportes': '🏅',
  'trabajo': '💼',
  'medico': '🩺',
  'viaje': '✈️',
  'otro': '📌',
};

const startWorker = async () => {
  try {
    await AppDatasource.initialize();
    const eventRepo = AppDatasource.getRepository(Event);
    const userRepo = AppDatasource.getRepository(User);

    console.log('Worker de recordatorios iniciado');

    cron.schedule('* * * * *', async () => {
      const nowUTC = new Date(); // hora actual en UTC

      const events = await eventRepo.find({ relations: ['user'] });

      for (const ev of events) {
        if (!ev.user?.chat_id) continue;

        // Parseamos fecha y hora como UTC
        const [year, month, day] = ev.date.split('-').map(Number);
        const [hours, minutes] = ev.time.split(':').map(Number);
        const eventDateUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes));

        // Ignoramos eventos que ya pasaron
        if (eventDateUTC.getTime() < nowUTC.getTime()) continue;

        const reminders = [
          { minutesBefore: 1440, key: 'remind1d', text: 'Falta 1 día' },
          { minutesBefore: 60, key: 'remind1h', text: 'Falta 1 hora' },
          { minutesBefore: 30, key: 'remind30m', text: 'Faltan 30 minutos' },
        ];

        for (const r of reminders) {
          const triggerTime = new Date(eventDateUTC.getTime() - r.minutesBefore * 60000);

          if (nowUTC >= triggerTime && !ev[r.key]) {
            const emoji = CATEGORY_EMOJI[ev.category] || '📌';

            // Convertimos a hora de Argentina solo para mostrar
            const eventTimeArg = eventDateUTC.toLocaleTimeString('es-AR', {
              timeZone: 'America/Argentina/Buenos_Aires',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });

            const mensaje = `⏰ Recordatorio: ${ev.title} ${emoji} \n ${r.text}`;

            try {
              await sendTelegramMessage(mensaje, ev.user.chat_id, 'HTML');
              console.log(`Recordatorio enviado: ${ev.title} - ${r.text}`);
            } catch (err) {
              console.error(`Error enviando Telegram para evento ${ev.title}:`, err.message);
            }

            // Marcamos el recordatorio como enviado
            ev[r.key] = true;
            await eventRepo.save(ev);
          }
        }
      }
    });
  } catch (err) {
    console.error('Error inicializando worker:', err.message);
  }
};

startWorker();
