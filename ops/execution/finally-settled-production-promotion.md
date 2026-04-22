# Finally Settled Production Promotion

Updated: 2026-04-22

Scope:
- production promotion decision for PR #8
- merge readiness for `audit/finally-settled-system-sync` into `main`

Source of truth:
- current repo state
- PR #8
- `ops/execution/finally-settled-production-verification.md`
- prior execution docs already committed on this branch

## Release Candidate Summary

PR #8 ships two categories of changes:

### 1. Operational documentation and recovered artifacts
- audit documents
- execution plans
- sanitized n8n exports
- Airtable schema snapshots
- recovered `qualify.html`
- environment template updates

These are low-risk for runtime behavior.

### 2. Production behavior changes
- `functions/api/admin/airtable.js`
  - removed fallback admin password
  - requires `ADMIN_PASSWORD`
  - returns `503 server_misconfigured` if `ADMIN_PASSWORD` or `AIRTABLE_API_KEY` is missing
  - rejects malformed PATCH JSON with `400`
- `functions/api/apply.js`
  - returns clean `400` responses for malformed/incomplete/bad-value payloads
  - preserves valid request behavior for Applications, Contacts, Leads, and MailerLite flow
- `functions/_middleware.js`
  - redirects `/qualify.html` to `/apply`
- `request-showing/index.html`
  - now clearly points buyers to pre-approval first

These are the changes that materially affect production.

## Safety Assessment

Why PR #8 is safe to merge:
- Cloudflare Pages preview for PR #8 deployed successfully
- preview verification already confirmed:
  - `/qualify.html` redirects to `/apply`
  - `/apply` loads correctly
  - `/request-showing` reflects pre-approval-first messaging
  - `/api/apply` returns the expected `400` responses for bad payloads
  - `/api/apply` returns success for a valid payload shape
- code changes are narrow, production-focused, and do not introduce new frameworks or dependencies
- valid `/api/apply` behavior was preserved in both preview verification and local mocked write-path validation

Why PR #8 is not yet visible on production:
- production was still serving the old deploy when last checked
- this is a promotion timing issue, not a preview failure

## Merge Blockers

Merge blockers:
- none found in the current branch state or PR preview evidence

Non-blocking cautions:
- production env vars must already exist and remain correct
- post-merge verification must be run immediately after Cloudflare Pages promotes `main`
- `Showing Requests` still has no repo-owned write path, but that is not part of the current canonical intake route

## Merge Decision

PR #8 should be merged now.

Reason:
- preview behavior matches the intended hardening and canonical intake route
- no failing preview deploy or functional preview issue remains
- the remaining gap is promotion to production plus live re-verification

## Required Production Env Vars

These must already exist in the Cloudflare Pages production project:
- `AIRTABLE_API_KEY`
- `ADMIN_PASSWORD`
- `MAILERLITE_API_KEY`
- `MAILERLITE_GROUP_ID`
- `NOTIFY_EMAIL`

Notes:
- `AIRTABLE_API_KEY` is required by both `/api/apply` and `/api/admin/airtable`
- `ADMIN_PASSWORD` is required by `/api/admin/airtable`
- if `AIRTABLE_API_KEY` or `ADMIN_PASSWORD` is missing after merge, the admin route will return `503 server_misconfigured`
- if `AIRTABLE_API_KEY` is missing after merge, `/api/apply` will return `500 server_misconfigured`

## Exact Post-Merge Test Order

Run these only after Cloudflare Pages reports a successful production deploy for `main`.

### 1. Confirm the canonical redirect

```bash
curl -sSI https://finallysettled.com/qualify.html
```

Expected:
- `301`
- `Location: https://finallysettled.com/apply`

### 2. Confirm the canonical intake page loads

```bash
curl -sSI https://finallysettled.com/apply
curl -sL https://finallysettled.com/apply | rg -n "Start Your Pre-Approval|successScreen|fetch\\('/api/apply'"
```

Expected:
- page loads
- title/content reflects the `/apply` intake flow

### 3. Confirm `/request-showing` now supports the pre-approval-first flow

```bash
curl -sL https://finallysettled.com/request-showing | rg -n "Showings are currently coordinated after pre-approval|Start Pre-Approval"
```

Expected:
- page includes the new pre-approval-first message
- page includes a CTA back to `/apply`

### 4. Confirm `/api/apply` invalid payload handling

Malformed JSON:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{bad json'
```

Expected:
- `400`
- `{"error":"invalid_json"}`

Missing fields:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{"firstName":"Test"}'
```

Expected:
- `400`
- `{"error":"missing_required_fields", ...}`

### 5. Confirm `/api/apply` valid payload handling

Use a unique test email:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{
    "firstName":"Launch",
    "lastName":"Promotion",
    "email":"launch-promotion-<timestamp>@example.com",
    "phone":"555-555-5555",
    "preferredState":"AL",
    "preferredCity":"Birmingham",
    "downPayment":"20000",
    "monthlyIncome":"4500",
    "moveTimeline":"30-60 days",
    "activeBankruptcy":"No",
    "activeLawsuit":"No",
    "source":"production-promotion-check"
  }'
```

Expected response:
- `200`
- `{"success":true,"declined":false,"reason":null}`

Expected Airtable outcome:
- Contact created or reused
- Application created
- Lead created

### 6. Optional admin verification

Wrong password:

```bash
curl -sS -i https://finallysettled.com/api/admin/airtable \
  -H 'X-Admin-Auth: wrong-password'
```

Expected:
- `401`

Correct password, missing table:

```bash
curl -sS -i https://finallysettled.com/api/admin/airtable \
  -H 'X-Admin-Auth: YOUR_REAL_ADMIN_PASSWORD'
```

Expected:
- `400`
- `{"error":"table required"}`

## Rollback Guidance

If production behaves unexpectedly after merge:

1. Stop any traffic push immediately.
2. Capture the failing curl output for:
   - `/qualify.html`
   - `/apply`
   - `/request-showing`
   - `/api/apply`
3. Check the Cloudflare Pages production deploy status and logs for `main`.
4. If the issue is env-related:
   - restore the missing production env var(s)
   - re-run the production deploy
5. If the issue is code-related:
   - revert PR #8 from `main`
   - wait for Cloudflare Pages to redeploy production
   - confirm production behavior returns to:
     - `/qualify.html` old behavior
     - `/api/apply` old behavior
6. Re-open the branch for a smaller corrective pass before attempting promotion again.

## Final Recommendation

Merge PR #8 now, then run the post-merge test order exactly as written above.

The preview evidence is strong enough to promote. The remaining risk is operational promotion timing and production env parity, not an unresolved preview defect.
