# Spec: Frontend — Landing Page & Chat Interface

**Feature**: React (Vite) single-page application for PumpSense

**Status**: Draft

**Created**: 2026-07-23

**Backend endpoint**: `https://wkkd29tjza.execute-api.us-east-1.amazonaws.com/prod/diagnose`

---

## Requirements (EARS Format)

### Landing Page

**REQ-F1**: **WHEN** a user opens the application URL, **THEN** the system **SHALL** display the landing page with the following sections in order: Header, Hero, Failure Category Cards, Testimonials, Footer.

**REQ-F2**: **WHEN** the landing page is rendered, **THEN** the Header **SHALL** display the PumpSense logo on the left and a "Try it now" CTA button on the right, and **SHALL** remain sticky on scroll with a white background and bottom border.

**REQ-F3**: **WHEN** the landing page is rendered, **THEN** the Hero section **SHALL** display a full-width industrial photograph background (sourced from Unsplash or Pexels) with a dark overlay (`bg-black/50`), a headline, a sub-headline, and a "Diagnose a Pump Issue" CTA button.

**REQ-F4**: **WHEN** a user clicks any CTA button ("Try it now" or "Diagnose a Pump Issue"), **THEN** the system **SHALL** navigate to the chat interface page (`/diagnose`).

**REQ-F5**: **WHEN** the landing page is rendered, **THEN** the Failure Category Cards section **SHALL** display exactly three cards (Cavitation, Bearing Failure, Seal Leak) each showing a failure name, a one-sentence description, and a colored category tag — no icons or illustrations.

**REQ-F6**: **WHEN** the landing page is rendered, **THEN** the Testimonials section **SHALL** display at least two testimonial cards, each containing a quote, an initials-based avatar (colored circle with 2-letter initials in steel blue `#2563EB`), and the persona's name, role, and company.

**REQ-F7**: **WHEN** the landing page is rendered, **THEN** the Footer **SHALL** display the product name, tagline, and copyright year — no navigation links.

**REQ-F8**: **WHEN** the viewport width is below 640px, **THEN** the Failure Category Cards **SHALL** stack vertically into a single column.

**REQ-F9**: **WHERE** the landing page is displayed on desktop (viewport ≥ 1024px), **THEN** the Failure Category Cards **SHALL** display in a three-column grid.

### Chat Interface

**REQ-F10**: **WHEN** a user navigates to `/diagnose`, **THEN** the system **SHALL** display a symptom input field and a submit button, centered on the page on first load.

**REQ-F11**: **WHEN** the input field is empty and the submit button is clicked, **THEN** the system **SHALL** display an inline validation message "Please describe the symptom before submitting" and **SHALL NOT** send a request to the API.

**REQ-F12**: **WHEN** a user submits a non-empty symptom description, **THEN** the system **SHALL** send a POST request to `https://wkkd29tjza.execute-api.us-east-1.amazonaws.com/prod/diagnose` with body `{ "symptom": "<input value>", "language": "<active language code>" }`.

**REQ-F12a**: **WHEN** sending a diagnosis request, **THEN** the `language` field **SHALL** reflect the currently selected language in the UI (`"en"` or `"es"`), defaulting to `"en"`.

**REQ-F13**: **WHILE** waiting for the API response, **THEN** the system **SHALL** display a loading state on the submit button (spinner or disabled state with "Analyzing…" label) and **SHALL** disable the input and button to prevent duplicate submissions.

**REQ-F14**: **WHEN** the API returns a successful response, **THEN** the system **SHALL** render a Diagnostic Card with four labeled sections: Symptom (gray background), Likely Cause (amber left border `#F59E0B`), Recommended Action (steel blue left border `#2563EB`), and a Confidence badge pill.

**REQ-F15**: **WHEN** rendering the Confidence badge, **THEN** the system **SHALL** apply the following Tailwind classes based on value:
- `high` → `bg-green-100 text-green-800`
- `medium` → `bg-yellow-100 text-yellow-800`
- `low` → `bg-red-100 text-red-800`

**REQ-F16**: **WHEN** multiple diagnoses have been submitted in a session, **THEN** the system **SHALL** display all Diagnostic Cards stacked vertically above the input, with the most recent card at the top.

**REQ-F17**: **WHEN** the API returns an error response (4xx or 5xx) or the network request fails, **THEN** the system **SHALL** display an inline error message below the input field and **SHALL** re-enable the input and button for retry.

**REQ-F18**: **WHEN** the Recommended Action text contains newline characters (`\n`), **THEN** the system **SHALL** render each step on a new line (preserving the numbered list format).

