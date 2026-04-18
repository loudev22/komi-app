exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let food;
  try {
    const body = JSON.parse(event.body);
    food = body.food;
  } catch (e) {
    return { statusCode: 400, body: 'Bad Request' };
  }

  if (!food || typeof food !== 'string') {
    return { statusCode: 400, body: 'Missing food field' };
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
        system: 'Eres un nutriologo. Clasifica el alimento en uno o mas de estos grupos: Proteina, Verdura, Carbohidrato, Leguminosa, Lacteo, Fruta, Otro. Responde SOLO con JSON valido: {"groups":["Proteina"]}. Sin acentos en los valores del JSON. El usuario es mexicano.',
        messages: [{ role: 'user', content: food }]
      })
    });

    const data = await response.json();
    const text = (data.content || []).map(c => c.text || '').join('').trim();
    const parsed = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    console.error('classify error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Claude API error' })
    };
  }
};
