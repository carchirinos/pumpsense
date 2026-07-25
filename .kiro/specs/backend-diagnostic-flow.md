# Spec: Backend Diagnostic Flow

**Feature**: Core Lambda diagnostic engine for PumpSense AI agent

**Status**: Draft

**Created**: 2026-07-23

---

## Requirements (EARS Format)

### Functional Requirements

**REQ-1**: **WHEN** the Lambda function receives a POST request with a JSON body containing a "symptom" field, **THEN** the system **SHALL** extract the symptom description for processing.

**REQ-2**: **WHERE** the symptom description is missing or empty, **THEN** the Lambda **SHALL** return a 400 error response with message "symptom field is required".

**REQ-3**: **WHEN** processing a valid symptom, **THEN** the Lambda **SHALL** load the hardcoded knowledge base containing at least 7 pump failure scenarios (cavitation, bearing failure, seal leak, impeller damage, motor overload, air binding, overheating).

**REQ-4**: **WHEN** constructing the AI prompt, **THEN** the system **SHALL** combine:
- A system message defining the agent as a pump diagnostics expert
- The hardcoded knowledge base as structured context
- The technician's symptom description as the user message

**REQ-5**: **WHEN** calling Amazon Bedrock, **THEN** the Lambda **SHALL** invoke the `us.anthropic.claude-sonnet-4-6` model with the constructed prompt.

**REQ-6**: **WHERE** the Bedrock API call fails, **THEN** the Lambda **SHALL** return a 500 error response with message "diagnostic service temporarily unavailable".

**REQ-7**: **WHEN** Bedrock returns a successful response, **THEN** the Lambda **SHALL** parse the response into a structured JSON object containing:
- `symptom`: string (rephrased symptom summary)
- `cause`: string (likely root cause)
- `action`: string (recommended next steps)
- `confidence`: enum ("high", "medium", "low")

**REQ-8**: **WHEN** returning a successful diagnosis, **THEN** the Lambda **SHALL** return a 200 response with the structured diagnostic JSON.

**REQ-9**: **WHERE** the Bedrock response cannot be parsed into the expected structure, **THEN** the Lambda **SHALL** return a 500 error response with message "unable to generate diagnostic".

**REQ-10**: **WHEN** API Gateway receives any request to the `/diagnose` endpoint, **THEN** it **SHALL** include CORS headers allowing cross-origin requests from any origin (`Access-Control-Allow-Origin: *`).

**REQ-11**: **WHEN** API Gateway receives an OPTIONS request (CORS preflight), **THEN** it **SHALL** return a 200 response with appropriate CORS headers.

### Non-Functional Requirements

**REQ-12**: **WHILE** processing a diagnosis request, **THEN** the Lambda **SHALL** complete within 30 seconds (timeout constraint).

**REQ-13**: **WHERE** the Lambda execution role is defined, **THEN** it **SHALL** include the IAM permission `bedrock:InvokeModel` for the `us.anthropic.claude-sonnet-4-6` model ARN.

**REQ-14**: **WHEN** the Lambda function is deployed, **THEN** it **SHALL** be accessible via a public API Gateway endpoint (no authentication required for MVP).

**REQ-15**: **WHEN** logging occurs, **THEN** the Lambda **SHALL** write structured logs to CloudWatch including: request ID, symptom length, Bedrock response time, and diagnosis confidence level.

**REQ-16**: **WHEN** the request body includes a `"language"` field set to `"es"`, **THEN** the Lambda **SHALL** instruct Claude to respond in Spanish for the `symptom`, `cause`, and `action` fields, while keeping all JSON keys and the `confidence` value in English (`"high"`, `"medium"`, or `"low"`).

**REQ-17**: **WHERE** the `"language"` field is absent or set to any value other than `"es"`, **THEN** the Lambda **SHALL** default to English for the diagnostic response.

---

## Design

### Architecture Diagram

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ POST /diagnose
       │ { "symptom": "..." }
       ↓