**REQ-F19**: **WHEN** the chat interface is rendered, **THEN** the Header **SHALL** remain visible at the top with a "← Back" link to the landing page.

### Design & Accessibility

**REQ-F20**: **WHEN** any page is rendered, **THEN** the system **SHALL** load the Inter font family from Google Fonts and apply it as the base font across the entire application.

**REQ-F21**: **WHERE** the application uses color alone to convey meaning (e.g., confidence badges), **THEN** the system **SHALL** also include a text label so the information is not lost for users with color vision deficiency.

**REQ-F22**: **WHEN** the submit button or any interactive element is focused via keyboard, **THEN** the system **SHALL** display a visible focus ring.

**REQ-F23**: **WHEN** the application is rendered, **THEN** all images **SHALL** include descriptive `alt` attributes, and all form inputs **SHALL** have associated `<label>` elements.

### Internationalisation (i18n)

**REQ-F26**: **WHEN** the application is rendered, **THEN** the Header **SHALL** display a language toggle button showing the code of the inactive language (`"ES"` when English is active, `"EN"` when Spanish is active).

**REQ-F27**: **WHEN** the language toggle is clicked, **THEN** the system **SHALL** switch all static UI text to the selected language without a page reload.

**REQ-F28**: **WHEN** the language is switched, **THEN** all static UI strings (hero copy, category cards, testimonial labels, chat interface labels, card section headers, confidence badge labels, error messages, button labels) **SHALL** update immediately.

**REQ-F29**: **WHEN** the application initialises, **THEN** the default language **SHALL** be English (`"en"`).

**REQ-F30**: **WHEN** all static strings are defined, **THEN** they **SHALL** be sourced from a centralised translations dictionary (`src/i18n/translations.js`) and never hardcoded directly in component JSX.

### Build & Deployment

**REQ-F24**: **WHEN** `npm run build` is executed, **THEN** Vite **SHALL** produce a production bundle in the `dist/` directory suitable for S3 static hosting.

**REQ-F25**: **WHEN** the application is accessed via a direct URL (e.g., `/diagnose`), **THEN** the S3/CloudFront configuration **SHALL** serve `index.html` for all routes to support client-side routing.

---

## Design

