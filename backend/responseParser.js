/**
 * Valid confidence values accepted in the diagnostic result.
 * Claude is instructed to return one of these; we normalise to lowercase
 * before validation so "High", "HIGH", etc. are all accepted.
 */
const VALID_CONFIDENCE_VALUES = new Set(['high', 'medium', 'low']);

/**
 * Required top-level fields in the diagnostic JSON returned by Claude.
 */
const REQUIRED_FIELDS = ['symptom', 'cause', 'action', 'confidence'];

/**
 * Attempts to extract a JSON object from Claude's raw text response.
 *
 * Claude is instructed to return plain JSON, but may occasionally wrap it in
 * a markdown code fence (```json ... ``` or ``` ... ```). This function tries
 * both forms before giving up.
 *
 * @param {string} rawText - Raw text content from Claude's response
 * @returns {object} Parsed JSON object
 * @throws {Error} If no valid JSON object can be extracted
 */
function extractJson(rawText) {
  // Strategy 1: pull content from a ```json ... ``` or ``` ... ``` code fence
  const codeFenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeFenceMatch) {
    try {
      return JSON.parse(codeFenceMatch[1]);
    } catch {
      // Fall through to strategy 2 — the fence match may have captured
      // something that isn't valid JSON on its own.
    }
  }

  // Strategy 2: treat the entire response as JSON (expected happy path)
  try {
    return JSON.parse(rawText.trim());
  } catch {
    // Fall through to strategy 3
  }

  // Strategy 3: find the first { ... } block in the text in case Claude
  // prefaced the JSON with a stray sentence.
  const braceMatch = rawText.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {
      // Nothing more to try — fall through to the error below
    }
  }

  throw new Error(
    'Could not extract a JSON object from the model response. ' +
    `Raw response preview: ${rawText.slice(0, 200)}`
  );
}

/**
 * Validates that all required fields are present and non-empty strings,
 * and that confidence is one of the accepted enum values.
 *
 * @param {object} parsed - The parsed JSON object from Claude
 * @throws {Error} If any required field is missing, empty, or invalid
 */
function validate(parsed) {
  for (const field of REQUIRED_FIELDS) {
    if (typeof parsed[field] !== 'string' || parsed[field].trim() === '') {
      throw new Error(
        `Diagnostic response is missing or has an empty "${field}" field`
      );
    }
  }

  if (!VALID_CONFIDENCE_VALUES.has(parsed.confidence)) {
    throw new Error(
      `Invalid confidence value "${parsed.confidence}". ` +
      `Must be one of: ${[...VALID_CONFIDENCE_VALUES].join(', ')}`
    );
  }
}

/**
 * Parses Claude's raw text response into a validated, normalised diagnostic result.
 *
 * Pipeline:
 *   1. Extract JSON from markdown code blocks or plain text
 *   2. Validate required fields (symptom, cause, action, confidence)
 *   3. Normalise confidence to lowercase
 *   4. Return a clean result object with only the four expected fields
 *
 * @param {string} rawText - Raw text content from the Bedrock client
 * @returns {{ symptom: string, cause: string, action: string, confidence: 'high'|'medium'|'low' }}
 * @throws {Error} If parsing or validation fails
 */
export function parseResponse(rawText) {
  if (typeof rawText !== 'string' || rawText.trim() === '') {
    throw new Error('parseResponse received an empty or non-string input');
  }

  const parsed = extractJson(rawText);

  // Normalise confidence before validation so "High" / "HIGH" pass the check
  if (typeof parsed.confidence === 'string') {
    parsed.confidence = parsed.confidence.toLowerCase().trim();
  }

  validate(parsed);

  // Return only the four documented fields — discard any extra keys Claude
  // may have included so the handler always returns a predictable shape.
  return {
    symptom: parsed.symptom.trim(),
    cause: parsed.cause.trim(),
    action: parsed.action.trim(),
    confidence: parsed.confidence,
  };
}
