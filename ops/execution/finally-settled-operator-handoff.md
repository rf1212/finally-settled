# Finally Settled Operator Handoff

Updated: 2026-04-23

## Canonical Traffic Destination

Send all buyer traffic to:
- `https://finallysettled.com/apply`

Supporting rule:
- treat `/apply` as the only canonical intake path
- treat `/qualify.html` as a redirect only
- treat `/request-showing` as secondary messaging, not a primary lead funnel

## Current Live State

Live and healthy:
- `/apply`
- `/api/apply`
- `/qualify.html` redirect to `/apply`
- Cloudflare Pages production on commit `18a15be2f92fd2e163e0eb53e371fbcfe9e24c57`

Needs operator awareness:
- `finallysettled.com/request-showing` may still show stale cached HTML even though the production deploy has the corrected version

## What To Monitor Daily

1. New application volume
- classification: launch-critical
- check:
  - new records landing in Airtable
  - any sudden drop to zero submissions

2. `/api/apply` endpoint health
- classification: launch-critical
- check:
  - malformed payload returns `400`
  - valid payload still returns success
  - no spike in `500` responses

3. Listings freshness
- classification: revenue-leveraged
- check:
  - new/updated listings continue to appear in Airtable and on the site
  - no silent break in the Apify sync path

4. Request-showing page consistency
- classification: cleanup
- check:
  - custom domain eventually reflects the pre-approval-first copy

5. Airtable operator workflow
- classification: launch-critical
- check:
  - someone is actually reviewing and following up on new leads

## How To Verify Successful Lead Flow

Use one controlled test submission:

```bash
curl -sS -i https://finallysettled.com/api/apply \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{
    "firstName":"Operator",
    "lastName":"Test",
    "email":"operator-test-<timestamp>@example.com",
    "phone":"555-555-5555",
    "preferredState":"AL",
    "preferredCity":"Birmingham",
    "downPayment":"20000",
    "monthlyIncome":"4500",
    "moveTimeline":"30-60 days",
    "activeBankruptcy":"No",
    "activeLawsuit":"No",
    "source":"operator-handoff-test"
  }'
```

Expected API response:
- `200`
- `{"success":true,"declined":false,"reason":null}`

Then verify manually in Airtable:
1. `Contacts`
2. `Applications`
3. `Leads`

Expected data outcome:
- Contact created or reused
- Application created
- Lead created
- linked records present where expected

## Airtable Tables That Matter Most

Primary launch tables:
- `Applications`
- `Contacts`
- `Leads`
- `Listings`

Secondary / conditional:
- `Showing Requests`

Operational meaning:
- `Applications`, `Contacts`, and `Leads` are the core phase-1 buyer funnel
- `Listings` is the inventory engine that feeds site credibility and conversion
- `Showing Requests` is not part of the canonical phase-1 intake path today

## Next 5 Highest-Value Tasks After Phase 1

1. Resolve the `/request-showing` custom-domain cache mismatch
- classification: cleanup
- why:
  - removes the last buyer-facing inconsistency left after launch

2. Validate live Airtable outcomes with working operator credentials
- classification: launch-critical
- why:
  - successful API responses are confirmed, but direct Airtable verification from this environment is still missing

3. Secure and document the live listings sync workflow end to end
- classification: revenue-leveraged
- why:
  - listings freshness directly supports conversion and trust
  - current workflow still depends on off-repo operational state

4. Capture Cloudflare deployment controls in repo-owned documentation
- classification: cleanup
- why:
  - production is live, but control-plane settings are still not fully reproducible from GitHub

5. Recover or deliberately archive the historical social/content engine assets
- classification: defer
- why:
  - not needed for lead capture
  - still valuable to resolve once the launch path is stable

## Operator Priorities By Label

launch-critical:
- watch application volume daily
- verify successful lead writes in Airtable
- monitor `/api/apply` for regressions

revenue-leveraged:
- keep listings sync healthy
- keep inventory fresh and visible

cleanup:
- clear `/request-showing` custom-domain staleness
- document Cloudflare control plane details in repo-owned docs

defer:
- social/reel/render recovery
- Canva/Publer rebuild decisions

## Escalation Guide

Escalate immediately if:
- valid `/api/apply` payloads stop returning `200`
- new leads stop appearing in Airtable
- `/qualify.html` stops redirecting to `/apply`
- listings stop updating for more than one expected sync window

Do not block phase-1 operations for:
- reel automation gaps
- Canva/Publer uncertainty
- missing historical content-engine files
- `/request-showing` copy inconsistency if `/apply` remains healthy

## Final Operator Instruction

Run phase 1 as a focused lead capture system, not as a full growth automation stack.

Keep all paid traffic, outbound traffic, and buyer-facing CTAs centered on `/apply`. Treat everything else as supporting infrastructure until Airtable verification, listings reliability, and Cloudflare documentation are all fully tightened.
