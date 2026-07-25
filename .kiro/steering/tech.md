# PumpSense — Technical Architecture

## Stack Overview

### Frontend
- **Framework**: React (Vite or Create React App)
- **Styling**: Tailwind CSS or styled-components for clean, enterprise UI
- **HTTP client**: Axios or fetch for API Gateway calls
- **Hosting**: AWS S3 + CloudFront (static site hosting)

### Backend
- **Compute**: AWS Lambda (Node.js or Python runtime)
- **API**: Amazon API Gateway (REST API with CORS enabled)
- **AI Model**: Amazon Bedrock — `us.anthropic.claude-sonnet-4-6`
- **IAM**: Lambda execution role with `bedrock:InvokeModel` permissions

### Knowledge Base (MVP)
- **Type**: Hardcoded in Lambda function code
- **Format**: Array of failure scenarios with structure:
  ```json
  {
    "symptoms": ["vibration", "loss of pressure", "high temperature"],
    "cause": "Cavitation due to low NPSH",
    "action": "Check suction line for blockages, verify fluid level in supply tank, inspect impeller for damage",
    "confidence": "high"
  }
  ```
- **No vector search or RAG in this version** — the Lambda function uses pattern matching or passes all scenarios to the model as context

### Deployment
- **Infrastructure as Code**: AWS SAM CLI (Serverless Application Model)
- **Template**: `template.yaml` in project root or `infra/` directory
- **Region**: `us-east-1` or `us-west-2` (ensure Bedrock model is available)
- **Environment variables**: Bedrock model ID, region (defined in SAM template)
- **CORS**: API Gateway must allow frontend origin (configured in SAM template)
- **Deploy command**: `sam build && sam deploy --guided` (first time) or `sam deploy` (subsequent)

## AI Reasoning Flow

1. Technician submits symptom description via frontend
2. API Gateway forwards request to Lambda
3. Lambda function:
   - Loads hardcoded failure scenarios
   - Constructs prompt for Claude:
     - System: "You are a pump diagnostics expert. Match the symptom to one of these failure patterns..."
     - User: "[symptom description from technician]"
     - Knowledge base: injected as structured context
   - Calls Bedrock `invoke_model` API
   - Parses response and extracts: symptom summary, likely cause, recommended action, confidence level
4. Lambda returns structured JSON response to frontend
5. Frontend renders diagnostic card

## Data Model

### Request (Frontend → Lambda)
```json
{
  "symptom": "pump vibrating hard and lost pressure"
}
```

### Response (Lambda → Frontend)
```json
{
  "symptom": "High vibration with pressure loss",
  "cause": "Cavitation due to insufficient NPSH or air ingress",
  "action": "1. Check fluid level in supply tank\n2. Inspect suction line for leaks or blockages\n3. Verify pump is not running dry\n4. Inspect impeller for damage",
  "confidence": "high"
}
```

## MVP Simplifications

- **No authentication**: API Gateway endpoint is publicly accessible
- **No rate limiting**: Accept risk of abuse in MVP (can add API key later)
- **No conversation history**: Each request is stateless
- **No logging/monitoring dashboard**: CloudWatch Logs only (manual inspection)
- **Hardcoded knowledge base**: No database, no admin UI to add patterns

## Deployment Requirements

