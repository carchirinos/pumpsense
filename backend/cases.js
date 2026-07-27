import crypto from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialised once per Lambda container — reused across warm invocations.
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.CASES_TABLE;

const VALID_PATCH_STATUSES = new Set(['resolved', 'cancelled']);

/**
 * Derives a human-readable case number from an id and createdAt timestamp.
 * Format: PS-YYMMDD-XXXX where YYMMDD is UTC date and XXXX is the first 4 chars of the UUID uppercased.
 *
 * Pure function — exported so backfill scripts can reuse it without duplicating logic.
 *
 * @param {string} id        - UUIDv4
 * @param {string} createdAt - ISO 8601 timestamp
 * @returns {string}
 */
export function deriveCaseNumber(id, createdAt) {
  const d = new Date(createdAt);
  const yy = String(d.getUTCFullYear()).slice(-2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const prefix = id.slice(0, 4).toUpperCase();
  return `PS-${yy}${mm}${dd}-${prefix}`;
}

/**
 * Creates a new case in DynamoDB from a diagnostic result.
 *
 * @param {{ symptom: string, cause: string, action: string, confidence: string, language?: string }} body
 * @returns {{ statusCode: number, item?: object, error?: string }}
 */
export async function createCase(body) {
  // Validate required fields
  const requiredFields = ['symptom', 'cause', 'action', 'confidence'];
  for (const field of requiredFields) {
    if (typeof body[field] !== 'string' || body[field].trim() === '') {
      return { statusCode: 400, error: `Missing required field: ${field}` };
    }
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const item = {
    id,
    caseNumber: deriveCaseNumber(id, createdAt),
    symptom: body.symptom.trim(),
    cause: body.cause.trim(),
    action: body.action.trim(),
    confidence: body.confidence.trim(),
    language: body.language ?? 'en',
    status: 'open',
    createdAt,
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));
  } catch (err) {
    console.error('[cases] PutCommand failed:', err.message);
    return { statusCode: 500, error: 'failed to save case' };
  }

  return { statusCode: 201, item };
}

/**
 * Retrieves all cases from DynamoDB, sorted by createdAt descending (newest first).
 *
 * @returns {{ statusCode: number, items?: object[], error?: string }}
 */
export async function getCases() {
  let items = [];

  try {
    // Paginate through all items (Scan may return partial results for large tables)
    let lastKey;
    do {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastKey,
      }));
      items.push(...(result.Items ?? []));
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);
  } catch (err) {
    console.error('[cases] ScanCommand failed:', err.message);
    return { statusCode: 500, error: 'failed to retrieve cases' };
  }

  // Sort newest first in-memory
  items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return { statusCode: 200, items };
}

/**
 * Updates a case's status to "resolved" or "cancelled", with a resolution note
 * and technician name.
 *
 * @param {string} id   - Case partition key
 * @param {{ status: string, resolutionNote: string, technicianName: string }} body
 * @returns {{ statusCode: number, item?: object, error?: string }}
 */
export async function updateCase(id, body) {
  // Validate id
  if (!id || typeof id !== 'string') {
    return { statusCode: 400, error: 'case id is required' };
  }

  // Validate status
  if (!body.status || !VALID_PATCH_STATUSES.has(body.status)) {
    return { statusCode: 400, error: "status must be 'resolved' or 'cancelled'" };
  }

  // Validate resolutionNote
  if (typeof body.resolutionNote !== 'string' || body.resolutionNote.trim() === '') {
    return { statusCode: 400, error: 'resolutionNote is required' };
  }

  // Validate technicianName
  if (typeof body.technicianName !== 'string' || body.technicianName.trim() === '') {
    return { statusCode: 400, error: 'technicianName is required' };
  }

  const now = new Date().toISOString();

  try {
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: 'SET #st = :status, resolutionNote = :note, technicianName = :tech, resolvedAt = :resolvedAt',
      ExpressionAttributeNames: {
        '#st': 'status', // status is a reserved word in DynamoDB
      },
      ExpressionAttributeValues: {
        ':status': body.status,
        ':note': body.resolutionNote.trim(),
        ':tech': body.technicianName.trim(),
        ':resolvedAt': now,
      },
      ConditionExpression: 'attribute_exists(id)',
      ReturnValues: 'ALL_NEW',
    }));

    return { statusCode: 200, item: result.Attributes };
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 404, error: 'case not found' };
    }
    console.error('[cases] UpdateCommand failed:', err.message);
    return { statusCode: 500, error: 'failed to update case' };
  }
}