┌──────────────────┐
│  API Gateway     │
│  (REST API)      │
│  + CORS enabled  │
└──────┬───────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│         Lambda Function                 │
│  ┌───────────────────────────────────┐  │
│  │ 1. Validate input                 │  │
│  │ 2. Load knowledge base            │  │
│  │ 3. Build prompt                   │  │
│  │ 4. Call Bedrock API               │  │
│  │ 5. Parse response                 │  │
│  │ 6. Return structured JSON         │  │
│  └───────────────────────────────────┘  │
└──────┬───────────────────────────────────┘
       │
       ↓
┌──────────────────┐
│  Amazon Bedrock  │
│  Claude Sonnet 4 │
└──────────────────┘
```

### Component Breakdown

#### 1. Lambda Handler (`backend/handler.js`)

**Responsibilities**:
- Parse incoming API Gateway event
- Validate request body
- Orchestrate the diagnostic flow
- Handle errors and return appropriate HTTP responses

**Inputs**: API Gateway event object
```json
{
  "body": "{\"symptom\":\"pump vibrating hard and lost pressure\",\"language\":\"en\"}",
  "httpMethod": "POST",
  "headers": { ... }
}
```

> The `language` field is optional and defaults to `"en"`. Supported values: `"en"`, `"es"`.

**Outputs**: API Gateway response object
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"symptom\":\"...\",\"cause\":\"...\",\"action\":\"...\",\"confidence\":\"high\"}"
}
```

**Error Cases**:
- 400: Missing or invalid symptom field
- 500: Bedrock API failure
- 500: Response parsing failure

#### 2. Knowledge Base Module (`backend/knowledgeBase.js`)

**Responsibilities**:
- Define and export the hardcoded pump failure scenarios
- Provide structured data for prompt construction

**Data Structure**:
```javascript
[
  {
    symptoms: ["vibration", "loss of pressure", "cavitation noise"],
    cause: "Cavitation due to insufficient NPSH or air ingress",
    action: "1. Check fluid level in supply tank\n2. Inspect suction line for leaks or blockages\n3. Verify pump is not running dry\n4. Inspect impeller for damage",
    keywords: ["vibration", "pressure", "noise", "cavitation"]
  },
  // ... 6 more scenarios
]
```

**Minimum Required Scenarios** (from tech.md):
1. Cavitation (low pressure + vibration)
2. Bearing failure (grinding noise + vibration)
3. Seal leak (fluid leaking)
4. Impeller damage (loss of flow + noise)
5. Motor overload (tripping breaker + high current)
6. Air binding (intermittent flow + gurgling)
7. Overheating (high temperature)

#### 3. Prompt Builder (`backend/prompt.js`)

**Responsibilities**:
- Construct the system and user messages for Claude
- Inject knowledge base as structured context
- Format the prompt for optimal AI reasoning
- Include a language instruction when `language === 'es'`

**Signature**: `buildPrompt(symptom, language = 'en') → { systemPrompt, userPrompt }`

**Language instruction** (appended to system message when `language === 'es'`):
```
IMPORTANT: Respond in Spanish for the "symptom", "cause", and "action" fields.
Keep all JSON keys in English. Keep the "confidence" value in English (high, medium, or low).
```

**Prompt Template**:

**System Message**:
```
You are an expert industrial pump diagnostics assistant helping maintenance technicians diagnose pump failures in real-time.

Your task is to match the technician's symptom description to the most likely failure pattern from the knowledge base below, then provide a structured diagnosis.

Knowledge Base:
[Inject all 7 scenarios here as structured text]

Instructions:
- Analyze the symptom description carefully
- Match it to the most likely failure pattern(s) from the knowledge base
- If multiple patterns match, choose the most probable based on the symptom details
- Return your response as a JSON object with this exact structure:
{
  "symptom": "A clear, concise restatement of what the technician observed",
  "cause": "The most likely root cause based on the failure patterns",
  "action": "Specific, numbered steps the technician should take next",
  "confidence": "high, medium, or low based on symptom clarity and pattern match"
}

Confidence levels:
- high: Symptom clearly matches a known pattern with distinctive indicators
- medium: Symptom matches a pattern but lacks some distinctive details
- low: Symptom is vague or could match multiple patterns equally
```

