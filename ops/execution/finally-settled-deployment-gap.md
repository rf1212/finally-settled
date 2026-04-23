# Finally Settled Deployment Gap

Updated: 2026-04-23

Scope:
- identify the exact gap between the verified PR preview behavior and the live production site at `https://finallysettled.com`

Source of truth:
- current repo state
- PR #8
- `ops/execution/finally-settled-production-verification.md`
- `ops/execution/finally-settled-production-promotion.md`
- `ops/execution/finally-settled-live-launch-verification.md`
- live Cloudflare Pages project metadata queried from the current environment

## Executive Answer

Production is still serving old behavior because PR #8 is not merged into `main`.

This is not a wrong-project, wrong-repo, wrong-branch, or stale-preview problem.

Cloudflare Pages production is correctly pointed at:
- repo: `rf1212/finally-settled`
- project: `finally-settled`
- production branch: `main`

The exact gap is that Cloudflare production is deploying `main`, and `main` is still on the older commit:
- `e15aad32da8c088fa6b1655c41fc2830e728c645`
- commit message: `feat: buyer form API wired, admin qualifier, bankruptcy/lawsuit fields`

The hardened intake changes exist only on:
- branch: `audit/finally-settled-system-sync`
- PR: `#8`
- preview deploys for that branch

## GitHub Merge State

PR #8 status at audit time:
- state: `OPEN`
- merged: `no`
- base branch: `main`
- head branch: `audit/finally-settled-system-sync`

Implication:
- `main` has never received the hardened changes from PR #8
- Cloudflare production therefore has nothing new to deploy

## Latest Commit On `main`

Latest remote `main` commit:
- `e15aad32da8c088fa6b1655c41fc2830e728c645`
- `feat: buyer form API wired, admin qualifier, bankruptcy/lawsuit fields`

This matches the live production behavior we observed:
- `/qualify.html` still returns `200`
- `/request-showing` still shows the older `/getapproved` surface
- `/api/apply` still returns `500 {"error":"internal_error"}` for malformed or invalid payloads

## Cloudflare Pages Project Wiring

Cloudflare Pages project found:
- project name: `finally-settled`
- subdomain: `finally-settled.pages.dev`
- custom domains:
  - `finally-settled.pages.dev`
  - `finallysettled.com`
  - `homes.finallysettled.com`

Git integration on the Pages project:
- source type: `github`
- owner: `rf1212`
- repo: `finally-settled`
- production branch: `main`
- production deployments enabled: `true`
- preview deployments enabled: `true`

Conclusion:
- Cloudflare production is pointed at the correct repo
- Cloudflare production is pointed at the correct Pages project
- Cloudflare production is pointed at the correct branch

## Preview vs Production Project Check

Preview and production are using the same Cloudflare Pages project.

Evidence:
- preview URLs are under `*.finally-settled.pages.dev`
- production custom domain `finallysettled.com` is attached to the same `finally-settled` Pages project
- recent deployments show both preview and production entries inside the same project deployment history

Implication:
- there is no split-project drift between preview and production

## Recent Deployment Evidence

Recent preview deployments from the audit branch succeeded, including:
- `3ee5fed2cfe1df07e5305469f921b8db27e5990d` on `audit/finally-settled-system-sync`
- `f91fbc23a05349695ea3f503be4601babf3fccc9` on `audit/finally-settled-system-sync`
- `5ccd3753c934dd1afd7324d3cc8013145de22ac9` on `audit/finally-settled-system-sync`
- `ee6a5e090c98e861afa0e5662e2fd964bc609c56` on `audit/finally-settled-system-sync`

Latest production deployment in the same Pages project:
- environment: `production`
- branch: `main`
- commit: `e15aad32da8c088fa6b1655c41fc2830e728c645`
- created: `2026-04-16T05:31:12.136Z`

Interpretation:
- preview is current for the audit branch
- production is current for `main`
- the production site is old because `main` is old

## Multiple Projects Or Domains

Multiple Cloudflare Pages projects serving Finally Settled:
- none found

Multiple domains on the project:
- yes, but attached to the same correct Pages project

Operational meaning:
- there is no evidence that `finallysettled.com` is pointed at a different Pages project
- there is no evidence that preview is coming from one project while production comes from another

## Repo-Owned Deployment Config Gap

The deployment wiring is still not repo-owned.

Missing from the repo:
- `wrangler.toml`
- a repo-owned Pages project config
- a repo-owned declaration of the production branch / project binding

Manual control point causing the issue:
- Cloudflare Pages Git integration and production-branch wiring live in the Cloudflare dashboard/API, not in the repo
- merge/promotion into `main` is therefore the effective trigger for production deployment

Important nuance:
- the immediate cause of the old production behavior is still the unmerged PR
- the non-repo-owned Pages configuration is a governance gap, not the direct cause of this specific stale deploy

## Exact Reason Production Is Still Old

Exact reason:
- Cloudflare Pages production correctly deploys from `rf1212/finally-settled` on branch `main`
- PR #8 is still open
- `main` still points to `e15aad32da8c088fa6b1655c41fc2830e728c645`
- production therefore continues to serve the old intake implementation

## Exact Next Action

1. Merge PR #8 into `main`.
2. Wait for Cloudflare Pages to create a new production deployment for commit `main` head after merge.
3. Re-run the live production checks in this order:
   - `/qualify.html`
   - `/apply`
   - `/request-showing`
   - `/api/apply` malformed JSON
   - `/api/apply` incomplete payload
   - `/api/apply` invalid down payment
   - `/api/apply` controlled valid payload
4. Confirm the production deployment commit is no longer `e15aad32da8c088fa6b1655c41fc2830e728c645`.

## Final Conclusion

There is no hidden deployment mystery here.

Production is old because `main` is old.

The verified preview behavior is real and is already deploying successfully inside the correct Cloudflare Pages project, but only for the audit branch. Production will not catch up until the PR is actually merged and Cloudflare Pages redeploys `main`.
