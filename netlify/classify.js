exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const body = JSON.parse(event.body);
    const food = body.food;
    if (!food) return { statusCode: 400, body: 'Missing food' };
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: 'Classify the food into groups: Proteina, Verdura, Carbohidrato, Leguminosa, Lacteo, Fruta, Otro. Reply ONLY with valid JSON: {"groups":["Proteina"]}',
        messages: [{ role: 'user', content: food }]
      })
    });
    const data = await r.json();
    const text = (data.content || []).map(function(c) { return c.text || ''; }).join('').trim();
    const parsed = JSON.parse(text);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'error' }) };
  }
};
