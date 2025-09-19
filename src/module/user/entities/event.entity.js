// src/module/event/entities/event.entity.js
import { EntitySchema } from 'typeorm';

export const Event = new EntitySchema({
  name: 'Event',
  tableName: 'events',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    title: { type: String, length: 120 },
    // Fecha del evento (solo día, sin hora)
    date: { type: 'date' },
    // Hora en formato HH:MM (guardamos como string simple)
    time: { type: String, length: 5 },
    // opcional: para filtros rápidos sin funciones
    year: { type: Number },
    month: { type: Number }, // 1-12
    day: { type: Number },   // 1-31
    category: { type: String, length: 30, nullable: true },
    description:{ type: String, length: 300, nullable: true },
    created_at: { type: 'timestamp', createDate: true },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: true,
      nullable: true, // déjalo nullable hasta que agregues auth
      onDelete: 'SET NULL',
    },
  },
  indices: [
    { name: 'IDX_EVENTS_YM', columns: ['year','month'] },
    { name: 'IDX_EVENTS_DATE', columns: ['date'] },
  ],
});
