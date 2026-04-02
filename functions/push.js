// netlify/functions/push.js
// Envía push notifications a todas las suscripciones guardadas en Supabase

const webpush = require('web-push');

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:komi@komi-app.netlify.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

exports.handler = async (event) => {
  // Obtener el mensaje según la hora (lo pasa el scheduler, o usar default)
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch {}

  const { title = '🍽️ Komi', message } = body;

  // Determinar mensaje según hora de México (UTC-6)
  const hourMX = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' })).getHours();
  const defaultMessage = hourMX < 14
    ? '¿Ya comiste? Registra tu comida en Komi y mantén tu balance del día.'
    : 'Hora de revisar tu día. ¿Qué comiste hoy? Abre Komi y anótalo.';

  const payload = JSON.stringify({
    title,
    body: message || defaultMessage,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    url: '/'
  });

  // Obtener suscripciones de Supabase
  const res = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=subscription`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  const rows = await res.json();
  if (!rows || rows.length === 0) {
    return { statusCode: 200, body: 'No subscriptions found' };
  }

  // Enviar a cada suscripción
  const results = await Promise.allSettled(
    rows.map(row => {
      const sub = typeof row.subscription === 'string'
        ? JSON.parse(row.subscription)
        : row.subscription;
      return webpush.sendNotification(sub, payload);
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Push sent: ${sent}, failed: ${failed}`);
  return {
    statusCode: 200,
    body: JSON.stringify({ sent, failed })
  };
};
