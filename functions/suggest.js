// netlify/functions/suggest.js
// Proxy para sugerencias de comida con Claude API
// La API key vive aquí como variable de entorno — nunca se expone al cliente

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Bad Request — invalid JSON' };
  }

  const { history, groupCounts } = body;
  if (!history || !groupCounts) {
    return { statusCode: 400, body: 'Bad Request — missing fields' };
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
        max_tokens: 1000,
        system: `Eres un nutriólogo mexicano experto. Analiza el historial de comidas y sugiere UNA comida balanceada para hoy.
Responde SOLO con JSON válido, sin texto adicional, sin backticks:
{
  "nombre": "Nombre del platillo",
  "razon": "Por qué es bueno hoy (máx 2 oraciones, menciona qué grupos faltan)",
  "ingredientes": ["ingrediente 1", "ingrediente 2", ...],
  "pasos": ["paso 1", "paso 2", ...],
  "grupos": ["Grupo1", "Grupo2"]
}
Usa ingredientes accesibles en México. Receta práctica, máx 5 pasos.`,
        messages: [{
          role: 'user',
          content: `Mi historial reciente:\n${history}\n\nGrupos consumidos (últimas 2 semanas): ${JSON.stringify(groupCounts)}\n\n¿Qué me recomiendas comer hoy?`
        }]
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
    console.error('suggest error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Claude API error' }) };
  }
};
