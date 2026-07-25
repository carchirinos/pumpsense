# Spec: Case History

**Feature**: Persist diagnostics as cases in DynamoDB; let technicians browse, filter, and resolve cases

**Status**: Draft

**Created**: 2026-07-23

**Context**: Existing SAM stack `pumpsense-backend` (Node.js 24 Lambda, us-east-1) with `POST /diagnose`. React frontend on S3 + CloudFront with EN/ES language toggle.

---

## Requirements (EARS Format)

### Backend — DynamoDB

**REQ-CH1**: **WHEN** the SAM template is deployed, **THEN** a DynamoDB table named `PumpSenseCases` **SHALL** be created with partition key `id` (String) and a `createdAt` sort key (String, ISO 8601).

**REQ-CH2**: **WHEN** the DynamoDB table is defined, **THEN** the Lambda execution role **SHALL** include IAM permissions for `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:UpdateItem`, and `dynamodb:Scan` on the `PumpSenseCases` table ARN.

### Backend — POST /cases

**REQ-CH3**: **WHEN** the Lambda receives a POST request to `/cases` with a JSON body containing `symptom`, `cause`, `action`, and `confidence` fields, **THEN** it **SHALL** generate a unique `id` (UUIDv4), set `status` to `"open"`, set `createdAt` to the current UTC time (ISO 8601), and write the item to DynamoDB.

**REQ-CH4**: **WHEN** a case is successfully created, **THEN** the Lambda **SHALL** return HTTP 201 with the full case object (including `id`, `status`, `createdAt`).

**REQ-CH5**: **WHERE** a required field is missing from the POST /cases body, **THEN** the Lambda **SHALL** return HTTP 400 with `{ "error": "Missing required field: <field>" }`.

### Backend — GET /cases

**REQ-CH6**: **WHEN** the Lambda receives a GET request to `/cases`, **THEN** it **SHALL** scan the `PumpSenseCases` table and return HTTP 200 with a JSON array of all cases sorted by `createdAt` descending (newest first).

**REQ-CH7**: **WHEN** the table contains zero items, **THEN** the response **SHALL** be `[]` (empty array), not an error.

### Backend — PATCH /cases/{id}

**REQ-CH8**: **WHEN** the Lambda receives a PATCH request to `/cases/{id}` with a JSON body containing `status` (either `"resolved"` or `"cancelled"`), `resolutionNote` (string), and `technicianName` (string), **THEN** it **SHALL** update the matching DynamoDB item with those fields plus a `resolvedAt` timestamp (ISO 8601).

**REQ-CH9**: **WHERE** the `status` field in the PATCH body is not `"resolved"` or `"cancelled"`, **THEN** the Lambda **SHALL** return HTTP 400 with `{ "error": "status must be 'resolved' or 'cancelled'" }`.

**REQ-CH10**: **WHERE** `resolutionNote` or `technicianName` is missing or empty in the PATCH body, **THEN** the Lambda **SHALL** return HTTP 400 with `{ "error": "<field> is required" }`.

**REQ-CH11**: **WHERE** no item with the given `id` exists, **THEN** the Lambda **SHALL** return HTTP 404 with `{ "error": "case not found" }`.

### Backend — CORS

**REQ-CH12**: **WHEN** API Gateway receives requests to `/cases` or `/cases/{id}`, **THEN** CORS headers **SHALL** be present (`Access-Control-Allow-Origin: *`) and the `PATCH` method **SHALL** be allowed in `Access-Control-Allow-Methods`.

### Frontend — Automatic case persistence

**REQ-CH13**: **WHEN** the `/diagnose` page receives a successful diagnostic response, **THEN** the frontend **SHALL** immediately call `POST /cases` in the background with the diagnostic payload. A failure to persist **SHALL NOT** block or delay display of the diagnostic card.

**REQ-CH14**: **WHEN** `POST /cases` succeeds, **THEN** the frontend **SHALL** silently store the returned case `id` alongside the card in the history list (for linking purposes in future iterations). No user-facing notification is needed.