### Application Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── LandingPage/
│   │   │   ├── Header.jsx          # Sticky nav: logo + language toggle + CTA button
│   │   │   ├── Hero.jsx            # Full-width photo background + CTA
│   │   │   ├── FailureCategories.jsx  # 3-column card grid
│   │   │   ├── Testimonials.jsx    # Quote cards with initials avatars
│   │   │   └── Footer.jsx          # Minimal footer
│   │   └── DiagnosticChat/
│   │       ├── ChatInput.jsx       # Textarea + submit button + validation
│   │       ├── DiagnosticCard.jsx  # 4-section structured result card
│   │       └── LoadingSpinner.jsx  # Reusable inline spinner
│   ├── context/
│   │   └── LanguageContext.jsx     # LanguageProvider + useLanguage hook
│   ├── i18n/
│   │   └── translations.js         # EN/ES string dictionary
│   ├── pages/
│   │   ├── Landing.jsx             # Composes all landing page sections
│   │   └── Diagnose.jsx            # Chat interface: input + card history
│   ├── services/
│   │   └── api.js                  # POST /diagnose with language param
│   ├── App.jsx                     # Router wrapped in LanguageProvider
│   └── main.jsx                    # Vite entry point
├── index.html
├── package.json
└── vite.config.js
```

### Routing

- `/` → `Landing.jsx`
- `/diagnose` → `Diagnose.jsx`
- Client-side routing via `react-router-dom`
- All unknown routes redirect to `/`

### Component Design

#### `Header.jsx` (Landing)
- Sticky top bar: `sticky top-0 z-50 bg-white border-b border-gray-200`
- Left: "PumpSense" wordmark in `font-semibold text-gray-900`
- Right: "Try it now" button in steel blue `bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2`
- Links to `/diagnose`

#### `Hero.jsx`
- Full-viewport-height section (`min-h-screen` or `min-h-[600px]`)
- Background: Unsplash image URL in `style={{ backgroundImage: "url(...)" }}` with `bg-cover bg-center`
- Overlay: `absolute inset-0 bg-black/50`
- Content: centered `text-white`, headline `text-4xl font-bold`, sub-headline `text-lg text-gray-200`
- CTA button: `bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 rounded-xl`

```
Suggested Unsplash photo: https://images.unsplash.com/photo-1581091226033-d5c48150dbaa
(industrial pump machinery, well-lit factory floor)
```

#### `FailureCategories.jsx`
- Section heading: "Common Failure Patterns" — `text-2xl font-semibold text-gray-900`
- Grid: `grid grid-cols-1 md:grid-cols-3 gap-6`
- Three hardcoded cards:

  | Failure | Tag color | Description |
  |---------|-----------|-------------|
  | Cavitation | Amber | Vapor bubble collapse erodes the impeller and causes pressure loss |
  | Bearing Failure | Blue | Worn or under-lubricated bearings produce grinding noise and heat |
  | Seal Leak | Red | Damaged mechanical seals allow fluid to escape around the shaft |

- Card: `bg-white border border-gray-200 rounded-xl p-6`
- Category tag: small colored pill above failure name (`text-xs font-medium px-2 py-1 rounded-full`)

#### `Testimonials.jsx`
- Section heading: "Trusted by Maintenance Teams"
- Grid: `grid grid-cols-1 md:grid-cols-2 gap-6` (2 testimonials on desktop)
- Testimonial card: `bg-white border border-gray-200 rounded-xl p-6`
- Initials avatar: `w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold`

  | Persona | Initials | Quote |
  |---------|----------|-------|
  | James R., Senior Maintenance Tech, Gulf Coast Refinery | JR | "Diagnosed a cavitation issue in under a minute. Used to take us half a day of back-and-forth." |
  | Maria C., Plant Engineer, Midwest Water Authority | MC | "The action steps are specific enough to hand straight to the crew. No interpretation needed." |
  | Derek T., Reliability Engineer, Pacific Industrial | DT | "We caught a bearing failure early because of PumpSense. Saved us an unplanned shutdown." |

#### `Footer.jsx`
- Dark background: `bg-gray-900 text-gray-400`
- Content: "PumpSense — AI diagnostics for industrial pumps" + "© 2026"
- No navigation links

#### `ChatInput.jsx`
- `<textarea>` with `<label>`: "Describe what you observe" — `text-sm font-medium text-gray-700`
- Placeholder: `"e.g. The pump is vibrating hard and lost pressure..."`
- Styled: `w-full border border-gray-300 rounded-xl p-3 text-base resize-none focus:ring-2 focus:ring-blue-600`
- Submit button: "Run Diagnosis" — steel blue, full-width on mobile, auto-width on desktop
- Loading state: button shows spinner + "Analyzing…", `disabled` on both input and button
- Validation error: `text-sm text-red-600 mt-1` below textarea

#### `DiagnosticCard.jsx`

Props: `{ symptom, cause, action, confidence }`

```
┌─────────────────────────────────────────┐
│  DIAGNOSTIC RESULT                      │  ← card header, text-xs uppercase gray
├─────────────────────────────────────────┤
│  SYMPTOM                                │  ← label text-xs uppercase
│  [symptom text]                bg-gray  │
├─────────────────────────────────────────┤
│ ▌ LIKELY CAUSE                          │  ← amber left border
│  [cause text]                           │
├─────────────────────────────────────────┤
│ ▌ RECOMMENDED ACTION                    │  ← blue left border
│  1. Step one                            │
│  2. Step two                            │
│  ...                                    │
├─────────────────────────────────────────┤
│  Confidence  [HIGH ●]                   │  ← pill badge
└─────────────────────────────────────────┘
```

- Card wrapper: `bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm`
- Card header bar: `bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs font-medium uppercase tracking-widest text-gray-500`
- Symptom section: `bg-gray-50 px-4 py-3`
- Cause section: `border-l-4 border-amber-400 px-4 py-3`
- Action section: `border-l-4 border-blue-600 px-4 py-3`; split `action` on `\n` and render as `<p>` per line
- Confidence row: `px-4 py-3 flex items-center gap-2`; badge uses Tailwind classes from design system

#### `api.js`

```javascript
const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

export async function diagnose(symptom, language = 'en') {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptom, language }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed (${response.status})`);
  }
  return response.json(); // { symptom, cause, action, confidence }
}
```

#### `Diagnose.jsx` State Machine

```
idle
  → user types symptom
  → submit clicked

loading
  → POST /diagnose in flight
  → input + button disabled
  → spinner shown

success
  → DiagnosticCard prepended to history list
  → input cleared, re-enabled
  → returns to idle (ready for next symptom)

error
  → error message shown below input
  → input + button re-enabled
  → user can edit and retry
```

State shape:
```javascript
const [history, setHistory]     = useState([]); // DiagnosticCard[]
const [symptom, setSymptom]     = useState('');
const [status, setStatus]       = useState('idle'); // 'idle' | 'loading' | 'error'
const [errorMsg, setErrorMsg]   = useState('');
```

