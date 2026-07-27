import { buildPrompt } from './prompt.js';
import { invokeClaude } from './bedrockClient.js';
import { parseResponse } from './responseParser.js';
import { createCase, getCases, updateCase, findSimilarCases } from './cases.js';

/**
 * CORS headers included on every response — success and error alike —
 * so the browser never blocks a response due to a missing header.
 */
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
};

/**
 * Builds a well-formed API Gateway response object.
 *
 * @param {number} statusCode
 * @param {object} body
 * @returns {{ statusCode: number, headers: object, body: string }}
 */
function response(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

// ─── Route: POST /diagnose ────────────────────────────────────────────────────

/**
 * Validates and extracts the symptom string and optional language from the
 * API Gateway event.
 *
 * @param {object} event - Raw API Gateway event
 * @returns {{ symptom: string, language: string }|{ errorResponse: object }}
 */
function extractInput(event) {
  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { errorResponse: response(400, { error: 'Request body must be valid JSON' }) };
  }

  if (typeof body.symptom !== 'string') {
    return { errorResponse: response(400, { error: 'symptom field is required' }) };
  }

  const symptom = body.symptom.trim();
  if (symptom === '') {
    return { errorResponse: response(400, { error: 'symptom cannot be empty' }) };
  }

  // language is optional — default to 'en'; only 'es' triggers Spanish output
  const language = body.language === 'es' ? 'es' : 'en';

  return { symptom, language };
}

async function handleDiagnose(event, requestId) {
  const extracted = extractInput(event);
  if (extracted.errorResponse) {
    return extracted.errorResponse;
  }

  const { symptom, language } = extracted;
  console.log(JSON.stringify({ requestId, symptomLength: symptom.length, language }));

  // --- Retrieve similar resolved cases (feature-flagged) ---
  let relatedCases = [];
  const similarCasesEnabled = process.env.SIMILAR_CASES_ENABLED !== 'false';
  if (similarCasesEnabled) {
    try {
      relatedCases = await findSimilarCases(symptom);
      console.log(JSON.stringify({ requestId, relatedCasesFound: relatedCases.length }));
    } catch (err) {
      // Non-fatal: log and continue without related cases
      console.error(JSON.stringify({ requestId, similarCasesError: err.message }));
    }
  }

  // --- Build prompt ---
  const { systemPrompt, userPrompt } = buildPrompt(symptom, language, relatedCases);

  // --- Call Bedrock ---
  let rawText;
  const bedrockStart = Date.now();
  try {
    rawText = await invokeClaude(systemPrompt, userPrompt);
  } catch (err) {
    const isThrottling = err.name === 'ThrottlingException';
    console.error(JSON.stringify({
      requestId,
      error: err.name,
      message: err.message,
      bedrockDurationMs: Date.now() - bedrockStart,
    }));
    if (isThrottling) {
      return response(503, { error: 'service busy, please retry' });
    }
    return response(500, { error: 'diagnostic service temporarily unavailable' });
  }
  console.log(JSON.stringify({ requestId, bedrockDurationMs: Date.now() - bedrockStart }));

  // --- Parse response ---
  let diagnostic;
  try {
    diagnostic = parseResponse(rawText);
  } catch (err) {
    console.error(JSON.stringify({ requestId, parseError: err.message, rawPreview: rawText.slice(0, 300) }));
    return response(500, { error: 'unable to generate diagnostic' });
  }

  console.log(JSON.stringify({ requestId, confidence: diagnostic.confidence }));

  // --- Return structured result with relatedCases ---
  return response(200, { ...diagnostic, relatedCases });
}

// ─── Route: POST /cases ───────────────────────────────────────────────────────

async function handleCreateCase(event) {
  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return response(400, { error: 'Request body must be valid JSON' });
  }

  const result = await createCase(body);
  if (result.error) {
    return response(result.statusCode, { error: result.error });
  }
  return response(result.statusCode, result.item);
}

// ─── Route: GET /cases ────────────────────────────────────────────────────────

async function handleGetCases() {
  const result = await getCases();
  if (result.error) {
    return response(result.statusCode, { error: result.error });
  }
  return response(result.statusCode, result.items);
}

// ─── Route: PATCH /cases/{id} ─────────────────────────────────────────────────

async function handleUpdateCase(event) {
  const id = event.pathParameters?.id;
  if (!id) {
    return response(400, { error: 'case id is required in the URL path' });
  }

  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return response(400, { error: 'Request body must be valid JSON' });
  }

  const result = await updateCase(id, body);
  if (result.error) {
    return response(result.statusCode, { error: result.error });
  }
  return response(result.statusCode, result.item);
}

// ─── Main Handler (Route Dispatch) ───────────────────────────────────────────

/**
 * Lambda handler — entry point invoked by API Gateway.
 * Dispatches to the appropriate route handler based on httpMethod + path.
 *
 * @param {object} event   - API Gateway proxy event
 * @param {object} context - Lambda context
 * @returns {Promise<{ statusCode: number, headers: object, body: string }>}
 */
export async function handler(event, context) {
  const requestId = context?.awsRequestId ?? 'local';
  const { httpMethod, path } = event;
  console.log(JSON.stringify({ requestId, httpMethod, path }));

  // CORS preflight — applies to all routes uniformly
  if (httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  // Route dispatch
  if (path === '/diagnose' && httpMethod === 'POST') {
    return handleDiagnose(event, requestId);
  }
  if (path === '/cases' && httpMethod === 'POST') {
    return handleCreateCase(event);
  }
  if (path === '/cases' && httpMethod === 'GET') {
    return handleGetCases();
  }
  if (path.startsWith('/cases/') && httpMethod === 'PATCH') {
    return handleUpdateCase(event);
  }

  // Catch-all: unmatched route
  return response(404, { error: 'Not found' });
}