**User Message**:
```
Symptom description from technician: [Insert symptom here]

Provide your diagnosis in the JSON format specified.
```

#### 4. Bedrock Client (`backend/bedrockClient.js`)

**Responsibilities**:
- Initialize AWS SDK Bedrock Runtime client
- Invoke the Claude model with the constructed prompt
- Parse the model's response text
- Handle API errors (throttling, model unavailable, etc.)

**Node.js Implementation** (AWS SDK v3):
```javascript
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

async function invokeClaude(systemPrompt, userPrompt) {
  const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
  
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1000,
    messages: [
      { role: "user", content: userPrompt }
    ],
    system: systemPrompt
  };

  const command = new InvokeModelCommand({
    modelId: process.env.BEDROCK_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload)
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return responseBody.content[0].text;
}

#### 5. Response Parser

**Responsibilities**:
- Extract JSON from Claude's response text
- Validate the structure matches expected fields
- Handle cases where Claude returns markdown code blocks (```json ... ```)
- Provide default values if fields are missing

**Parsing Strategy**:
1. Look for JSON in markdown code blocks first (```json ... ```)
2. If not found, try to parse the entire response as JSON
3. Validate required fields: `symptom`, `cause`, `action`, `confidence`
4. Normalize confidence to lowercase enum
5. If parsing fails, return an error

### SAM Template Structure

**File**: `template.yaml` (project root)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: PumpSense Diagnostic Agent Backend

Globals:
  Function:
    Timeout: 30
    MemorySize: 512
    Runtime: nodejs24.x
    Environment:
      Variables:
        BEDROCK_MODEL_ID: us.anthropic.claude-sonnet-4-6
        AWS_REGION: us-east-1

Resources:
  DiagnosticFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/
      Handler: handler.handler
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - bedrock:InvokeModel
              Resource: 
                - !Sub 'arn:aws:bedrock:${AWS::Region}:${AWS::AccountId}:inference-profile/us.anthropic.claude-sonnet-4-6'
                - 'arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-*'
      Events:
        DiagnoseApi:
          Type: Api
          Properties:
            Path: /diagnose
            Method: POST
            RestApiId: !Ref DiagnosticApi

  DiagnosticApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowMethods: "'POST, OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        AllowOrigin: "'*'"

Outputs:
  DiagnosticApiUrl:
    Description: "API Gateway endpoint URL for Prod stage"
    Value: !Sub "https://${DiagnosticApi}.execute-api.${AWS::Region}.amazonaws.com/prod/diagnose"
```

### Error Handling Strategy

| Error Scenario | HTTP Code | Response Body | Log Level |
|----------------|-----------|---------------|-----------|
| Missing symptom field | 400 | `{"error": "symptom field is required"}` | WARN |
| Empty symptom | 400 | `{"error": "symptom cannot be empty"}` | WARN |
| Bedrock API failure | 500 | `{"error": "diagnostic service temporarily unavailable"}` | ERROR |
| Bedrock throttling | 503 | `{"error": "service busy, please retry"}` | WARN |
| Invalid JSON response from Claude | 500 | `{"error": "unable to generate diagnostic"}` | ERROR |
| Lambda timeout | 504 | (API Gateway default) | ERROR |

### Data Flow Example

**Input (English, default)**:
```json
POST /diagnose
{
  "symptom": "pump making loud grinding noise and vibrating heavily"
}
```

**Input (Spanish)**:
```json
POST /diagnose
{
  "symptom": "la bomba hace un ruido fuerte y vibra mucho",
  "language": "es"
}
```

**Knowledge Base Injection** (formatted for prompt):
```
1. Cavitation: symptoms include vibration, pressure loss, cavitation noise...
2. Bearing failure: symptoms include grinding noise, vibration, heat...
[...]
```