### Environment Variables

```
# frontend/.env
VITE_API_GATEWAY_URL=https://wkkd29tjza.execute-api.us-east-1.amazonaws.com/prod/diagnose
```

```
# frontend/.env.example  (committed to repo)
VITE_API_GATEWAY_URL=https://<api-id>.execute-api.<region>.amazonaws.com/prod/diagnose
```

### S3 + CloudFront Deployment

- Build output: `frontend/dist/`
- S3 bucket: static website hosting enabled, public read via bucket policy
- CloudFront: origin points to S3 bucket, default root object `index.html`
- **SPA routing fix**: CloudFront custom error response — 403/404 → `index.html` with HTTP 200, so `/diagnose` deep links work
- Deploy commands:
  ```bash
  npm run build
  aws s3 sync dist/ s3://<bucket-name> --delete
  aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
  ```

---

## Task Breakdown

### Phase 1: Project Setup

**TASK-F1**: Initialize Vite + React project
- **Details**: `npm create vite@latest frontend -- --template react`, install dependencies: `react-router-dom`, `tailwindcss`, `autoprefixer`, `postcss`
- **Acceptance**: `npm run dev` serves app at localhost, Tailwind classes apply correctly
- **Effort**: 20 min

**TASK-F2**: Configure Tailwind and Inter font
- **Details**: Initialize `tailwind.config.js` with content paths, add Inter import to `index.html` (`<link>` from Google Fonts), set `font-family: 'Inter', sans-serif` in Tailwind base layer or CSS
- **Acceptance**: Inter font renders in browser, Tailwind utility classes resolve without errors
- **Effort**: 15 min

**TASK-F3**: Set up routing and page shells
- **Details**: Configure `react-router-dom` in `App.jsx` with routes `/` → `Landing` and `/diagnose` → `Diagnose`; create empty page components; add `.env` with `VITE_API_GATEWAY_URL`
- **Acceptance**: Navigating to `/` and `/diagnose` renders the correct page shell; `.env.example` committed
- **Effort**: 20 min

### Phase 2: API Service

**TASK-F4**: Implement `src/services/api.js`
- **Details**: `diagnose(symptom)` function using `fetch`, throws on non-ok responses, returns parsed JSON
- **Acceptance**: Function correctly POSTs to the endpoint, returns `{ symptom, cause, action, confidence }` on success, throws with message on error
- **Effort**: 20 min

### Phase 3: Landing Page

**TASK-F5**: Build `Header.jsx`
- **Details**: Sticky nav with PumpSense wordmark + "Try it now" button linking to `/diagnose`
- **Acceptance**: Stays fixed on scroll, button navigates to `/diagnose`, correct colors and border
- **Effort**: 20 min

**TASK-F6**: Build `Hero.jsx`
- **Details**: Full-width section with Unsplash industrial photo as CSS background, dark overlay, headline, sub-headline, "Diagnose a Pump Issue" CTA button
- **Acceptance**: Photo fills section, text is legible over the overlay, CTA navigates to `/diagnose`
- **Effort**: 30 min

**TASK-F7**: Build `FailureCategories.jsx`
- **Details**: Three hardcoded cards (Cavitation, Bearing Failure, Seal Leak) with category tag, name, description; responsive grid (1 col mobile → 3 col desktop)
- **Acceptance**: Cards render correctly at mobile and desktop breakpoints, no icons present
- **Effort**: 30 min

**TASK-F8**: Build `Testimonials.jsx`
- **Details**: Two or three testimonial cards with quote, initials avatar (blue circle), name/role/company
- **Acceptance**: Avatars render as colored circles with initials, no human photos, layout responsive
- **Effort**: 25 min

**TASK-F9**: Build `Footer.jsx` and assemble `Landing.jsx`
- **Details**: Minimal dark footer with product name + copyright; `Landing.jsx` composes Header → Hero → FailureCategories → Testimonials → Footer
- **Acceptance**: Full landing page renders in correct section order end-to-end
- **Effort**: 20 min

### Phase 4: Chat Interface

**TASK-F10**: Build `DiagnosticCard.jsx`
- **Details**: Four-section card (Symptom, Likely Cause, Recommended Action, Confidence badge) with correct accent colors and Tailwind classes per design spec; split `action` on `\n` for multi-line rendering
- **Acceptance**: All four sections render with correct styling; confidence pill applies the right color class for each of the three values; action steps break across lines correctly
- **Effort**: 45 min

