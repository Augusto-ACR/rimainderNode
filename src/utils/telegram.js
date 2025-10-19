// ./src/utils/telegram.js
import { envs } from '../configuration/envs.js';

export async function sendTelegramMessage(text, chatId, parseMode = 'HTML', extra = {}) {
  if (!chatId) throw new Error('sendTelegramMessage: chatId no definido');
  const token = envs.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no definido en envs');

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: String(chatId),
    text: String(text),
    parse_mode: parseMode,
    ...extra,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    const msg = data?.description || `HTTP ${res.status}`;
    throw new Error(`Telegram error: ${msg}`);
  }
  return data;
}