**Bedrock Request**:
```json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 1000,
  "system": "You are an expert industrial pump diagnostics assistant...[full system prompt]",
  "messages": [
    {
      "role": "user",
      "content": "Symptom description from technician: pump making loud grinding noise and vibrating heavily\n\nProvide your diagnosis in the JSON format specified."
    }
  ]
}
```

**Bedrock Response** (parsed from `content[0].text`):
```json
{
  "symptom": "Loud grinding noise with heavy vibration",
  "cause": "Worn or damaged bearings, possibly due to inadequate lubrication or misalignment",
  "action": "1. Stop the pump immediately to prevent further damage\n2. Inspect bearings for wear, scoring, or discoloration\n3. Check lubrication levels and quality\n4. Verify shaft alignment\n5. Replace bearings if damaged",
  "confidence": "high"
}
```

**Lambda Response**:
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"symptom\":\"Loud grinding noise with heavy vibration\",\"cause\":\"Worn or damaged bearings, possibly due to inadequate lubrication or misalignment\",\"action\":\"1. Stop the pump immediately to prevent further damage\\n2. Inspect bearings for wear, scoring, or discoloration\\n3. Check lubrication levels and quality\\n4. Verify shaft alignment\\n5. Replace bearings if damaged\",\"confidence\":\"high\"}"
}
```

### Testing Strategy

**Unit Tests**:
- Knowledge base contains all 7 required scenarios
- Prompt builder correctly formats system and user messages
- Response parser handles markdown code blocks
- Response parser validates all required fields
- Error cases return correct HTTP codes

**Integration Tests**:
- Lambda handler can be invoked locally with `sam local invoke`
- Bedrock client successfully calls the model (requires AWS credentials)
- End-to-end: POST symptom → receive structured diagnosis

**Manual Tests** (post-deployment):
- POST a clear symptom (e.g., "vibration and pressure loss") → expect high confidence
- POST a vague symptom (e.g., "pump not working") → expect low confidence
- POST empty symptom → expect 400 error
- POST malformed JSON → expect 400 error
- Verify CORS headers are present in response

---

## Task Breakdown

### Phase 1: Core Infrastructure

**TASK-1**: Create SAM template.yaml
- **Details**: Define Lambda function, API Gateway, IAM policy for Bedrock access, CORS configuration
- **Acceptance**: `sam validate` passes without errors
- **Estimated effort**: 30 minutes

**TASK-2**: Initialize backend directory structure
- **Details**: Create `backend/` directory, initialize `package.json`, add `@aws-sdk/client-bedrock-runtime` dependency
- **Acceptance**: Directory structure matches structure.md, `package.json` lists AWS SDK v3 Bedrock dependency
- **Estimated effort**: 15 minutes

### Phase 2: Knowledge Base & Prompt Engineering

**TASK-3**: Implement knowledge base module
- **Details**: Create `backend/knowledgeBase.js` with all 7 pump failure scenarios from tech.md
- **Acceptance**: Module exports array of 7 scenarios, each with symptoms/cause/action/keywords
- **Estimated effort**: 45 minutes

**TASK-4**: Implement prompt builder module
- **Details**: Create `backend/prompt.js` that combines system message + knowledge base + user symptom into formatted prompt
- **Acceptance**: Function takes symptom string and returns {systemPrompt, userPrompt} ready for Bedrock
- **Estimated effort**: 30 minutes

### Phase 3: Bedrock Integration

**TASK-5**: Implement Bedrock client module
- **Details**: Create `backend/bedrockClient.js` with function to invoke Claude model via AWS SDK v3
- **Acceptance**: Function takes system/user prompts, returns raw text response from Claude
- **Estimated effort**: 45 minutes

**TASK-6**: Implement response parser
- **Details**: Create parser function that extracts JSON from Claude response (handles markdown code blocks), validates structure, normalizes confidence enum
- **Acceptance**: Parser correctly extracts JSON from markdown blocks and plain JSON, validates required fields
- **Estimated effort**: 30 minutes

### Phase 4: Lambda Handler & Error Handling

**TASK-7**: Implement Lambda handler
- **Details**: Create `backend/handler.js` that orchestrates: validate input → build prompt → call Bedrock → parse response → return formatted API Gateway response
- **Acceptance**: Handler exports function that accepts API Gateway event, returns response with correct statusCode/headers/body
- **Estimated effort**: 1 hour

**TASK-8**: Add error handling and logging
- **Details**: Wrap Bedrock call in try/catch, handle validation errors (400), Bedrock errors (500/503), add CloudWatch logs for debugging
- **Acceptance**: All error scenarios from design return correct HTTP codes and error messages
- **Estimated effort**: 30 minutes

### Phase 5: Local Testing & Deployment

**TASK-9**: Test Lambda locally with SAM CLI
- **Details**: Run `sam build && sam local invoke` with sample events, verify correct responses for valid and invalid inputs
- **Acceptance**: Local invocation returns expected diagnostic JSON for test symptom
- **Estimated effort**: 30 minutes

**TASK-10**: Deploy to AWS and verify
- **Details**: Run `sam deploy --guided`, note API Gateway URL from outputs, test with curl or Postman
- **Acceptance**: POST request to deployed endpoint returns 200 with diagnostic JSON, CORS headers present
- **Estimated effort**: 45 minutes

### Phase 6: Integration Testing

**TASK-11**: End-to-end smoke tests
- **Details**: Test all 7 failure scenario types with representative symptoms, verify confidence levels are appropriate
- **Acceptance**: Each scenario type produces a relevant diagnosis with correct structure
- **Estimated effort**: 30 minutes

**TASK-12**: Edge case testing
- **Details**: Test empty symptom, missing field, malformed JSON, very long symptom (>1000 chars)
- **Acceptance**: All edge cases handled gracefully with appropriate error responses
- **Estimated effort**: 20 minutes

**TASK-13**: Implement language support in `prompt.js` and `handler.js`
- **Details**: Update `buildPrompt(symptom, language)` to accept an optional `language` parameter; when `language === 'es'`, append a Spanish language instruction to the system prompt. Update `handler.js` to extract the optional `language` field from the request body (default `'en'`) and pass it to `buildPrompt`. Update `events/valid-symptom.json` with an optional `language` field for local testing.
- **Acceptance**: POST with `{ "symptom": "...", "language": "es" }` returns `symptom`/`cause`/`action` in Spanish with JSON keys and `confidence` value in English; POST without `language` field (or `"language": "en"`) returns English response as before
- **Estimated effort**: 30 minutes

---

## Dependencies

- AWS CLI configured with credentials that have permissions for: Lambda, API Gateway, CloudFormation, IAM, Bedrock
- AWS SAM CLI installed (`brew install aws-sam-cli` on macOS)
- Bedrock model access: `us.anthropic.claude-sonnet-4-6` must be available in the target region (us-east-1 or us-west-2)
- Node.js 20+ runtime (nodejs20.x Lambda runtime)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bedrock model not available in region | High | Verify model availability before deployment, use us-east-1 as default |
| Claude response format varies | Medium | Robust parser handles markdown and plain JSON, validates structure |
| Bedrock API throttling | Medium | Return 503 with retry message, consider adding exponential backoff in future |
| CORS preflight issues | Low | SAM template explicitly configures OPTIONS method and CORS headers |
| Lambda cold start timeout | Low | Set 30s timeout, optimize imports/dependencies for fast cold start |

## Future Enhancements (Post-MVP)

- Add DynamoDB to store conversation history (session persistence)
- Implement exponential backoff/retry for Bedrock throttling
- Add CloudWatch dashboard for monitoring request volume, latency, error rate
- Replace hardcoded knowledge base with OpenSearch Serverless RAG
- Add request/response caching (ElastiCache) for common symptoms
- Implement API key-based rate limiting (API Gateway usage plans)

---

## References

- #[[file:.kiro/steering/tech.md]] — Technical architecture and data models
- #[[file:.kiro/steering/structure.md]] — Project structure and API contract
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Amazon Bedrock Runtime API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeModel.html)
- [Claude API Messages Format](https://docs.anthropic.com/claude/reference/messages_post)