### Frontend — Case History page

**REQ-CH15**: **WHEN** a user navigates to `/history`, **THEN** the system **SHALL** display a list of all cases (fetched via `GET /cases`), each showing: truncated symptom (max 80 chars + "…"), status badge, formatted date, and a "Mark as resolved" action button.

**REQ-CH16**: **WHEN** the case list is loading, **THEN** the system **SHALL** display a loading skeleton or spinner.

**REQ-CH17**: **WHEN** the Header is rendered on any page, **THEN** it **SHALL** include a "Case History" navigation link that routes to `/history`.

### Frontend — Filters

**REQ-CH18**: **WHEN** the Case History page is rendered, **THEN** the system **SHALL** display filter controls for: free-text symptom search, technician name, status (open / resolved / cancelled), and date range (from / to).

**REQ-CH19**: **WHEN** multiple filters are active, **THEN** they **SHALL** combine with AND logic — only cases matching all active filters are displayed.

**REQ-CH20**: **WHEN** the free-text symptom search is used, **THEN** matching **SHALL** be case-insensitive and accent-insensitive (using `String.normalize('NFD')` to strip diacritics before comparison).

**REQ-CH21**: **WHEN** the status filter is set, **THEN** the system **SHALL** compare against the English status values stored in DynamoDB (`"open"`, `"resolved"`, `"cancelled"`), regardless of the active UI language.

**REQ-CH22**: **WHEN** a date range filter is applied, **THEN** the system **SHALL** compare against the ISO `createdAt` timestamp, not the displayed formatted date.

**REQ-CH23**: **WHEN** a "Show all" button is clicked, **THEN** all filters **SHALL** reset to their default (empty) state and the full case list **SHALL** display.

**REQ-CH24**: **WHEN** the case list is displayed, **THEN** the system **SHALL** show a result count in the format "Showing X of Y cases" (localised).

**REQ-CH25**: **WHEN** no cases match the active filters, **THEN** the system **SHALL** display an explicit empty-state message (e.g., "No cases match your filters") instead of a blank area.

### Frontend — Mark as resolved

**REQ-CH26**: **WHEN** a technician clicks "Mark as resolved" on a case, **THEN** the system **SHALL** display inline inputs for resolution note (textarea) and technician name (text input), plus "Submit" and "Cancel" buttons.

**REQ-CH27**: **WHEN** the technician submits the resolution form with a valid note and name, **THEN** the system **SHALL** call `PATCH /cases/{id}` with `status: "resolved"`, the note, and the name, and update the case in the list on success.

**REQ-CH28**: **WHERE** either the resolution note or technician name is empty on submit, **THEN** the frontend **SHALL** show an inline validation error and **SHALL NOT** call the API.

**REQ-CH29**: **WHEN** the PATCH request fails, **THEN** the system **SHALL** display an inline error message and keep the form open for retry.

**REQ-CH29a**: **WHEN** a technician clicks "Cancel case" on an open case, **THEN** the system **SHALL** display the same inline form (resolution note + technician name) and on submit call `PATCH /cases/{id}` with `status: "cancelled"`.

**REQ-CH29b**: **WHEN** a case status is `"resolved"` or `"cancelled"`, **THEN** neither the "Mark as resolved" nor the "Cancel case" button **SHALL** be displayed.

### Localisation

**REQ-CH30**: **WHEN** rendering status values, **THEN** the system **SHALL** translate them at render time using the i18n dictionary (e.g., `"open"` → `"Abierto"` in Spanish), but **SHALL** always store and filter using the English value.

**REQ-CH31**: **WHEN** rendering dates, **THEN** the system **SHALL** format them according to the active language locale (`en-US` or `es-ES`) using `Intl.DateTimeFormat`.

**REQ-CH32**: **WHEN** new UI strings are needed (filter labels, buttons, empty state, result count, date labels, status badges), **THEN** they **SHALL** be added to `src/i18n/translations.js` in both `en` and `es` — no hardcoded literals in component JSX.

