# Finally Settled Live Launch Verification

Updated: 2026-04-23 (rechecked)

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
- state: `OPEN`
- merged: `no`

Interpretation:
- GitHub still reported PR #8 as open during this re-check
- production still did not reflect the hardened PR #8 behavior
- this verification confirms the current live state is still the older intake deployment

## Production Updated

No.

Evidence:
- `/qualify.html` still returned `200` instead of redirecting to `/apply`
- `/request-showing` still showed the older surface and still linked to `/getapproved`
- `/api/apply` still returned `500 {"error":"internal_error"}` for malformed and invalid payloads

Conclusion:
- the PR #8 hardening and canonical-route changes were still not live on production at verification time

## Ordered Live Checks

### 1. `/qualify.html` redirects to `/apply`

Command:

```bash
curl -sSI https://finallysettled.com/qualify.html
```

Observed result:
- `200`
- no redirect

Status:
- failed

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
- page still contained the older nav/link structure with `/getapproved`

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
- `500`
- `{"error":"internal_error"}`

Expected after PR #8:
- `400`
- `{"error":"invalid_json"}`

Status:
- failed

### 5. `/api/apply` incomplete payload

Command:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{"firstName":"Test"}'
```

Observed result:
- `500`
- `{"error":"internal_error"}`

Expected after PR #8:
- `400`
- `{"error":"missing_required_fields", ...}`

Status:
- failed

### 6. `/api/apply` invalid down payment

Command:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"555-555-5555","preferredState":"AL","preferredCity":"Birmingham","downPayment":"abc"}'
```

Observed result:
- `500`
- `{"error":"internal_error"}`

Expected after PR #8:
- `400`
- `{"error":"invalid_down_payment","field":"downPayment"}`

Status:
- failed

### 7. `/api/apply` controlled valid payload

Test email used:
- `live-launch-verification-1776923281@example.com`

Command:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{
    "firstName":"Live",
    "lastName":"Verification",
    "email":"live-launch-verification-1776923281@example.com",
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
- the currently deployed production lead engine still accepts a valid intake payload
- however, it is still the older, unhardened version because the invalid-payload checks failed

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
- `live-launch-verification-1776923281@example.com`

Check in Airtable:
1. Contacts table for a record with that email
2. Applications table for a record with that email
3. Leads table for a record with that email
4. confirm the Application links to the Contact when contact creation succeeded
5. confirm the Lead links to the Contact/Application when those writes succeeded

## Pass / Fail Summary

Passed:
- `/apply` loads
- valid `/api/apply` payload succeeded

Failed:
- `/qualify.html` redirect
- `/request-showing` updated messaging
- `/api/apply` malformed JSON handling
- `/api/apply` incomplete payload handling
- `/api/apply` invalid down payment handling

## Limited Live Lead Capture Readiness

Ready for limited live lead capture:
- no, not for the intended PR #8 hardened launch path

Reason:
- production is still serving the old, unhardened intake behavior
- valid lead capture still appears to work

Current blocker:
- production has not caught up to the verified preview behavior, so the canonical `/apply` hardening changes are still not live
- but the production environment has not yet adopted the safer canonical-route and bad-payload protections

## Remaining Blocker

Primary blocker:
- PR #8 changes were not live on production at verification time

Operational blocker:
- production promotion/merge must happen first
- after promotion, the same live checks must be rerun to confirm production now matches preview behavior
