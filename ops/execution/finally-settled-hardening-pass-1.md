# Finally Settled Hardening Pass 1

Updated: 2026-04-22

## What Changed

### 1. `functions/api/admin/airtable.js`
- removed the hardcoded fallback admin password path
- `ADMIN_PASSWORD` is now required
- if `ADMIN_PASSWORD` is missing, the route returns `503 server_misconfigured`
- PATCH now returns `400 invalid_json` for malformed JSON bodies
- PATCH now requires `fields` to be an object

### 2. `functions/api/apply.js`
- added request-level JSON parsing guard
- added validation for required fields:
  - `firstName`
  - `lastName`
  - `email`
  - `phone`
  - `preferredState`
  - `preferredCity`
  - `downPayment`
- added format/value validation for:
  - `email`
  - `downPayment`
  - `monthlyIncome` when provided
  - `coIncome` when provided
  - `activeBankruptcy`, `activeLawsuit`, `hasCoApplicant` when provided
- added a clear `500 server_misconfigured` response if `AIRTABLE_API_KEY` is missing
- preserved the success path and Airtable/MailerLite behavior for valid requests

### 3. `docs/finally-settled.env.example`
- documented that `ADMIN_PASSWORD` is mandatory for the admin route

## Why It Was Required

- the audit proved the live admin route still accepted the default fallback password
- the audit also proved `/api/apply` could return a generic 500 on malformed or incomplete input
- both were phase-1 launch blockers in `ops/execution/finally-settled-launch-blockers.md`

## How To Test

### Admin route

Expected outcomes:
- no configured password -> `503`
- wrong password -> `401`
- correct password + missing `table` -> `400`

Commands:

```bash
curl -i https://finallysettled.com/api/admin/airtable
```

```bash
curl -i https://finallysettled.com/api/admin/airtable \
  -H 'X-Admin-Auth: wrong-password'
```

```bash
curl -i https://finallysettled.com/api/admin/airtable \
  -H 'X-Admin-Auth: YOUR_REAL_ADMIN_PASSWORD'
```

### Apply route

Malformed JSON should return `400 invalid_json`:

```bash
curl -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{bad json'
```

Missing required fields should return `400 missing_required_fields`:

```bash
curl -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{"firstName":"Test"}'
```

Bad numeric field should return `400 invalid_down_payment`:

```bash
curl -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{
    "firstName":"Test",
    "lastName":"User",
    "email":"test@example.com",
    "phone":"555-555-5555",
    "preferredState":"AL",
    "preferredCity":"Birmingham",
    "downPayment":"abc"
  }'
```

Minimal valid request should return success and preserve current behavior:

```bash
curl -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{
    "firstName":"Test",
    "lastName":"User",
    "email":"test@example.com",
    "phone":"555-555-5555",
    "preferredState":"AL",
    "preferredCity":"Birmingham",
    "downPayment":"20000",
    "monthlyIncome":"4500",
    "moveTimeline":"30-60 days",
    "activeBankruptcy":"No",
    "activeLawsuit":"No"
  }'
```

## Lightweight Validation Performed

Syntax checks:

```bash
node --check functions/api/admin/airtable.js
node --check functions/api/apply.js
```