**REQ-CH33**: **WHEN** the language toggle is changed while viewing the Case History, **THEN** all labels, filter placeholders, status badges, and dates **SHALL** re-render in the new language. Diagnostic content (symptom, cause, action) **SHALL NOT** change — it remains in the language it was generated in.

---

## Design

### DynamoDB Table Schema

**Table name**: `PumpSenseCases`

| Attribute | Type | Key | Description |
|---|---|---|---|
| `id` | String | Partition key | UUIDv4, generated on creation |
| `createdAt` | String | Sort key | ISO 8601 UTC timestamp |
| `symptom` | String | — | Rephrased symptom from Claude |
| `cause` | String | — | Likely root cause |
| `action` | String | — | Recommended action steps |
| `confidence` | String | — | `"high"` / `"medium"` / `"low"` |
| `status` | String | — | `"open"` / `"resolved"` / `"cancelled"` |
| `language` | String | — | Language the diagnostic was generated in (`"en"` or `"es"`) |
| `resolutionNote` | String | — | Free-text note (set on resolve) |
| `technicianName` | String | — | Name of the technician who resolved (set on resolve) |
| `resolvedAt` | String | — | ISO 8601 UTC timestamp (set on resolve) |

> **Billing mode**: PAY_PER_REQUEST (no capacity planning needed for MVP)

### SAM Template Additions

```yaml
  CasesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: PumpSenseCases
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: createdAt
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: createdAt
          KeyType: RANGE

  DiagnosticFunction:
    # ... existing properties ...
    Properties:
      Environment:
        Variables:
          CASES_TABLE: !Ref CasesTable
          # ... existing vars ...
      Policies:
        # ... existing Bedrock policy ...
        - DynamoDBCrudPolicy:
            TableName: !Ref CasesTable
      Events:
        # ... existing DiagnoseApi event ...
        CreateCase:
          Type: Api
          Properties:
            Path: /cases
            Method: POST
            RestApiId: !Ref DiagnosticApi
        GetCases:
          Type: Api
          Properties:
            Path: /cases
            Method: GET
            RestApiId: !Ref DiagnosticApi
        UpdateCase:
          Type: Api
          Properties:
            Path: /cases/{id}
            Method: PATCH
            RestApiId: !Ref DiagnosticApi
```

Update CORS in `DiagnosticApi`:
```yaml
      Cors:
        AllowMethods: "'GET,POST,PATCH,OPTIONS'"
```

### Backend — Handler Routing

The existing `handler.js` currently handles only `POST /diagnose`. Add routing logic at the top:

```javascript
export async function handler(event, context) {
  const { httpMethod, path, pathParameters } = event;

  // Route to appropriate handler
  if (path === '/diagnose' && httpMethod === 'POST') return handleDiagnose(event, context);
  if (path === '/cases' && httpMethod === 'POST')    return handleCreateCase(event, context);
  if (path === '/cases' && httpMethod === 'GET')     return handleGetCases(event, context);
  if (path.startsWith('/cases/') && httpMethod === 'PATCH') return handleUpdateCase(event, context);
  if (httpMethod === 'OPTIONS') return response(200, {});

  return response(404, { error: 'Not found' });
}
```

### Backend — New Module: `backend/cases.js`

```javascript
// Exports: createCase, getCases, updateCase
// Uses: DynamoDBClient, PutItemCommand, ScanCommand, UpdateItemCommand
// Table name from process.env.CASES_TABLE
```

**`createCase(body)`** — validates fields, generates UUID + timestamp, PutItem, returns 201 + full item.

**`getCases()`** — Scan (acceptable for MVP volume), sort by `createdAt` desc in JS, returns array.

**`updateCase(id, body)`** — validates status/resolutionNote/technicianName, UpdateItem with ConditionExpression `attribute_exists(id)`, returns 200 + updated item. Returns 404 if condition fails.

### API Data Models

#### POST /cases

**Request**:
```json
{
  "symptom": "string",
  "cause": "string",
  "action": "string",
  "confidence": "high | medium | low",
  "language": "en | es"
}
```

