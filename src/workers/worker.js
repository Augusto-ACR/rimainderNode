import 'reflect-metadata';
import AppDatasource from '../module/user/providers/datasource.provider.js';
import { Event } from '../module/event/entities/event.entity.js';
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
  await AppDatasource.initialize();
  const eventRepo = AppDatasource.getRepository(Event);
  const userRepo = AppDatasource.getRepository(User);

  cron.schedule('* * * * *', async () => { // ejecuta cada minuto
    const now = new Date();

    const events = await eventRepo.find({ relations: ['user'] });

    for (const ev of events) {
      if (!ev.user?.chat_id) continue;

      // Convertimos fecha y hora del evento a objeto Date
      const [year, month, day] = ev.date.split('-').map(Number);
      const [hours, minutes] = ev.time.split(':').map(Number);

      // Fecha del evento en Argentina (UTC-3)
      const eventDateTime = new Date(Date.UTC(year, month - 1, day, hours - 3, minutes));

      // Solo consideramos eventos futuros
      if (eventDateTime < now) continue;

      const reminders = [
        { minutesBefore: 1440, key: 'remind1d', text: '1 día antes' },
        { minutesBefore: 60, key: 'remind1h', text: '1 hora antes' },
        { minutesBefore: 30, key: 'remind30m', text: '30 minutos antes' },
      ];

      for (const r of reminders) {
        const triggerTime = new Date(eventDateTime.getTime() - r.minutesBefore * 60000);

        if (now >= triggerTime && !ev[r.key]) {
          const emoji = CATEGORY_EMOJI[ev.category] || '📌';

          // Hora del evento en Argentina para mostrar en el mensaje
          const eventTimeArg = eventDateTime.toLocaleTimeString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });

          const mensaje = `⏰ Recordatorio: ${ev.title} ${emoji} - ${r.text}\nHora: ${eventTimeArg}`;
          await sendTelegramMessage(mensaje, ev.user.chat_id, 'HTML');

          // Marcamos el recordatorio como enviado
          ev[r.key] = true;
          await eventRepo.save(ev);
        }
      }
    }
  });

  console.log('Worker de recordatorios iniciado');
};

startWorker();