// ─── Similar Cases Retrieval ──────────────────────────────────────────────────

// Minimum normalised similarity score (0–1) a case must reach to be included.
// With the current word-overlap approach, 0.25 means at least ~25% of the
// significant words in the query must overlap with the case symptom.
const SIMILARITY_THRESHOLD = 0.25;

// Bilingual stopwords (EN + ES) — common words that add no diagnostic signal.
const STOPWORDS = new Set([
  // English
  'the', 'and', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had',
  'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall',
  'can', 'not', 'but', 'for', 'with', 'from', 'that', 'this', 'these', 'those',
  'its', 'very', 'just', 'also', 'than', 'then', 'when', 'while', 'after',
  'before', 'about', 'into', 'over', 'under', 'between', 'through', 'during',
  'each', 'every', 'all', 'any', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'only', 'same', 'too', 'out', 'there', 'here', 'which', 'what', 'where',
  'who', 'how', 'why', 'our', 'your', 'their',
  // Spanish
  'que', 'del', 'los', 'las', 'una', 'unos', 'unas', 'con', 'por', 'para',
  'como', 'pero', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'durante',
  'ese', 'esa', 'esos', 'esas', 'este', 'esta', 'estos', 'estas',
  'aquel', 'aquella', 'hay', 'ser', 'estar', 'tiene', 'tienen', 'sido',
  'son', 'fue', 'era', 'está', 'están', 'muy', 'más', 'menos', 'todo',
  'toda', 'todos', 'todas', 'otro', 'otra', 'otros', 'otras', 'cada',
  'cuando', 'donde', 'quien', 'cual',
]);

/**
 * Normalises text for comparison: lowercase, strip accents, split to tokens,
 * remove stopwords and tokens shorter than 3 chars.
 *
 * @param {string} text
 * @returns {Set<string>} Set of significant normalised tokens
 */
function extractSignificantWords(text) {
  const normalised = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const tokens = normalised.split(/\W+/).filter(Boolean);
  const significant = tokens.filter(t => t.length >= 3 && !STOPWORDS.has(t));
  return new Set(significant);
}

/**
 * Scores similarity between two sets of words as the proportion of the query
 * words that appear in the target.
 *
 * Normalised by query word count so longer symptoms are not unfairly favoured.
 *
 * @param {Set<string>} queryWords
 * @param {Set<string>} targetWords
 * @returns {number} 0–1
 */
function scoreSimilarity(queryWords, targetWords) {
  if (queryWords.size === 0) return 0;
  let overlap = 0;
  for (const word of queryWords) {
    if (targetWords.has(word)) overlap++;
  }
  return overlap / queryWords.size;
}

/**
 * Finds resolved cases whose symptom is similar to the given symptom.
 *
 * @param {string} symptom - The incoming symptom to compare against
 * @param {{ maxResults?: number }} [options]
 * @returns {Promise<Array<{ caseNumber: string, symptom: string, cause: string, action: string, resolutionNote: string, technicianName: string }>>}
 */
export async function findSimilarCases(symptom, options = {}) {
  const maxResults = options.maxResults ?? 3;

  // Fetch all cases
  const { items, error } = await getCases();
  if (error || !items) return [];

  // Only consider resolved cases — they have actionable resolutions
  const resolved = items.filter(c => c.status === 'resolved');
  if (resolved.length === 0) return [];

  const queryWords = extractSignificantWords(symptom);
  if (queryWords.size === 0) return [];

  // Score each resolved case
  const scored = resolved
    .map(c => ({
      case: c,
      score: scoreSimilarity(queryWords, extractSignificantWords(c.symptom ?? '')),
    }))
    .filter(s => s.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored.map(s => ({
    caseNumber: s.case.caseNumber ?? s.case.id?.slice(0, 8).toUpperCase(),
    symptom: s.case.symptom,
    cause: s.case.cause,
    action: s.case.action,
    resolutionNote: s.case.resolutionNote ?? '',
    technicianName: s.case.technicianName ?? '',
  }));
}