**Response (201)**:
```json
{
  "id": "uuid",
  "symptom": "...",
  "cause": "...",
  "action": "...",
  "confidence": "high",
  "language": "en",
  "status": "open",
  "createdAt": "2026-07-23T14:30:00.000Z"
}
```

#### GET /cases

**Response (200)**:
```json
[
  {
    "id": "...",
    "symptom": "...",
    "cause": "...",
    "action": "...",
    "confidence": "high",
    "language": "en",
    "status": "open",
    "createdAt": "2026-07-23T14:30:00.000Z"
  },
  {
    "id": "...",
    "status": "resolved",
    "resolutionNote": "Replaced bearings, realigned shaft",
    "technicianName": "Carlos M.",
    "resolvedAt": "2026-07-23T16:00:00.000Z",
    "..."
  }
]
```

#### PATCH /cases/{id}

**Request**:
```json
{
  "status": "resolved",
  "resolutionNote": "Replaced bearings, verified alignment",
  "technicianName": "Carlos M."
}
```

**Response (200)**: Full updated case object.

### Frontend — New Files

```
src/
├── pages/
│   └── CaseHistory.jsx        # Main page: fetches cases, renders filters + list
├── components/
│   └── CaseHistory/
│       ├── CaseFilters.jsx    # Filter controls (search, status, tech name, dates)
│       ├── CaseList.jsx       # Maps over filtered cases, renders CaseCard
│       ├── CaseCard.jsx       # Single case row: truncated symptom, badge, date, resolve/cancel actions
│       └── ResolveForm.jsx    # Inline form for both resolve and cancel: note + tech name + submit
├── services/
│   └── cases.js               # API: createCase, getCases, updateCase
```

### Frontend — Filter Logic (client-side)

```javascript
function filterCases(cases, filters) {
  return cases.filter((c) => {
    // Free-text symptom search — accent-insensitive
    if (filters.search) {
      const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (!normalize(c.symptom).includes(normalize(filters.search))) return false;
    }
    // Technician name (partial, case-insensitive)
    if (filters.technicianName) {
      if (!c.technicianName?.toLowerCase().includes(filters.technicianName.toLowerCase())) return false;
    }
    // Status — compare against English stored value
    if (filters.status && c.status !== filters.status) return false;
    // Date range — compare ISO strings
    if (filters.from && c.createdAt < filters.from) return false;
    if (filters.to && c.createdAt > filters.to + 'T23:59:59.999Z') return false;
    return true;
  });
}
```

### Frontend — Routing Update

Add to `App.jsx`:
```jsx
import CaseHistory from './pages/CaseHistory';
// ...
<Route path="/history" element={<CaseHistory />} />
```

Add to `Header.jsx` — a "Case History" link between the language toggle and CTA button.

### Frontend — Auto-persist from Diagnose

In `Diagnose.jsx`, after `const result = await diagnose(symptom, lang)`:
```javascript
// Fire-and-forget: persist as a case in the background.
// A failed save must NEVER block or alter the diagnostic card shown to the user.
createCase({ ...result, language: lang }).catch((err) => {
  console.error('[PumpSense] Failed to persist case:', err.message);
});
```

### i18n Additions

New keys to add to `translations.js`:

```
'history.pageTitle'        — "Case History" / "Historial de Casos"
'history.pageSubtitle'     — ...
'history.filterSearch'     — "Search symptoms" / "Buscar síntomas"
'history.filterStatus'     — "Status" / "Estado"
'history.filterTechnician' — "Technician" / "Técnico"
'history.filterFrom'       — "From" / "Desde"
'history.filterTo'         — "To" / "Hasta"
'history.showAll'          — "Show all" / "Mostrar todos"
'history.resultCount'      — "Showing {x} of {y} cases" / "Mostrando {x} de {y} casos"
'history.emptyState'       — "No cases match your filters" / "No hay casos que coincidan"
'history.noData'           — "No cases recorded yet" / "Aún no hay casos registrados"
'history.resolve'          — "Mark as resolved" / "Marcar como resuelto"
'history.cancelCase'       — "Cancel case" / "Cancelar caso"
'history.cancel'           — "Cancel" / "Cancelar"
'history.submit'           — "Submit" / "Enviar"
'history.notePlaceholder'  — "Resolution note..." / "Nota de resolución..."
'history.namePlaceholder'  — "Your name" / "Tu nombre"
'history.nameLabel'        — "Technician name" / "Nombre del técnico"
'history.noteLabel'        — "Resolution note" / "Nota de resolución"
'history.link'             — "Case History" / "Historial"
'status.open'              — "Open" / "Abierto"
'status.resolved'          — "Resolved" / "Resuelto"
'status.cancelled'         — "Cancelled" / "Cancelado"
```

### Status Badge Styling (consistent with design system)

| Status | Tailwind classes |
|---|---|
| `open` | `bg-blue-100 text-blue-800` |
| `resolved` | `bg-green-100 text-green-800` |
| `cancelled` | `bg-gray-100 text-gray-800` |

---

## Task Breakdown

### Phase 1: Backend Infrastructure

**TASK-CH1**: Update `template.yaml` — add DynamoDB table, new API events (POST/GET/PATCH /cases), IAM permissions, CORS update
- **Acceptance**: `sam validate` passes; `sam build` succeeds
- **Effort**: 30 min

**TASK-CH2**: Add `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` to `backend/package.json`
- **Acceptance**: `npm install` clean; imports resolve
- **Effort**: 5 min

### Phase 2: Backend Cases Module

**TASK-CH3**: Create `backend/cases.js` — implement `createCase`, `getCases`, `updateCase` functions using DynamoDB Document Client
- **Acceptance**: Each function performs the correct DynamoDB operation; validation returns proper errors; `getCases` returns results sorted by `createdAt` descending (newest first)
- **Effort**: 60 min

**TASK-CH4**: Update `backend/handler.js` — add route dispatch for `/cases` (POST, GET) and `/cases/{id}` (PATCH)
- **Acceptance**: `sam local start-api` correctly routes all endpoints; existing `/diagnose` still works
- **Effort**: 30 min

### Phase 3: Backend Testing

**TASK-CH5**: Create test events (`events/create-case.json`, `events/get-cases.json`, `events/patch-case.json`) and test locally
- **Acceptance**: Create returns 201 with ID; Get returns array sorted newest-first; Patch updates status; error cases return correct HTTP codes
- **Effort**: 30 min

**TASK-CH6**: Deploy updated backend (`sam build && sam deploy`) and smoke-test live endpoints with `curl`
- **Acceptance**: All three endpoints work against the deployed DynamoDB table; CORS headers present
- **Effort**: 20 min

### Phase 4: Frontend API Service & i18n

**TASK-CH15**: Add all new i18n keys to `translations.js` (both `en` and `es`) — must be done before building any Case History components so they use `t('key')` from day one, never hardcoded strings
- **Acceptance**: All keys listed in the i18n Additions section exist in both `en` and `es`; includes "Cancel case" action labels
- **Effort**: 25 min

**TASK-CH7**: Create `src/services/cases.js` — `createCase`, `getCases`, `updateCase` functions
- **Acceptance**: Functions correctly call POST/GET/PATCH and parse responses
- **Effort**: 20 min

**TASK-CH8**: Update `Diagnose.jsx` to call `createCase` in the background after a successful diagnostic
- **Acceptance**: Diagnostic flow unchanged from user perspective; case appears in DynamoDB after a diagnosis. If `createCase` fails, the error is logged to `console.error` but the diagnostic card is **still displayed normally** — a failed case save must never block or alter the result shown to the user.
- **Effort**: 15 min

### Phase 5: Frontend Case History Page

**TASK-CH9**: Create `CaseHistory.jsx` page shell + routing + Header link
- **Acceptance**: `/history` renders a page; Header link visible and navigates correctly
- **Effort**: 20 min

