# PumpSense Frontend — Deployment Info

## Live URLs

| Resource | URL |
|---|---|
| **CloudFront (public)** | https://d123t7yddmhzdm.cloudfront.net |
| S3 bucket (origin) | pumpsense-frontend-559960067174 |
| CloudFront distribution ID | E4YMLLUY8IDLJ |

> The CloudFront distribution takes ~5 minutes to fully deploy on first creation.
> Status: `InProgress` → `Deployed`

## Re-deploy after a frontend change

```bash
cd frontend

# 1. Build
npm run build

# 2. Sync assets (long cache — content-hashed filenames)
aws s3 sync dist/ s3://pumpsense-frontend-559960067174 \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# 3. Upload index.html with no-cache (entry point must always be fresh)
aws s3 cp dist/index.html s3://pumpsense-frontend-559960067174/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

# 4. Invalidate CloudFront so index.html is served fresh immediately
aws cloudfront create-invalidation \
  --distribution-id E4YMLLUY8IDLJ \
  --paths "/*"
```

## SPA routing

CloudFront custom error responses ensure `/diagnose` deep links work:

- 403 → `/index.html` (HTTP 200)
- 404 → `/index.html` (HTTP 200)

React Router handles the route client-side after the shell loads.
