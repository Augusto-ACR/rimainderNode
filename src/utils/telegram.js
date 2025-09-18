import { envs } from '../configuration/envs.js';

export async function sendTelegramMessage(text, chatId) {
  const url = `https://api.telegram.org/bot${envs.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const params = new URLSearchParams({
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    const msg = data?.description || `HTTP ${res.status}`;
    throw new Error(`Telegram error: ${msg}`);
  }
  return data;
}