**TASK-CH10**: Build `CaseFilters.jsx` — search input, status dropdown, technician name input, date range pickers, "Show all" button
- **Acceptance**: All controls render using `t('key')` for labels/placeholders; state flows up to parent via onChange; "Show all" resets all fields
- **Effort**: 45 min

**TASK-CH11**: Build `CaseCard.jsx` — displays truncated symptom, status badge, formatted date, "Mark as resolved" button, and a "Cancel case" button for open cases
- **Acceptance**: Symptom truncated at 80 chars; badge colors match design system; date formatted per locale; both "Mark as resolved" and "Cancel case" actions visible on open cases
- **Effort**: 30 min

**TASK-CH12**: Build `ResolveForm.jsx` — inline form for both resolve and cancel actions: resolution note textarea + technician name input + submit/cancel buttons. When triggered as "cancel", the form calls PATCH with `status: "cancelled"` instead of `"resolved"`.
- **Acceptance**: Validation prevents empty submissions; successful submit calls PATCH with correct status; cancel hides the form; works for both resolve and cancel flows
- **Effort**: 35 min

**TASK-CH13**: Build `CaseList.jsx` — maps over filtered cases, shows result count, handles empty state, displays a loading skeleton/spinner while `GET /cases` is in flight
- **Acceptance**: Loading state visible during fetch; "Showing X of Y" visible after load; empty-state message shows when no matches; list updates when filters change
- **Effort**: 30 min

**TASK-CH14**: Assemble `CaseHistory.jsx` — integrate filters + list, implement `filterCases` logic with AND semantics
- **Acceptance**: All filter combinations work; accent-insensitive search works; status filter compares English values only
- **Effort**: 40 min

### Phase 6: Localisation Polish

**TASK-CH16**: Implement locale-aware date formatting using `Intl.DateTimeFormat` and verify status badges display translated text
- **Acceptance**: Dates format correctly in both locales; status shows "Abierto"/"Resuelto"/"Cancelado" in Spanish mode
- **Effort**: 20 min

### Phase 7: Integration & Deploy

**TASK-CH17**: End-to-end test — submit a diagnosis, verify it appears in Case History, resolve it, cancel another, verify filters work
- **Acceptance**: Full flow works in both languages; resolved case shows technician name and note; cancelled case shows same; cancelled filter works
- **Effort**: 30 min

**TASK-CH18**: Build and deploy frontend — `npm run build`, sync to S3, invalidate CloudFront
- **Acceptance**: `/history` deep-link works; full case history flow works on the live CloudFront URL
- **Effort**: 15 min

---

## Dependencies

- `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` (backend)
- Existing: `react-router-dom`, `tailwindcss`, `@tailwindcss/vite`, i18n context

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| DynamoDB Scan cost at scale | Low (MVP) | Acceptable for MVP; add GSI + Query if case volume grows beyond hundreds |
| Race condition: case created but PATCH with wrong ID | Low | UUID is generated server-side and returned to client; client stores it |
| Diagnostic succeeds but POST /cases fails silently | Low | Fire-and-forget is intentional for MVP; add retry queue post-MVP if needed |
| CORS missing PATCH method | Medium | Explicitly add PATCH to `AllowMethods` in SAM template |
| Accent-insensitive search missing edge cases | Low | `NFD` + diacritics strip covers Spanish; extend for other scripts if needed later |

## Future Enhancements

- Pagination for GET /cases (query params: `limit`, `lastKey`)
- GSI on `status` + `createdAt` for efficient filtered queries server-side
- Export cases as CSV/PDF for compliance reporting
- Case detail page with full diagnostic card + resolution history
- Notification when a case is resolved (email or push)

---

## References

- #[[file:.kiro/steering/tech.md]] — Technical architecture, design system
- #[[file:.kiro/specs/backend-diagnostic-flow.md]] — Existing backend API contract
- #[[file:.kiro/specs/frontend.md]] — Frontend architecture, i18n pattern
