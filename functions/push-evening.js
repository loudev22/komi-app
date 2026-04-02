// netlify/functions/push-evening.js
// Se ejecuta automáticamente a las 5:00pm hora México (23:00 UTC)

const { schedule } = require('@netlify/functions');

const handler = async () => {
  try {
    const baseUrl = process.env.URL || 'https://komi-app.netlify.app';
    await fetch(`${baseUrl}/.netlify/functions/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🥗 Komi',
        message: 'Hora de revisar tu día. ¿Qué comiste hoy? Abre Komi y anótalo.'
      })
    });
    return { statusCode: 200 };
  } catch (err) {
    console.error('push-evening error:', err);
    return { statusCode: 500 };
  }
};

// 5:00pm México = 23:00 UTC
exports.handler = schedule('0 23 * * *', handler);
