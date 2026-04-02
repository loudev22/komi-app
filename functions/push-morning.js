// netlify/functions/push-morning.js
// Se ejecuta automáticamente a las 10:00am hora México (16:00 UTC)

const { schedule } = require('@netlify/functions');

const handler = async () => {
  try {
    // Llamar a la función push con el mensaje de mañana
    const baseUrl = process.env.URL || 'https://komi-app.netlify.app';
    await fetch(`${baseUrl}/.netlify/functions/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🍽️ Komi',
        message: '¿Ya comiste? Registra tu comida en Komi y mantén tu balance del día.'
      })
    });
    return { statusCode: 200 };
  } catch (err) {
    console.error('push-morning error:', err);
    return { statusCode: 500 };
  }
};

// 10:00am México = 16:00 UTC
exports.handler = schedule('0 16 * * *', handler);
