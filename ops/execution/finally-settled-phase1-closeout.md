# Finally Settled Phase 1 Closeout

Updated: 2026-04-23

Source of truth:
- current repo state
- merged production commits through `18a15be2f92fd2e163e0eb53e371fbcfe9e24c57`
- `ops/execution/finally-settled-production-verification.md`
- `ops/execution/finally-settled-live-launch-verification.md`
- `ops/execution/finally-settled-request-showing-live-verification.md`

## Phase 1 Verdict

Phase 1 is complete for a limited lead capture launch.

The canonical intake flow is live at `/apply`, the hardening changes are on production, and valid submissions still succeed. The remaining open issue is a non-blocking custom-domain cache mismatch on `/request-showing`.

## Live And Working

- `https://finallysettled.com/apply` is the canonical buyer intake route
- `https://finallysettled.com/qualify.html` redirects to `/apply`
- `/api/apply` now returns safe `400` responses for malformed JSON, incomplete payloads, and invalid down payment values
- valid `/api/apply` submissions still return `200 {"success":true,"declined":false,"reason":null}`
- Cloudflare Pages production is on commit `18a15be2f92fd2e163e0eb53e371fbcfe9e24c57`
- the Pages production deploy URL already shows the corrected `/request-showing` pre-approval-first content
- `homes.finallysettled.com` remains part of the live inventory surface

## Merged But Edge-Cached / Stale

- `/request-showing` fix is merged into `main` and present on the active Pages production deployment
- `https://finallysettled.com/request-showing` was still serving cached old HTML at verification time
- the stale response still showed:
  - old title `Request a Showing | Finally Settled`
  - old `/getapproved` nav CTA
  - old `Property Showing Request` form surface
- this appears to be edge cache lag on the custom domain, not a bad production deploy
- a cache purge attempt from this environment failed with `401 Unauthorized`, so the stale edge response could not be forcibly cleared here

## Still Missing

- direct Airtable verification from this environment is still unavailable because available API access returned `401 Unauthorized`
- repo-owned Cloudflare zone purge capability is still missing from this environment
- full repo-owned Cloudflare deployment configuration is still not reconstructed
- canonical repo-owned recovery of the historical social/content engine artifacts is still incomplete
- a repo-owned write path for `Showing Requests` is still not confirmed as part of the current launch path

## Deferred On Purpose

- reels
- Canva automation
- Publer automation
- FFmpeg/render-service recovery
- rebuild of historical social workflow paths
- recovery of non-launch-critical social artifacts

## What Shipped In Phase 1

- admin route hardening removed the fallback password behavior
- `/api/apply` now fails safely on bad inputs
- `/apply` is the canonical public intake route
- `/qualify.html` now acts as a redirect instead of a competing path
- production was promoted through PR #8 and then PR #9
- `/request-showing` copy was rewritten in the repo and production deploy to support the pre-approval-first flow

## Non-Blocking Open Issues

1. Custom-domain cache lag on `/request-showing`
- category: cleanup
- impact: medium
- why non-blocking:
  - the canonical traffic path is `/apply`
  - the production deploy itself is correct

2. Cloudflare configuration is still not fully repo-owned
- category: cleanup
- impact: medium
- why non-blocking:
  - production is live and functioning
  - this affects reproducibility and operator control, not current lead capture

3. Direct Airtable verification is still manual from this environment
- category: cleanup
- impact: medium
- why non-blocking:
  - valid live submissions succeeded
  - operators can still verify records manually in Airtable

## Launch-Critical Definition For Phase 1

Phase 1 required:
- one canonical buyer route
- safe intake validation
- successful live lead capture
- production deployment on the hardened code path

Phase 1 did not require:
- social automation
- render infrastructure
- full GitHub reconstruction of every off-repo control plane setting

## Final Call

Finally Settled phase 1 is officially complete.

The launch should be treated as a limited lead capture release with `/apply` as the only canonical traffic destination. The one lingering buyer-facing inconsistency is the cached `/request-showing` custom-domain page, which should be resolved operationally but does not block the current phase-1 intake engine.
