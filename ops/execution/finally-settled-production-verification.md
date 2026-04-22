# Finally Settled Production Verification

Updated: 2026-04-22

Scope:
- verify the canonical intake route and hardening changes from pass 1 and pass 2
- compare PR preview behavior against current production behavior

Source of truth:
- current repo state on `audit/finally-settled-system-sync`
- PR #8
- `ops/execution/finally-settled-hardening-pass-1.md`
- `ops/execution/finally-settled-hardening-pass-2.md`

## Deploy Target Found

Yes.

Deployment model identified:
- GitHub PR is connected to Cloudflare Pages
- PR #8 has a successful Cloudflare Pages preview deployment

Evidence from PR #8:
- preview URL: `https://9d649993.finally-settled.pages.dev`
- branch preview URL: `https://audit-finally-settled-system.finally-settled.pages.dev`
- latest verified app commit in the PR comment: `5ccd375`

## Was Preview / Live Verification Possible

Preview verification:
- yes

Live production verification:
- yes, but only as a comparison target
- current public production did not yet reflect the preview changes at verification time

## Preview Verification Results

Preview target used:
- `https://audit-finally-settled-system.finally-settled.pages.dev`

### 1. `/qualify.html` redirects to `/apply`

Status:
- verified

Command:

```bash
curl -sSI https://audit-finally-settled-system.finally-settled.pages.dev/qualify.html
```

Observed result:
- `301`
- `Location: https://audit-finally-settled-system.finally-settled.pages.dev/apply`

### 2. `/apply` loads correctly

Status:
- verified

Observed result:
- `/apply` returned a redirect to `/apply/`, which is normal Cloudflare Pages directory behavior
- resolved page contained:
  - `Start Your Pre-Approval`
  - `fetch('/api/apply'`
  - `successScreen`

### 3. `/request-showing` reflects pre-approval-first messaging

Status:
- verified

Command:

```bash
curl -sL https://audit-finally-settled-system.finally-settled.pages.dev/request-showing | rg -n \"Showings are currently coordinated after pre-approval|Start Pre-Approval\"
```

Observed result:
- page contains:
  - `Showings are currently coordinated after pre-approval...`
  - `Start Pre-Approval`

### 4. `/api/apply` bad payload handling

Status:
- verified

Malformed JSON:

```bash
curl -sS -i https://audit-finally-settled-system.finally-settled.pages.dev/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{bad json'
```

Observed result:
- `400`
- `{"error":"invalid_json"}`

Missing required fields:

```bash
curl -sS -i https://audit-finally-settled-system.finally-settled.pages.dev/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{"firstName":"Test"}'
```

Observed result:
- `400`
- `{"error":"missing_required_fields", ...}`

Invalid down payment:

```bash
curl -sS -i https://audit-finally-settled-system.finally-settled.pages.dev/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"555-555-5555","preferredState":"AL","preferredCity":"Birmingham","downPayment":"abc"}'
```

Observed result:
- `400`
- `{"error":"invalid_down_payment","field":"downPayment"}`

### 5. `/api/apply` valid payload shape

Status:
- verified

Command shape used:

```bash
curl -sS -i https://audit-finally-settled-system.finally-settled.pages.dev/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{
    "firstName":"Launch",
    "lastName":"Verification",
    "email":"launch-verification-<timestamp>@example.com",
    "phone":"555-555-5555",
    "preferredState":"AL",
    "preferredCity":"Birmingham",
    "downPayment":"20000",
    "monthlyIncome":"4500",
    "moveTimeline":"30-60 days",
    "activeBankruptcy":"No",
    "activeLawsuit":"No",
    "source":"preview-verification"
  }'
```

Observed result:
- `200`
- `{"success":true,"declined":false,"reason":null}`

Interpretation:
- preview deployment has the required Airtable/MailerLite env state to accept a valid request shape

### 6. `/api/admin/airtable` missing `AIRTABLE_API_KEY` behavior

Status:
- not directly verifiable on deployed preview

Reason:
- deployed preview clearly had `AIRTABLE_API_KEY` available because `/api/apply` completed successfully against Airtable-backed logic
- there is no repo-controlled preview route that intentionally unsets `AIRTABLE_API_KEY`

What was verified instead:
- local module invocation during pass 2 returned:
  - `503`
  - `{"error":"server_misconfigured","detail":"AIRTABLE_API_KEY is required"}`

## Live Production Comparison

Production target used:
- `https://finallysettled.com`

### Production still showed old behavior at verification time

`/qualify.html`:

```bash
curl -sSI https://finallysettled.com/qualify.html
```

Observed result:
- `200`
- no redirect to `/apply`

`/api/apply` malformed JSON:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{bad json'
```

Observed result:
- `500`
- `{"error":"internal_error"}`

`/request-showing`:

Observed result:
- page still reflected the older surface and still linked to `/getapproved`

Conclusion:
- the preview deployment has the intended changes
- the public production domain had not yet picked up those changes at verification time

## Exact Blocker

Blocker:
- production promotion was not yet complete at verification time

Exact meaning:
- PR preview behavior is correct
- production domain behavior is still on the older deployment
- readiness for limited launch depends on merging/promoting PR #8 and then re-running the same verification steps against `https://finallysettled.com`

## Exact Manual Steps Required After Merge / Production Promotion

1. Confirm Cloudflare Pages production deploy for `main` succeeds.
2. Run:

```bash
curl -sSI https://finallysettled.com/qualify.html
curl -sSI https://finallysettled.com/apply
curl -sL https://finallysettled.com/request-showing | rg -n \"Showings are currently coordinated after pre-approval|Start Pre-Approval\"
```

3. Re-run the bad-payload checks on production:

```bash
curl -sS -i https://finallysettled.com/api/apply -X POST -H 'Content-Type: application/json' --data '{bad json'
curl -sS -i https://finallysettled.com/api/apply -X POST -H 'Content-Type: application/json' --data '{"firstName":"Test"}'
```

4. Run one controlled valid request on production with a unique test email:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{
    "firstName":"Launch",
    "lastName":"Verification",
    "email":"launch-verification-<timestamp>@example.com",
    "phone":"555-555-5555",
    "preferredState":"AL",
    "preferredCity":"Birmingham",
    "downPayment":"20000",
    "monthlyIncome":"4500",
    "moveTimeline":"30-60 days",
    "activeBankruptcy":"No",
    "activeLawsuit":"No",
    "source":"production-verification"
  }'
```

5. Confirm in Airtable that the test submission created:
- Contact
- Application
- Lead

6. Confirm whether production admin route should be checked in a non-production environment with `AIRTABLE_API_KEY` intentionally unset, since that condition cannot be safely simulated on live production.

## Launch Readiness Call

Ready for a limited lead capture launch:
- not on current production at verification time
- yes after PR #8 is promoted to production and the production re-check matches preview behavior

Reason:
- preview behavior supports the limited lead capture path
- production was still serving the old intake/hardening behavior when checked
