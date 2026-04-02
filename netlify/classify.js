// netlify/functions/classify.js
// Proxy para clasificación de grupos nutricionales con Claude API
// La API key vive aquí como variable de entorno — nunca se expone al cliente

exports.handler = async (event) => {
  // Solo aceptar POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Bad Request — invalid JSON' };
  }

  const { food } = body;
  if (!food || typeof food !== 'string') {
    return { statusCode: 400, body: 'Bad Request — missing "food" field' };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: `Eres un nutriólogo. Clasifica el alimento descrito en uno o más de estos grupos:
Proteína, Verdura, Carbohidrato, Leguminosa, Lácteo, Fruta, Otro.
Responde SOLO con JSON: {"groups":["Proteína","Carbohidrato"]}
El usuario es mexicano, considera alimentos tradicionales mexicanos.`,
        messages: [{ role: 'user', content: food }]
      })
    });

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('') || '';
    const parsed = JSON.parse(text.trim());

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    console.error('classify error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Claude API error' }) };
  }
};
