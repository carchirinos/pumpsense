const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Creates a new case from a diagnostic result.
 *
 * @param {{ symptom: string, cause: string, action: string, confidence: string, language?: string }} payload
 * @returns {Promise<object>} The created case including id, status, createdAt
 * @throws {Error} On network failure or non-2xx HTTP response
 */
export async function createCase(payload) {
  const response = await fetch(`${BASE_URL}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed (${response.status})`);
  }

  return response.json();
}

/**
 * Retrieves all cases, sorted by createdAt descending (newest first).
 *
 * @returns {Promise<object[]>} Array of case objects
 * @throws {Error} On network failure or non-2xx HTTP response
 */
export async function getCases() {
  const response = await fetch(`${BASE_URL}/cases`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed (${response.status})`);
  }

  return response.json();
}

/**
 * Updates a case's status (resolve or cancel).
 *
 * @param {string} id - Case ID
 * @param {{ status: string, resolutionNote: string, technicianName: string }} payload
 * @returns {Promise<object>} The updated case object
 * @throws {Error} On network failure or non-2xx HTTP response
 */
export async function updateCase(id, payload) {
  const response = await fetch(`${BASE_URL}/cases/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed (${response.status})`);
  }

  return response.json();
}
