import joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE: joi.string().required(),
    DB_PORT: joi.number().required(),
    DB_USER: joi.string().required(),
    DB_PASS: joi.string().allow('').optional(),
    DB_HOST: joi.string().required(),
    NODE_ENV: joi.string().required(),
    TELEGRAM_BOT_TOKEN: joi.string().required(),
    TELEGRAM_CHAT_ID: joi.string().required(),
  })
  .unknown(true);

const { value, error } = envsSchema.validate(process.env);

if (error) throw new Error(error.message);

export const envs = {
  PORT: value.PORT,
  DATABASE: value.DATABASE,
  DB_PORT: value.DB_PORT,
  DB_USER: value.DB_USER,
  DB_PASS: value.DB_PASS,
  DB_HOST: value.DB_HOST,
  NODE_ENV: value.NODE_ENV,
  TELEGRAM_BOT_TOKEN: value.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: value.TELEGRAM_CHAT_ID,
};
