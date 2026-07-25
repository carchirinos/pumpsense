import knowledgeBase from './knowledgeBase.js';

/**
 * Formats the knowledge base into a structured text block for injection
 * into the system prompt. Each scenario is rendered as a numbered entry
 * so Claude can reference failure patterns by name and match them to symptoms.
 *
 * @returns {string}
 */
function formatKnowledgeBase() {
  return knowledgeBase
    .map((scenario, index) => {
      const symptoms = scenario.symptoms.map((s) => `    - ${s}`).join('\n');
      return (
        `${index + 1}. **${scenario.name}**\n` +
        `   Keywords: ${scenario.keywords.join(', ')}\n` +
        `   Observable symptoms:\n${symptoms}\n` +
        `   Likely cause: ${scenario.cause}\n` +
        `   Recommended action:\n   ${scenario.action.replace(/\n/g, '\n   ')}`
      );
    })
    .join('\n\n');
}

/**
 * Builds the system prompt that defines the agent's role, injects the full
 * knowledge base as context, and specifies the required JSON output format.
 *
 * @param {'en'|'es'} language - Response language for diagnostic text values
 * @returns {string}
 */
function buildSystemPrompt(language) {
  const languageInstruction = language === 'es'
    ? `\n\n## Language Requirement\n\nIMPORTANT: Write the VALUES of the "symptom", "cause", and "action" fields in Spanish.\nKeep all JSON keys in English exactly as specified (symptom, cause, action, confidence).\nKeep the "confidence" value in English (high, medium, or low).`
    : '';

  return `You are an expert industrial pump diagnostics assistant helping maintenance technicians diagnose pump failures in real-time on the factory floor.

Your task is to analyze the technician's symptom description, match it to the most likely failure pattern from the knowledge base below, and return a structured diagnosis.

---

## Knowledge Base — Known Pump Failure Patterns

${formatKnowledgeBase()}

---

## Instructions

- Read the technician's symptom description carefully.
- Match it to the most likely failure pattern from the knowledge base above.
- If multiple patterns could match, choose the single most probable one based on the most distinctive indicators in the symptom description.
- Use the knowledge base as your primary reference. You may supplement with general pump engineering knowledge, but always ground your diagnosis in the patterns above.
- Return your response as a valid JSON object with EXACTLY this structure (no markdown, no explanation outside the JSON):

{
  "symptom": "A clear, concise restatement of what the technician observed (1–2 sentences)",
  "cause": "The most likely root cause based on the matched failure pattern",
  "action": "Specific, numbered steps the technician should take — preserve newlines between steps using \\n",
  "confidence": "high, medium, or low"
}

## Confidence level guide

- **high**: The symptom description contains distinctive indicators that clearly match one failure pattern (e.g., grinding noise + bearing heat = bearing failure).
- **medium**: The symptom matches a pattern but is missing some distinctive details, or two patterns are plausible.
- **low**: The symptom is vague, generic (e.g., "pump not working"), or could equally match three or more failure patterns.

Return only the JSON object. Do not include markdown code fences, headers, or any text before or after the JSON.${languageInstruction}`;
}

/**
 * Builds the user prompt containing the technician's symptom description.
 *
 * @param {string} symptom - Raw symptom description from the technician
 * @returns {string}
 */
function buildUserPrompt(symptom) {
  return `Symptom description from technician: ${symptom}

Provide your diagnosis as a JSON object following the format specified in your instructions.`;
}

/**
 * Returns the complete {systemPrompt, userPrompt} pair ready for the Bedrock client.
 *
 * @param {string} symptom          - Raw symptom description from the technician
 * @param {'en'|'es'} [language='en'] - Response language for diagnostic text values
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildPrompt(symptom, language = 'en') {
  return {
    systemPrompt: buildSystemPrompt(language),
    userPrompt: buildUserPrompt(symptom),
  };
}
