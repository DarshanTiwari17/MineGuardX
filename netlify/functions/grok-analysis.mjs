const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { detail: 'Method not allowed.' });
  }

  const apiKey = process.env.GROK_API_KEY?.trim();
  if (!apiKey) {
    return jsonResponse(503, {
      detail: 'Backup analysis is not configured. Please contact support.',
    });
  }

  if (!event.body || event.body.length > 64 * 1024) {
    return jsonResponse(400, { detail: 'Request body is missing or too large.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return jsonResponse(400, { detail: 'Request body must be valid JSON.' });
  }

  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    return jsonResponse(400, { detail: 'A non-empty messages array is required.' });
  }

  try {
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        model: process.env.GROK_MODEL?.trim() || 'grok-4.7',
      }),
      signal: AbortSignal.timeout(25_000),
    });

    const responseText = await grokResponse.text();
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = {};
    }

    if (!grokResponse.ok) {
      const upstreamError = responseBody.error;
      const upstreamMessage = typeof upstreamError === 'string'
        ? upstreamError
        : upstreamError?.message || responseBody.message || 'No additional details.';
      console.error('Backup analysis upstream request failed.', {
        status: grokResponse.status,
        message: String(upstreamMessage).slice(0, 500),
      });
      return jsonResponse(502, {
        detail: 'Backup analysis could not be completed. Please try again later.',
      });
    }

    return jsonResponse(200, responseBody);
  } catch (error) {
    console.error('Backup analysis request failed.', error);
    const detail = error instanceof Error && error.name === 'TimeoutError'
      ? 'Backup analysis took too long. Please try again.'
      : 'Backup analysis is unavailable. Please try again later.';
    return jsonResponse(502, { detail });
  }
};