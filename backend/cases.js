import crypto from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialised once per Lambda container — reused across warm invocations.
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.CASES_TABLE;

const VALID_PATCH_STATUSES = new Set(['resolved', 'cancelled']);

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

  const item = {
    id: crypto.randomUUID(),
    symptom: body.symptom.trim(),
    cause: body.cause.trim(),
    action: body.action.trim(),
    confidence: body.confidence.trim(),
    language: body.language ?? 'en',
    status: 'open',
    createdAt: new Date().toISOString(),
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
