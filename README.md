# PumpSense

**Asistente de diagnóstico de fallas en bombas industriales, potenciado por IA.**

🔗 **Demo en vivo:** https://d123t7yddmhzdm.cloudfront.net
🎥 **Video:** _[agregar link antes de la entrega]_

🇲🇽 Español · [🇺🇸 English version below](#english)

---

## El problema

<!-- TODO: 3-4 frases, en primera persona, concretas.
     Un técnico de campo frente a una bomba fallando no tiene un experto a
     la mano. El conocimiento de diagnóstico vive en los técnicos senior y
     se va con ellos cuando se van. El paro de una bomba crítica es caro.
     Menciona tu propio contexto de industria — es lo que le da
     credibilidad. -->

## Qué hace

PumpSense recibe la descripción de un síntoma en lenguaje natural y devuelve un
diagnóstico estructurado: causa probable, acción recomendada y nivel de
confianza. Cada diagnóstico se guarda como un caso, de modo que el equipo
construye un registro consultable de qué falló, qué se hizo al respecto y quién
lo resolvió.

- **Diagnosticar** — describe el síntoma, obtén causa + acción + confianza
- **Historial de casos** — cada diagnóstico se persiste automáticamente
- **Resolver o cancelar** — cierra un caso con nota de resolución y nombre del técnico
- **Filtros** — búsqueda libre por síntoma, técnico, status y rango de fechas, todos combinables
- **Bilingüe** — interfaz completa con toggle EN/ES

<!-- TODO: agregar capturas aquí. Sugeridas: resultado de diagnóstico,
     historial con filtros aplicados, tarjeta de un caso resuelto. -->

## Arquitectura

```
React + Vite (S3 + CloudFront)
        │
        │  HTTPS
        ▼
API Gateway ──► Lambda (Node.js 24, función única, despacho interno de rutas)
                    │
                    ├──► Amazon Bedrock   (inferencia del diagnóstico)
                    └──► DynamoDB         (persistencia de casos)
```

**Stack**

| Capa | Tecnología |
|---|---|
| Frontend | React, Vite, Tailwind |
| Hosting | S3 + CloudFront |
| API | API Gateway (REST) |
| Cómputo | AWS Lambda, Node.js 24 |
| Inferencia | Amazon Bedrock |
| Almacenamiento | DynamoDB (PAY_PER_REQUEST) |
| IaC | AWS SAM |
| Región | us-east-1 |

## API

URL base: `https://wkkd29tjza.execute-api.us-east-1.amazonaws.com/prod`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/diagnose` | Devuelve síntoma, causa, acción y confianza |
| `POST` | `/cases` | Persiste un caso; el status inicia en `open` |
| `GET` | `/cases` | Devuelve todos los casos, más recientes primero |
| `PATCH` | `/cases/{id}` | Cambia el status a `resolved` o `cancelled` con nota y nombre del técnico |

Todas las rutas las sirve un solo Lambda con despacho interno por método + ruta.

## Construido con Kiro

Este proyecto se desarrolló spec-driven de principio a fin. Los specs viven en
[`.kiro/specs`](.kiro/specs) y forman parte del repositorio a propósito: son el
registro de cómo se planeó el trabajo antes de escribir una sola línea de código.

Para cada feature el flujo fue:

1. **Requirements** en formato EARS
2. **Design** revisado y ajustado antes de implementar
3. **Task list** — ordenada, con criterios de aceptación y estimación de esfuerzo
4. **Ejecución** tarea por tarea, con revisión entre cada una

El Historial de Casos se desglosó en 18 tareas (CH1–CH18) y se ejecutó en ese
orden: infraestructura → lógica de backend → pruebas de backend → deploy →
servicio de frontend → componentes → integración → deploy.

<!-- TODO: opcional pero fuerte — agregar el número de specs, de tareas y una
     nota sobre cuántos créditos de Kiro consumió el desarrollo completo. -->

## Decisiones técnicas

Decisiones tomadas deliberadamente durante el desarrollo, y su razón.

**Tabla DynamoDB con clave simple.** La tabla de casos se diseñó primero con
clave compuesta (`id` + `createdAt`). Se cambió a partition key simple sobre
`id`, porque `PATCH /cases/{id}` solo lleva el id — una clave compuesta habría
obligado a un `Query` antes de cada update, y como cada id es único, la sort key
no ordenaba nada de todos modos. El ordenamiento por fecha descendente se hace en
el Lambda tras el scan, que es lo correcto a esta escala.

**Un solo Lambda, con ruteo interno.** Las cuatro rutas son eventos de API
Gateway sobre la misma función. Menos cold starts, un solo bundle, un solo
conjunto de permisos.

**Búsqueda de falla por texto libre en vez de categorías fijas.** Las categorías
fijas habrían requerido que el modelo emitiera un campo `category`, e
introducían un modo de falla en el que el modelo inventa categorías fuera de la
lista permitida. La búsqueda libre sobre el síntoma es insensible a acentos y
mayúsculas, y funciona sobre datos que ya existen.

**Los valores de status se guardan siempre en inglés.** `open` / `resolved` /
`cancelled` se persisten tal cual y se traducen solo al renderizar. Guardar
status localizados habría roto el filtrado para casos creados con el toggle en
otro idioma.

**El contenido del diagnóstico no se retraduce.** Un diagnóstico generado en
español permanece en español dentro del historial. Es un registro histórico, no
una vista viva — la lista puede legítimamente mezclar idiomas.

**Filtrado por fecha local.** El filtro de rango compara contra la fecha local
del caso, no contra su timestamp UTC crudo. Un caso creado a las 19:37 hora local
se almacena como el día siguiente en UTC, y comparar la cadena ISO directamente
excluía casos del mismo día — un bug que solo aparecería en diagnósticos hechos
por la tarde o noche.

**Guardar el caso nunca bloquea el diagnóstico.** Si la persistencia falla, el
error se registra en consola y el diagnóstico se muestra exactamente igual. La
ruta que ve el usuario nunca se degrada por una falla de almacenamiento.

## Ejecución local

```bash
# Backend
cd backend
npm install
sam build
sam local start-api --env-vars env.json

# Frontend
npm install
npm run dev
```

**Variables de entorno** (`.env`, ver `.env.example`):

| Variable | Propósito |
|---|---|
| `VITE_API_GATEWAY_URL` | URL completa del endpoint de diagnóstico |
| `VITE_API_BASE_URL` | Raíz del stage de la API, usada para construir las rutas `/cases` |

`env.json` (backend, en gitignore) provee `CASES_TABLE` para pruebas locales
contra la tabla desplegada.

## Despliegue

```bash
# Backend
cd backend && sam build && sam deploy

# Frontend
npm run build
aws s3 sync dist/ s3://<bucket> --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

CloudFront está configurado con respuestas de error personalizadas que mapean 403
y 404 a `/index.html` con status 200, de modo que las rutas de cliente como
`/history` funcionan como links directos y sobreviven a una recarga de página.

## Roadmap — deliberadamente fuera de alcance

Estos puntos se dejaron fuera del alcance del hackathon a propósito, no por
descuido.

- **Recuperación sobre casos resueltos.** Alimentar el prompt con resoluciones
  pasadas de síntomas similares como contexto adicional. <!-- TODO: mover esto a
  "Qué hace" si alcanzas a construir la versión ligera. -->
- **RAG con OpenSearch.** La versión completa con búsqueda vectorial de lo
  anterior. Costo y complejidad injustificables a esta escala.
- **Autenticación.** El nombre del técnico es hoy un campo de texto libre. Auth
  real con Cognito es el siguiente paso natural, pero agrega un modo de falla en
  vivo y ningún valor evaluable aquí.
- **WhatsApp Business API.** El canal de entrega realista para técnicos de campo
  que no van a instalar una app.

## Licencia

<!-- TODO -->

---
---

<a name="english"></a>

# PumpSense

**AI-powered diagnostic assistant for industrial pump failures.**

🔗 **Live demo:** https://d123t7yddmhzdm.cloudfront.net
🎥 **Video:** _[add link before submission]_

🇺🇸 English · [🇲🇽 Versión en español arriba](#pumpsense)

---

## The problem

<!-- TODO: 3-4 sentences, first person, concrete.
     A field technician standing in front of a failing pump has no expert
     on hand. Diagnostic knowledge lives with senior technicians and walks
     out the door when they leave. Downtime on a critical pump is
     expensive. Mention your own industry context here — it is what makes
     this credible. -->

## What it does

PumpSense takes a plain-language description of a pump symptom and returns a
structured diagnostic: probable cause, recommended action, and a confidence
level. Every diagnostic is stored as a case, so a team builds a searchable
record of what failed, what was done about it, and who resolved it.

- **Diagnose** — describe the symptom, get cause + action + confidence
- **Case history** — every diagnostic is persisted automatically
- **Resolve or cancel** — close a case with a resolution note and technician name
- **Filters** — free-text symptom search, technician, status, and date range, all combinable
- **Bilingual** — full EN/ES interface toggle

<!-- TODO: add screenshots here. Suggested: diagnose result, case history
     with filters applied, a resolved case card. -->

## Architecture

```
React + Vite (S3 + CloudFront)
        │
        │  HTTPS
        ▼
API Gateway ──► Lambda (Node.js 24, single function, internal route dispatch)
                    │
                    ├──► Amazon Bedrock   (diagnostic inference)
                    └──► DynamoDB         (case persistence)
```

**Stack**

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind |
| Hosting | S3 + CloudFront |
| API | API Gateway (REST) |
| Compute | AWS Lambda, Node.js 24 |
| Inference | Amazon Bedrock |
| Storage | DynamoDB (PAY_PER_REQUEST) |
| IaC | AWS SAM |
| Region | us-east-1 |

## API

Base URL: `https://wkkd29tjza.execute-api.us-east-1.amazonaws.com/prod`

| Method | Path | Description |
|---|---|---|
| `POST` | `/diagnose` | Returns symptom, cause, action, confidence |
| `POST` | `/cases` | Persists a case; status defaults to `open` |
| `GET` | `/cases` | Returns all cases, newest first |
| `PATCH` | `/cases/{id}` | Sets status to `resolved` or `cancelled` with a note and technician name |

All routes are served by a single Lambda with internal method + path dispatch.

## Built with Kiro

This project was developed spec-driven, end to end. The specs live in
[`.kiro/specs`](.kiro/specs) and are part of the repository on purpose — they
are the record of how the work was planned before any code was written.

For each feature the workflow was:

1. **Requirements** in EARS format
2. **Design** reviewed and adjusted before implementation
3. **Task list** — ordered, with acceptance criteria and effort estimates
4. **Execution** one task at a time, with review between tasks

The Case History feature was broken into 18 tasks (CH1–CH18) and executed in
that order: infrastructure → backend logic → backend testing → deploy →
frontend service → components → integration → deploy.

<!-- TODO: optional but strong — add the count of specs, tasks, and a note
     on how many Kiro credits the whole build consumed. -->

## Technical decisions

Decisions that were made deliberately during the build, and why.

**Single-key DynamoDB table.** The cases table was first designed with a
composite key (`id` + `createdAt`). It was changed to a simple partition key on
`id` alone, because `PATCH /cases/{id}` only carries the id — a composite key
would have forced a `Query` before every update, and since each id is unique the
sort key ordered nothing anyway. Sorting newest-first happens in the Lambda after
the scan, which is correct at this scale.

**One Lambda, internal routing.** All four routes are API Gateway events on the
same function. Fewer cold starts, one bundle, one set of permissions.

**Free-text fault search instead of fixed categories.** Fixed categories would
have required the model to emit a `category` field and would have introduced a
failure mode where the model invents categories outside the allowed list.
Free-text search over the symptom is accent- and case-insensitive and works
against data that already exists.

**Status values are stored in English, always.** `open` / `resolved` /
`cancelled` are persisted as-is and translated only at render time. Storing
localized status strings would have broken filtering for cases created under a
different language toggle.

**Diagnostic content is not re-translated.** A diagnostic generated in Spanish
stays in Spanish in the case history. It is a historical record, not a live
view — the list can legitimately mix languages.

**Local-date filtering.** The date range filter compares against the case's
local date, not its raw UTC timestamp. A case created at 19:37 local time is
stored as the following day in UTC, and comparing the ISO string directly
excluded same-day cases from the filter — a bug that would only surface for
diagnostics run in the evening.

**Case saving never blocks the diagnostic.** If persistence fails, the error is
logged and the diagnostic renders exactly as it would have. The user-facing path
is never degraded by a storage failure.

## Running locally

```bash
# Backend
cd backend
npm install
sam build
sam local start-api --env-vars env.json

# Frontend
npm install
npm run dev
```

**Environment variables** (`.env`, see `.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_GATEWAY_URL` | Full URL of the diagnose endpoint |
| `VITE_API_BASE_URL` | API stage root, used to build `/cases` paths |

`env.json` (backend, gitignored) supplies `CASES_TABLE` for local testing
against the deployed table.

## Deploying

```bash
# Backend
cd backend && sam build && sam deploy

# Frontend
npm run build
aws s3 sync dist/ s3://<bucket> --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

CloudFront is configured with custom error responses mapping 403 and 404 to
`/index.html` with status 200, so client-side routes like `/history` work as
direct links and survive a page reload.

## Roadmap — deliberately out of scope

These were scoped out for the hackathon, not overlooked.

- **Retrieval over resolved cases.** Feeding similar past resolutions into the
  prompt as additional context. <!-- TODO: move this up to "What it does" if
  you ship the lightweight version. -->
- **OpenSearch-backed RAG.** The full vector-search version of the above.
  Unjustifiable cost and complexity at this scale.
- **Authentication.** Technician name is currently a free-text field. Real
  auth via Cognito is the natural next step, but it adds a live failure mode
  and no evaluable value here.
- **WhatsApp Business API.** The realistic delivery channel for field
  technicians who will not install an app.

## License

<!-- TODO -->