**TASK-F11**: Build `ChatInput.jsx`
- **Details**: Labeled textarea, "Run Diagnosis" submit button, loading state (spinner + "Analyzing…" + disabled), inline validation error, API error message
- **Acceptance**: Empty submit shows validation message without API call; loading state disables both controls; error state shows message and re-enables controls
- **Effort**: 35 min

**TASK-F12**: Assemble `Diagnose.jsx`
- **Details**: Compose Header (with back link) + card history list + ChatInput; manage `history`, `symptom`, `status`, `errorMsg` state; call `diagnose()`, prepend result to history on success
- **Acceptance**: Full end-to-end flow — submit symptom → loading state → card appears above input; multiple submissions stack cards newest-first; errors handled gracefully
- **Effort**: 45 min

### Phase 5: Polish & Accessibility

**TASK-F13**: Accessibility pass
- **Details**: Add `alt` text to all images, verify all inputs have `<label>`, add visible focus rings (`focus-visible:ring-2 focus-visible:ring-blue-600`), verify confidence badge has both color and text label
- **Acceptance**: Tab navigation reaches all interactive elements with visible focus; no inputs without labels; images have descriptive alt text
- **Effort**: 30 min

**TASK-F14**: Responsive QA
- **Details**: Test at 375px (mobile), 768px (tablet), 1280px (desktop) — verify all breakpoints, card widths, grid layouts
- **Acceptance**: No horizontal overflow at 375px; category cards stack on mobile and grid on desktop; diagnostic cards max-width 640px centered on desktop
- **Effort**: 20 min

### Phase 7: Internationalisation

**TASK-F16**: Implement i18n context and translations dictionary
- **Details**: Create `src/i18n/translations.js` with all static UI strings in both `en` and `es`. Create `src/context/LanguageContext.jsx` with `LanguageProvider` (default `'en'`), `useLanguage()` hook exposing `{ lang, setLang, t }`. Wrap `App.jsx` with `LanguageProvider`. Update all components to call `t('key')` instead of hardcoded strings.
- **Acceptance**: All static UI text is sourced from the dictionary; switching language updates all visible text without page reload; build passes with 0 errors
- **Effort**: 60 min

**TASK-F17**: Add language toggle to Header
- **Details**: Add a toggle button next to the "Try it now" CTA in `Header.jsx`; the button label shows the inactive language code (`"ES"` when English is active, `"EN"` when Spanish); clicking calls `setLang`
- **Acceptance**: Toggle is visible on both landing and diagnose pages; clicking it switches UI language immediately; button has visible focus ring and `aria-label`
- **Effort**: 20 min

**TASK-F18**: Send selected language with API requests
- **Details**: Update `src/services/api.js` to accept a `language` parameter and include it in the POST body as `{ symptom, language }`. Update `Diagnose.jsx` to read `lang` from `useLanguage()` and pass it to `diagnose(symptom, lang)`.
- **Acceptance**: When Spanish is active, the POST body includes `"language": "es"`; when English is active it sends `"language": "en"`; diagnostic card response content is in the selected language
- **Effort**: 20 min

**TASK-F15**: Production build and S3 deploy
- **Details**: `npm run build`, sync `dist/` to S3 bucket, configure bucket for static hosting, create CloudFront distribution with SPA 403/404 → `index.html` custom error response
- **Acceptance**: Public CloudFront URL serves the app; `/diagnose` deep link works without 403; full diagnostic flow works end-to-end on the live URL
- **Effort**: 45 min

---

## Dependencies

- Node.js 24+
- `react` + `react-dom` (bundled by Vite)
- `react-router-dom` — client-side routing
- `tailwindcss` + `postcss` + `autoprefixer` — utility CSS
- AWS CLI configured for S3 sync + CloudFront invalidation
- `.env` with `VITE_API_GATEWAY_URL` set before build

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CORS error from browser to API Gateway | High | API Gateway already configured with `Access-Control-Allow-Origin: *`; verify with browser DevTools on first test |
| Unsplash image URL changes or rate-limits | Low | Use a stable `images.unsplash.com` direct URL or download and host image in `public/` |
| Deep links returning 403 from CloudFront | Medium | Configure CloudFront custom error response: 403 → `/index.html` HTTP 200 |
| Tailwind purging component class strings | Low | Use full class names (not dynamically constructed strings) in JSX |
| `\n` in action field not rendering as line breaks | Low | Split on `\n` and render each segment in its own `<p>` or `<span className="block">` |

## References

- #[[file:.kiro/steering/tech.md]] — Design system, color palette, typography, layout patterns
- #[[file:.kiro/steering/structure.md]] — File structure, naming conventions, API contract
- #[[file:.kiro/specs/backend-diagnostic-flow.md]] — Backend API response shape
