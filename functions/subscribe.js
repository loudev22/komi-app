// netlify/functions/subscribe.js
// Guarda la suscripción push del usuario en Supabase

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let subscription;
  try {
    const body = JSON.parse(event.body);
    subscription = body.subscription;
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!subscription?.endpoint) {
    return { statusCode: 400, body: 'Invalid subscription' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  // Upsert — si ya existe el endpoint, no duplicar
  const res = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=ignore-duplicates'
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      subscription: JSON.stringify(subscription)
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Supabase error:', err);
    return { statusCode: 500, body: 'Failed to save subscription' };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
};
