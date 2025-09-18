// src/module/event/schema/event.schema.js
import joi from 'joi';

const allowedCategories = ['cumpleaños', 'examen', 'deportes', 'trabajo', 'medico', 'viaje', 'otro'];


export const createEventSchema = joi.object({
  title: joi.string().max(120).required(),
  // 'date' en formato YYYY-MM-DD
  date: joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  // 'time' en formato HH:MM (24h)
  time: joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    category: joi.string().valid(...allowedCategories).optional(),
    description: joi.string().max(300).allow('', null).optional(),
});

export const updateEventSchema = joi.object({
  title: joi.string().max(120),
  date: joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  time: joi.string().pattern(/^\d{2}:\d{2}$/),
  category: joi.string().valid(...allowedCategories),
   description: joi.string().max(300).allow('', null), 
}).min(1);
