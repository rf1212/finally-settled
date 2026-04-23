# Finally Settled Request Showing Live Verification

Updated: 2026-04-23

Scope:
- verify promotion of the `/request-showing` follow-up fix to production
- compare the Cloudflare Pages production deployment URL to the custom domain `https://finallysettled.com/request-showing`

Source of truth:
- current repo state
- commit `fd86ed1ea565a901ffd6adaf70db62223f005779`
- `ops/execution/finally-settled-request-showing-follow-up.md`
- live Cloudflare Pages production deployment metadata
- live production site at `https://finallysettled.com`

## Merge State

Follow-up commit on its own branch:
- commit: `fd86ed1ea565a901ffd6adaf70db62223f005779`
- branch used for promotion: `codex/request-showing-live-fix`

Promotion PR:
- PR `#9`
- state: `MERGED`
- merge commit: `18a15be2f92fd2e163e0eb53e371fbcfe9e24c57`

## Cloudflare Production Deployment

Cloudflare Pages production picked up the merged follow-up.

Observed production deployment:
- branch: `main`
- commit: `18a15be2f92fd2e163e0eb53e371fbcfe9e24c57`
- stage: `deploy`
- stage status: `active`
- production deploy URL: `https://6e34d2f8.finally-settled.pages.dev`

Conclusion:
- the Pages production deployment has the new code

## Deployment URL Verification

Verified at:
- `https://6e34d2f8.finally-settled.pages.dev/request-showing`

Observed result:
- title: `Showings After Pre-Approval | Finally Settled`
- headline: `Showings Start With Pre-Approval`
- body: `Showings are coordinated after pre-approval...`
- main CTA text: `Apply for Pre-Approval`
- main CTA target: `/apply`

Status:
- passed

## Custom Domain Verification

Verified at:
- `https://finallysettled.com/request-showing`

Observed result at verification time:
- title still: `Request a Showing | Finally Settled`
- page still contained `/getapproved` in nav CTA
- page still showed the older form surface with `Property Showing Request`
- response header included `cache-control: public, max-age=300`

Status:
- failed at custom domain edge during initial verification

Interpretation:
- the production deployment is correct
- the custom domain was still serving cached old HTML during the verification window
- this looks like cache propagation lag rather than a bad deploy
- an explicit Cloudflare cache purge was attempted from this environment, but the available token returned `401 Unauthorized` for zone-level purge access

## Exact Next Check

Re-run after cache window expires:

```bash
curl -sL https://finallysettled.com/request-showing | rg -n "Showings Start With Pre-Approval|Showings are coordinated after pre-approval|Apply for Pre-Approval"
```

Expected after cache catches up:
- title reflects pre-approval-first framing
- headline reflects pre-approval-first framing
- body copy reflects pre-approval-first framing
- main CTA points to `/apply`

## Purge Attempt

Attempted action:
- purge Cloudflare cache for:
  - `https://finallysettled.com/request-showing`
  - `https://finallysettled.com/request-showing/`

Observed result:
- `401 Unauthorized`

Meaning:
- the current environment could read Pages deployment metadata
- the current environment could not perform zone-level cache purge for `finallysettled.com`

## Buyer-Facing Consistency Status

Repo and Pages production deploy:
- aligned

Custom domain at verification time:
- not yet aligned due to stale cached HTML
