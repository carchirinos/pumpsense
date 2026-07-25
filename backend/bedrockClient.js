import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Initialised once per Lambda container — reused across warm invocations.
const client = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION ?? process.env.AWS_REGION ?? 'us-east-1',
});

/**
 * Invokes the Claude model on Amazon Bedrock and returns the raw text response.
 *
 * @param {string} systemPrompt - System message defining the agent's role and knowledge base
 * @param {string} userPrompt   - User message containing the technician's symptom
 * @returns {Promise<string>}   - Raw text content from Claude's first response block
 *
 * @throws {Error} Rethrows Bedrock API errors with a descriptive message so the
 *                 Lambda handler can map them to the correct HTTP status code.
 */
export async function invokeClaude(systemPrompt, userPrompt) {
  const modelId = process.env.BEDROCK_MODEL_ID;
  if (!modelId) {
    throw new Error('BEDROCK_MODEL_ID environment variable is not set');
  }

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  };

  let response;
  try {
    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });
    response = await client.send(command);
  } catch (err) {
    // Bedrock surfaces throttling as ThrottlingException and access errors as
    // AccessDeniedException — preserve the original error name for the handler
    // to differentiate 503 vs 500 responses.
    const wrapped = new Error(`Bedrock API error: ${err.message}`);
    wrapped.name = err.name ?? 'BedrockError';
    wrapped.cause = err;
    throw wrapped;
  }

  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  // Claude's response body: { content: [{ type: 'text', text: '...' }], ... }
  const textBlock = responseBody?.content?.[0]?.text;
  if (typeof textBlock !== 'string' || textBlock.trim() === '') {
    throw new Error('Bedrock returned an empty or unexpected response structure');
  }

  return textBlock;
}