- **Live deployment on AWS**: Judges will test after submission, so the frontend URL must be publicly accessible and the backend must be live
- **SAM CLI**: Install via `brew install aws-sam-cli` (macOS) or follow [AWS SAM installation guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- **AWS credentials**: Configure via `aws configure` with appropriate IAM permissions
- **Frontend URL**: CloudFront distribution or S3 static site URL
- **API Gateway URL**: Publicly accessible REST API endpoint (output from `sam deploy`)
- **Bedrock permissions**: Ensure Lambda IAM role has `bedrock:InvokeModel` for `us.anthropic.claude-sonnet-4-6` in the deployed region

## Recommended Failure Scenarios (Knowledge Base)

At minimum, include these patterns:

1. **Cavitation**: Low pressure + high vibration → insufficient NPSH → check suction line, fluid level, impeller
2. **Bearing failure**: Grinding noise + vibration → worn bearings → replace bearings, check alignment
3. **Seal leak**: Fluid leaking from pump body → worn mechanical seal → replace seal, check for scoring on shaft
4. **Impeller damage**: Loss of flow + noise → erosion or impact damage → inspect and replace impeller
5. **Motor overload**: Tripping breaker + high current → misalignment or blocked discharge → check alignment, clear blockage
6. **Air binding**: Intermittent flow + gurgling → air trapped in pump → vent air, check suction seal
7. **Overheating**: High motor/bearing temperature → insufficient cooling or lubrication → check lubrication, cooling water flow

## Security Notes (MVP)

- **No sensitive data**: Symptom descriptions are not PII or confidential
- **Public access acceptable**: No login required in MVP
- **API abuse risk**: Rate limiting deferred to post-MVP
- **Bedrock costs**: Monitor usage to avoid surprise bills (each diagnosis = one Bedrock API call)

## Roadmap (Post-MVP)

- OpenSearch Serverless with vector embeddings for RAG-based retrieval
- DynamoDB for conversation persistence (session history)
- Amplify Gen 2 auth (Cognito) for user accounts
- WhatsApp Business API integration for field technicians
- Admin UI for adding/editing failure scenarios
- CloudWatch dashboard for monitoring usage and model performance

## Design System

### Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary accent | Steel blue | `#2563EB` | CTA buttons, links, active states, confidence badge (High) |
| Alert / escalation | Amber | `#F59E0B` | Likely Cause card section, Medium confidence badge |
| Danger | Red | `#DC2626` | Low confidence badge, error states |
| Success | Green | `#16A34A` | High confidence badge |
| Surface | Light gray | `#F3F4F6` | Symptom field background, page background |
| Text primary | Near-black | `#111827` | Headings, body copy |
| Text secondary | Medium gray | `#6B7280` | Labels, captions, metadata |
| Card background | White | `#FFFFFF` | Diagnostic card, testimonial card surfaces |
| Border | Subtle gray | `#E5E7EB` | Card borders, dividers |

### Typography

- **Font family**: [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) — load via `<link>` or `@import`
- **Heading scale**: `text-2xl` / `text-3xl` for section headings, `text-xl` for card titles
- **Body**: `text-base` (16px), `leading-relaxed` for readability on long action steps
- **Labels**: `text-xs` uppercase tracking-wide for field labels inside diagnostic cards
- **Font weights**: 400 (body), 500 (UI labels), 600 (card headings), 700 (hero headline)

### Layout Patterns

#### Chat / Diagnostic Interface

- Input at the bottom of the viewport (or centered on first load), results rendered above
- Each submitted symptom + its diagnostic result is a paired exchange, stacked vertically
- **Diagnostic results are structured cards, never plain text bubbles**
- The card is divided into four labeled sections:

  | Section | Accent | Content |
  |---------|--------|---------|
  | Symptom | Gray background (`#F3F4F6`) | Rephrased symptom summary |
  | Likely Cause | Amber left border (`#F59E0B`) | Root cause explanation |
  | Recommended Action | Steel blue left border (`#2563EB`) | Numbered action steps |
  | Confidence | Pill badge | Green / Yellow / Red based on value |

- Cards use a white background, subtle border (`#E5E7EB`), and `rounded-xl` corners
- No chat avatars, no AI/user bubble distinction — the card itself communicates the AI response
- On mobile, cards are full-width; on desktop, max-width `640px` centered

#### Landing Page Structure

The landing page is composed of these sections in order:

1. **Header** — Logo (left) + "Try it now" CTA button (right). Sticky on scroll. Clean white background, bottom border.

2. **Hero** — Full-width section with a real industrial photograph as background (Unsplash/Pexels — pump room, factory floor, or water treatment plant). Dark overlay for text legibility. Contains:
   - Headline: product name + one-line value prop
   - Sub-headline: brief description for technicians
   - Primary CTA button: "Diagnose a Pump Issue" → navigates to chat interface

3. **Failure Category Cards** — Three cards side-by-side (or stacked on mobile) highlighting common failure types. Each card shows:
   - Failure name (e.g., Cavitation, Bearing Failure, Seal Leak)
   - One-sentence description
   - No icons — use a subtle category label or colored tag instead

4. **Testimonials** — Two or three testimonial quotes from maintenance team personas. Each quote shows:
   - Quote text
   - **Initials-based avatar** (e.g., a circle with "JR" in steel blue) — no stock photos of people
   - Name, role, and company (fictional but realistic for industrial context)

5. **Footer** — Product name, tagline, and copyright. Minimal — no link tree.

### Photography Guidelines

- **Hero and any background images**: source from [Unsplash](https://unsplash.com) or [Pexels](https://pexels.com) using search terms like "industrial pump", "factory floor", "maintenance technician", "water treatment plant"
- Use dark overlay (`bg-black/50` or similar) on hero images to ensure text contrast
- No illustrated icons, no AI-generated imagery, no generic tech gradients
- Testimonial section: initials avatars only — no human photography in testimonials

### Tailwind CSS Conventions

- Use Tailwind utility classes throughout; avoid custom CSS except for `font-face` import
- Responsive breakpoints: `sm` (640px) for single-column mobile, `md` (768px) for two-column, `lg` (1024px) for full desktop layout
- Confidence badge classes by value:
  - `high` → `bg-green-100 text-green-800`
  - `medium` → `bg-yellow-100 text-yellow-800`
  - `low` → `bg-red-100 text-red-800`
