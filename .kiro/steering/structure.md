# PumpSense — Project Structure

## Repository Layout

```
pump-diagnostic-agent/
├── .kiro/
│   └── steering/
│       ├── product.md       # Product definition, user flow, MVP scope
│       ├── tech.md          # Architecture, data models, deployment requirements
│       └── structure.md     # This file — project layout and conventions
│
├── frontend/                # React single-page application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage/
│   │   │   │   ├── Hero.jsx          # Header with real industrial photography
│   │   │   │   ├── FailureCategories.jsx  # Example pump failure cards
│   │   │   │   ├── Testimonials.jsx  # Social proof section
│   │   │   │   └── CallToAction.jsx  # CTA to open the chat
│   │   │   ├── DiagnosticChat/
│   │   │   │   ├── ChatInput.jsx     # Symptom description form
│   │   │   │   └── DiagnosticCard.jsx  # Structured result: cause/action/confidence
│   │   │   └── common/
│   │   │       ├── Header.jsx        # Site nav
│   │   │       └── Footer.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx           # Composes landing page sections
│   │   │   └── Diagnose.jsx          # Chat interface page
│   │   ├── services/
│   │   │   └── api.js                # Calls API Gateway endpoint
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js (or equivalent)
│
├── backend/                 # AWS Lambda function
│   ├── handler.js (or handler.py)    # Lambda entry point
│   ├── knowledgeBase.js (or .py)     # Hardcoded failure scenarios
│   ├── prompt.js (or .py)            # Prompt construction for Claude
│   └── package.json (if Node)
│
├── infra/                   # Infrastructure as Code (optional but recommended)
│   ├── template.yaml         # AWS SAM template
│   └── README.md             # Deploy instructions
│
├── .env.example             # Frontend env vars template (API Gateway URL)
└── README.md                # Project overview + deployment instructions
```

## Key Files and Responsibilities

### Frontend

| File | Responsibility |
|------|---------------|
| `src/pages/Landing.jsx` | Assembles Hero, FailureCategories, Testimonials, CTA |
| `src/pages/Diagnose.jsx` | Chat interface: takes symptom input, shows DiagnosticCard |
| `src/components/DiagnosticChat/DiagnosticCard.jsx` | Renders structured result (symptom / cause / action / confidence) |
| `src/services/api.js` | `POST /diagnose` to API Gateway, returns JSON response |
| `src/components/LandingPage/Hero.jsx` | Real photo background (Unsplash/Pexels), headline, CTA button |

### Backend

| File | Responsibility |
|------|---------------|
| `backend/handler.js` | Lambda handler: receives event, calls Bedrock, returns response |
| `backend/knowledgeBase.js` | Array of hardcoded failure scenarios (symptoms / cause / action) |
| `backend/prompt.js` | Builds the system + user prompt string injected with KB context |

### Infrastructure

| File | Responsibility |
|------|---------------|
| `infra/template.yaml` | Defines Lambda, API Gateway, IAM role (AWS SAM template) |

## Naming Conventions

- **Components**: PascalCase files and component names (`DiagnosticCard.jsx`)
- **Services/utilities**: camelCase files (`api.js`, `knowledgeBase.js`)
- **Lambda handler export**: `handler` (e.g., `exports.handler` or `def handler(event, context)`)
- **CSS**: Use Tailwind utility classes; avoid inline styles except for dynamic values
- **Environment variables**: `VITE_API_GATEWAY_URL` for frontend, `BEDROCK_MODEL_ID` for Lambda

## Environment Variables

### Frontend (`.env`)
```
VITE_API_GATEWAY_URL=https://<api-id>.execute-api.<region>.amazonaws.com/prod
```

### Lambda (set via SAM template Environment section)
```
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-6
AWS_REGION=us-east-1  (or whichever region Bedrock is available)
```

## API Contract

### POST `/diagnose`

**Request body:**
```json
{
  "symptom": "string — technician's description of what they observe"
}
```

**Response body (success):**
```json
{
  "symptom": "string — rephrased symptom summary",
  "cause": "string — likely root cause",
  "action": "string — recommended next steps (may be multiline)",
  "confidence": "high | medium | low"
}
```

**Response body (error):**
```json
{
  "error": "string — human-readable error message"
}
```

**HTTP methods supported**: `POST`, `OPTIONS` (for CORS preflight)

## Deployment Artifacts

After a successful build and deploy:

| Artifact | Location | Purpose |
|----------|----------|---------|
| Frontend bundle | S3 bucket + CloudFront | Public-facing web app |
| Lambda zip | `.aws-sam/build/` | Backend API logic (built by SAM) |
| API Gateway endpoint | SAM stack outputs | URL used by frontend |
| CloudFront URL | AWS console or separate setup | Share with judges |

## Development Workflow

1. **Local backend dev**: Test Lambda handler locally with `sam local invoke` or `sam local start-api`
2. **Local frontend dev**: `npm run dev` (Vite) with `VITE_API_GATEWAY_URL` pointing to deployed API Gateway or local SAM API
3. **Deploy backend**: `sam build && sam deploy` — outputs API Gateway URL in stack outputs
4. **Deploy frontend**: `npm run build` → sync to S3 → invalidate CloudFront cache
5. **Smoke test**: POST to `/diagnose` with a sample symptom, verify full diagnostic card renders

## Conventions for Diagnostic Card UI

The DiagnosticCard component should render four clearly labeled fields:

- **Symptom**: What the technician reported (light gray background)
- **Likely Cause**: Primary diagnosis (amber/orange accent — suggests urgency)
- **Recommended Action**: Numbered steps (blue accent — actionable)
- **Confidence**: Badge/pill: green (High), yellow (Medium), red (Low)

This should look like a work-order card, not a chat bubble.
