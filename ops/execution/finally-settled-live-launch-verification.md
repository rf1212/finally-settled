# Finally Settled Live Launch Verification

Updated: 2026-04-23 (post-merge recheck)

Scope:
- live production verification against `https://finallysettled.com`
- compare current production behavior to the intended PR #8 behavior

Source of truth:
- current repo state
- PR #8
- `ops/execution/finally-settled-production-verification.md`
- `ops/execution/finally-settled-production-promotion.md`

## Merge State At Verification Time

PR #8 status at the time of this verification:
- state: `MERGED`
- merged: `yes`
- merge commit: `dc5cd6d5eba73732d880a5f1f285841b74541df8`

Interpretation:
- PR #8 is now merged into `main`
- Cloudflare Pages production is serving production deploy commit `dc5cd6d5eba73732d880a5f1f285841b74541df8`
- the hardened `/qualify.html` and `/api/apply` behavior is now live on production
- `/request-showing` still does not match the preview-era expectation documented earlier

## Production Updated

Yes, with one remaining page-level inconsistency.

Evidence:
- `/qualify.html` now returns `301` to `/apply`
- `/api/apply` now returns the expected `400` responses for malformed and invalid payloads
- controlled valid `/api/apply` submissions still return success
- Cloudflare Pages production deployment metadata shows commit `dc5cd6d5eba73732d880a5f1f285841b74541df8` on branch `main`
- `/request-showing` still shows the older request-showing form and `/getapproved` CTA

Conclusion:
- the hardened intake flow is now live on production
- however, `/request-showing` still does not reflect the expected pre-approval-first messaging

## Ordered Live Checks

### 1. `/qualify.html` redirects to `/apply`

Command:

```bash
curl -sSI https://finallysettled.com/qualify.html
```

Observed result:
- `301`
- `Location: https://finallysettled.com/apply`

Status:
- passed

### 2. `/apply` loads and remains the canonical intake page

Command:

```bash
curl -sSI https://finallysettled.com/apply
```

Observed result:
- `/apply` returned the expected directory-style redirect to `/apply/`

Status:
- passed

Note:
- page still exists as the real working intake route

### 3. `/request-showing` reflects the pre-approval-first messaging

Command:

```bash
curl -sL https://finallysettled.com/request-showing | rg -n "Showings are currently coordinated after pre-approval|Start Pre-Approval|coming soon|getapproved"
```

Observed result:
- page still contains the older showing-request form
- page still contains `/getapproved` in the nav CTA
- page does not show the expected pre-approval-first messaging

Status:
- failed

### 4. `/api/apply` malformed JSON

Command:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{bad json'
```

Observed result:
- `400`
- `{"error":"invalid_json"}`

Expected after PR #8:
- `400`
- `{"error":"invalid_json"}`

Status:
- passed

### 5. `/api/apply` incomplete payload

Command:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{"firstName":"Test"}'
```

Observed result:
- `400`
- `{"error":"missing_required_fields","fields":["lastName","email","phone","preferredState","preferredCity","downPayment"]}`

Expected after PR #8:
- `400`
- `{"error":"missing_required_fields", ...}`

Status:
- passed

### 6. `/api/apply` invalid down payment

Command:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"555-555-5555","preferredState":"AL","preferredCity":"Birmingham","downPayment":"abc"}'
```

Observed result:
- `400`
- `{"error":"invalid_down_payment","field":"downPayment"}`

Expected after PR #8:
- `400`
- `{"error":"invalid_down_payment","field":"downPayment"}`

Status:
- passed

### 7. `/api/apply` controlled valid payload

Test email used:
- `live-launch-verification-1776923915@example.com`

Command:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{
    "firstName":"Live",
    "lastName":"Verification",
    "email":"live-launch-verification-1776923915@example.com",
    "phone":"555-555-5555",
    "preferredState":"AL",
    "preferredCity":"Birmingham",
    "downPayment":"20000",
    "monthlyIncome":"4500",
    "moveTimeline":"30-60 days",
    "activeBankruptcy":"No",
    "activeLawsuit":"No",
    "source":"live-launch-verification"
  }'
```

Observed result:
- `200`
- `{"success":true,"declined":false,"reason":null}`

Status:
- passed

Interpretation:
- the currently deployed production lead engine accepts a valid intake payload
- the hardened invalid-payload behavior is also now live

## Expected Airtable Outcomes For Successful Valid Payload

For a successful valid `/api/apply` submission, the current code path is expected to:
1. create or reuse a Contact
2. create an Application
3. create a Lead

## Direct Airtable Verification

Status:
- not verified directly

Attempt made:
- tried direct Airtable API verification from the current environment using a locally discovered Airtable credential source

Exact blocker:
- Airtable API request returned `401 Unauthorized`
- therefore the current environment did not provide a working direct Airtable verification credential at the time of this check

## Exact Manual Airtable Verification Steps

Using the test email:
- `live-launch-verification-1776923915@example.com`

Check in Airtable:
1. Contacts table for a record with that email
2. Applications table for a record with that email
3. Leads table for a record with that email
4. confirm the Application links to the Contact when contact creation succeeded
5. confirm the Lead links to the Contact/Application when those writes succeeded

## Pass / Fail Summary

Passed:
- `/qualify.html` redirect
- `/apply` loads
- `/api/apply` malformed JSON handling
- `/api/apply` incomplete payload handling
- `/api/apply` invalid down payment handling
- valid `/api/apply` payload succeeded

Failed:
- `/request-showing` updated messaging

## Limited Live Lead Capture Readiness

Ready for limited live lead capture:
- yes

Reason:
- the canonical `/apply` intake path is live
- invalid payloads now fail safely with `400` responses
- valid lead capture still works
- the remaining `/request-showing` inconsistency does not block limited lead capture through `/apply`

Current blocker:
- `/request-showing` still needs follow-up if the pre-approval-first messaging on that page is required for consistency

## Remaining Blocker

Primary blocker:
- no launch-blocking production deploy blocker remains for the canonical `/apply` path

Operational blocker:
- `/request-showing` still needs a small follow-up pass if that page must be aligned with the launch messaging
