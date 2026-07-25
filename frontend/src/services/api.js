const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

/**
 * Sends a symptom description to the PumpSense diagnostic API and returns
 * the structured result.
 *
 * @param {string} symptom            - Plain-text symptom description from the technician
 * @param {'en'|'es'} [language='en'] - Language for the diagnostic response values
 * @returns {Promise<{ symptom: string, cause: string, action: string, confidence: 'high'|'medium'|'low' }>}
 * @throws {Error} On network failure or non-2xx HTTP response
 */
export async function diagnose(symptom, language = 'en') {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptom, language }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed (${response.status})`);
  }

  return response.json();
}
