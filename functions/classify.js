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
        system: `Eres un nutriólogo experto en cocina mexicana. Tu tarea es clasificar una comida en uno o más grupos nutricionales.

Grupos disponibles: Proteína, Verdura, Carbohidrato, Leguminosa, Lácteo, Fruta, Otro.

Reglas importantes:
- Si la comida tiene múltiples ingredientes, identifica TODOS los grupos presentes.
- NUNCA respondas solo con "Otro" si puedes identificar ingredientes específicos.
- "Otro" solo se usa cuando realmente no encaja en ningún otro grupo.
- Considera ingredientes típicos mexicanos: tortilla = Carbohidrato, frijoles = Leguminosa, queso = Lácteo, carne/huevo/jamón/atún = Proteína, verduras/chile/jitomate/cebolla/aguacate = Verdura.
- Una torta siempre incluye Carbohidrato (el pan).

Responde SOLO con JSON válido: {"groups":["Proteína","Carbohidrato"]}

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
