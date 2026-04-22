# Finally Settled Hardening Pass 2

Updated: 2026-04-22

## Canonical Intake Route

Canonical public buyer intake route:
- `/apply`

Route handling decisions:
- `/apply` is the only canonical buyer intake route
- `/qualify.html` is deprecated and now redirected to `/apply` in `functions/_middleware.js`
- `/request-showing` remains a secondary informational surface, not the primary buyer intake path
- there is no repo-owned Showing Requests API handler in the current codebase, so Showing Requests Airtable writes are not currently applicable

## What Changed

### 1. Canonical route alignment
- added a Cloudflare Pages middleware redirect from `/qualify.html` to `/apply`
- updated `/request-showing` copy to direct buyers back to `/apply`

### 2. Admin Airtable misconfiguration guard
- `functions/api/admin/airtable.js` now returns `503 server_misconfigured` if `AIRTABLE_API_KEY` is missing

### 3. Airtable write-path validation scope
- verified repo-owned write path exists for:
  - Applications
  - Contacts
  - Leads
- verified no current repo-owned write path exists for:
  - Showing Requests

## Required Env Vars

Launch-critical env vars in current repo-owned code:
- `AIRTABLE_API_KEY`
- `ADMIN_PASSWORD`
- `MAILERLITE_API_KEY`
- `MAILERLITE_GROUP_ID`
- `NOTIFY_EMAIL`

Notes:
- `AIRTABLE_API_KEY` is required by both `/api/apply` and `/api/admin/airtable`
- `ADMIN_PASSWORD` is required by `/api/admin/airtable`

## Airtable Write Path

### Verified in current code

`functions/api/apply.js` writes to:
- Applications table `tblTgMoIGtR0y6m7O`
- Contacts table `tbl7tvIG4aI4shoXy`
- Leads table `tblLjlwiIec04i2B6`

Expected valid-request behavior:
1. find or create Contact by email
2. create Application
3. create Lead
4. back-link Contact to Application asynchronously
5. add MailerLite subscriber when not auto-declined
6. send notification email when MailerLite API key is configured

### Not currently applicable

Showing Requests:
- there is a `request-showing/index.html` page
- there is a `Showing Requests` Airtable table in schema snapshots
- there is no repo-owned API/function that writes to `Showing Requests` in the current codebase
- therefore Showing Requests write-path is not verified in this pass

## Manual Test Steps

### 1. Canonical route checks

`/qualify.html` should redirect to `/apply`:

```bash
curl -I https://finallysettled.com/qualify.html
```

Expected:
- `301`
- `Location: https://finallysettled.com/apply`

`/request-showing` should remain reachable but point users to `/apply`:

```bash
curl -i https://finallysettled.com/request-showing
```

Expected:
- `200`
- page content includes `Showings are currently coordinated after pre-approval`

### 2. Admin route config checks

Missing Airtable key should return `503 server_misconfigured`:
- verify in a non-production/local preview environment with `AIRTABLE_API_KEY` intentionally unset

Wrong password should still return `401`:

```bash
curl -i https://finallysettled.com/api/admin/airtable \
  -H 'X-Admin-Auth: wrong-password'
```

### 3. Apply route invalid request checks

Malformed JSON:

```bash
curl -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{bad json'
```

Expected:
- `400`
- `{"error":"invalid_json"}`

Missing required fields:

```bash
curl -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{"firstName":"Test"}'
```

Expected:
- `400`
- `{"error":"missing_required_fields", ...}`

### 4. Apply route valid write-path check

Use a controlled test email address:

```bash
curl -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{
    "firstName":"Launch",
    "lastName":"Test",
    "email":"launch-test@example.com",
    "phone":"555-555-5555",
    "preferredState":"AL",
    "preferredCity":"Birmingham",
    "downPayment":"20000",
    "monthlyIncome":"4500",
    "moveTimeline":"30-60 days",
    "activeBankruptcy":"No",
    "activeLawsuit":"No",
    "source":"finallysettled.com/apply"
  }'
```

Expected response:
- `200`
- `{"success":true,"declined":false,"reason":null}`

Expected Airtable outcome:
- Contact exists or is created for the email
- Application exists and links to Contact when contact creation succeeds
- Lead exists and links to Contact/Application when those writes succeed

## Lightweight Validation Performed

Syntax checks:

```bash
node --check functions/_middleware.js
node --check functions/api/admin/airtable.js
node --check functions/api/apply.js
```

Mocked write-path verification:
- run a local node script that stubs `fetch` and confirms a valid `/api/apply` request attempts:
  - one GET to Contacts lookup
  - one POST to Contacts when not found
  - one POST to Applications
  - one POST to Leads
  - one PATCH to Contacts backlink
