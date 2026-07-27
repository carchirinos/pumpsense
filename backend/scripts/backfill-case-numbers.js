/**
 * Backfill script: adds caseNumber to existing items in PumpSenseCases.
 *
 * Usage (from backend/ directory):
 *   CASES_TABLE=PumpSenseCases node scripts/backfill-case-numbers.js --dry-run
 *   CASES_TABLE=PumpSenseCases node scripts/backfill-case-numbers.js
 *
 * Idempotent: items that already have caseNumber are skipped.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { deriveCaseNumber } from '../cases.js';

const TABLE_NAME = process.env.CASES_TABLE;
if (!TABLE_NAME) {
  console.error('ERROR: CASES_TABLE environment variable is required.');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
if (dryRun) console.log('=== DRY RUN MODE — no writes will be made ===\n');

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Scan all items
let items = [];
let lastKey;
do {
  const result = await client.send(new ScanCommand({
    TableName: TABLE_NAME,
    ExclusiveStartKey: lastKey,
  }));
  items.push(...(result.Items ?? []));
  lastKey = result.LastEvaluatedKey;
} while (lastKey);

console.log(`Scanned ${items.length} items in table "${TABLE_NAME}".`);

const toBackfill = items.filter(item => !item.caseNumber);
const alreadyDone = items.length - toBackfill.length;

console.log(`  Already have caseNumber: ${alreadyDone}`);
console.log(`  Need backfill: ${toBackfill.length}`);
console.log('');

if (toBackfill.length === 0) {
  console.log('Nothing to do. All items already have caseNumber.');
  process.exit(0);
}

let updated = 0;
let errors = 0;

for (const item of toBackfill) {
  const caseNumber = deriveCaseNumber(item.id, item.createdAt);

  if (dryRun) {
    console.log(`  [dry-run] ${item.id} -> ${caseNumber}`);
  } else {
    try {
      await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: item.id },
        UpdateExpression: 'SET caseNumber = :cn',
        ExpressionAttributeValues: { ':cn': caseNumber },
        ConditionExpression: 'attribute_exists(id) AND attribute_not_exists(caseNumber)',
      }));
      updated++;
      console.log(`  + ${item.id} -> ${caseNumber}`);
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        console.log(`  = ${item.id} — already has caseNumber (skipping)`);
      } else {
        errors++;
        console.error(`  ! ${item.id} — ${err.message}`);
      }
    }
  }
}

console.log('');
if (dryRun) {
  console.log(`Dry run complete. ${toBackfill.length} items would be updated.`);
} else {
  console.log(`Done. Updated: ${updated}, Errors: ${errors}`);
}
