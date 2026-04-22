# Finally Settled System Audit

Audit date: 2026-04-22

Target repo:
- `rf1212/finally-settled`
- local path: `/Users/chris/Documents/finally-settled`
- branch: `audit/finally-settled-system-sync`

Goal:
- Make GitHub the source of truth for Finally Settled by identifying live operating assets, recovering what is recoverable, and documenting what is still missing or unsafe.

## Executive Summary

The public Finally Settled site is live on Cloudflare and partially represented in GitHub, but the operating stack is split across four systems:

1. GitHub repo `rf1212/finally-settled`
2. Live n8n workflows on `https://n8n.autogrowthhub.com`
3. Airtable base `appLmQyh1ov0NDQ58`
4. Notion specs and handoff pages

Direct n8n API access worked from this environment.

The repo already contains the public site root pages, `/homes` pages, and the main Cloudflare Pages functions, but it does not fully reflect production reality. The largest gaps are:

- live `qualify.html` existed outside GitHub
- active social/content workflows live in n8n with inline secrets
- content-engine source artifacts referenced in Notion were not recoverable locally
- the live admin proxy accepts the default password fallback
- Notion pages contain plaintext secrets and operational credentials

## 1. Git Repo Audit

Remote:
- `origin https://github.com/rf1212/finally-settled.git`

Current repo contents relevant to production:
- `index.html`
- `apply/index.html`
- `request-showing/index.html`
- `agents/index.html`
- `how-it-works/index.html`
- `blog/index.html`
- `homes/index.html`
- `homes/listing/index.html`
- `functions/api/listings.js`
- `functions/api/image.js`
- `functions/api/apply.js`
- `functions/api/admin/airtable.js`
- `functions/_middleware.js`

Recovered during this audit:
- `qualify.html` recovered from live production and added to GitHub working tree
- sanitized workflow exports added under `automation/n8n/`
- Airtable schema snapshots added under `airtable/schema/`
- local build spec copied to `docs/finally-settled-homes-build-spec.md`

Important repo observations:
- `functions/api/listings.js` uses Airtable base `appLmQyh1ov0NDQ58` and table `tblJBrj6XNjap4wQb`
- `functions/api/image.js` proxies Zillow static images server-side
- `functions/api/apply.js` writes to Airtable `Applications`, `Contacts`, and `Leads`, then attempts MailerLite subscription + email
- `functions/api/admin/airtable.js` uses a default fallback password `FS2026Admin` if `ADMIN_PASSWORD` is unset

## 2. Live Site / Cloudflare Pages Audit

Verified live:
- `https://finallysettled.com` → HTTP 200 via Cloudflare
- `https://homes.finallysettled.com` → HTTP 200 via Cloudflare
- `https://homes.finallysettled.com/api/listings` → HTTP 200 JSON
- `https://homes.finallysettled.com/api/image?...` → HTTP 200 JPEG
- `https://finallysettled.com/api/apply` → route exists
- `https://finallysettled.com/api/admin/airtable` → route exists
- `https://finallysettled.com/qualify.html` → route exists

Observed live behavior:
- `/api/listings` returned 600 listing rows at audit time
- `/api/image` returned a 596x446 JPEG for a known image key
- `/api/apply` returned `500 {"error":"internal_error"}` for malformed POST payload instead of a clean validation error
- `/api/admin/airtable` returned `401` with no auth header
- `/api/admin/airtable` returned `400 {"error":"table required"}` when called with `X-Admin-Auth: FS2026Admin`, proving the default password path currently authenticates in production

Cloudflare config findings:
- No `wrangler.toml`, Pages config file, or Cloudflare deployment automation was found in this repo
- Production clearly serves via Cloudflare Pages, but Cloudflare configuration is not repo-owned here

## 3. n8n Direct Audit

Result:
- direct n8n API access worked

Instance:
- `https://n8n.autogrowthhub.com/api/v1`

Relevant workflows found:

### A. `FinallySettled — Apify Listings Sync`
- workflow id: `VqLfiyi9b86A4AVb`
- active: `true`
- archived: `false`
- trigger: schedule
- schedule: Tuesday and Friday at 05:00 UTC
- webhook: none
- purpose: scrape listings from Apify and upsert into Airtable listings table
- destination systems:
  - Apify actor task `F2Ngv6tdXAGu8rwvb`
  - Airtable base `appLmQyh1ov0NDQ58`, table `tblJBrj6XNjap4wQb`
  - Gmail API for success/failure/error notifications
- credential references:
  - Airtable Personal Access Token account
    - id: `BPWOrtwLe4IsJIrh`
    - type: `airtableTokenApi`
    - used by: `Upsert to Airtable`
  - Communications - Gmail OAuth2
    - id: `KOiAJiJUgtM7Rjqn`
    - type: `gmailOAuth2`
    - used by: `Success Email`, `Failure Email`, `Error Email`
- unsafe finding:
  - Apify token is hardcoded inline in URLs, not stored as an n8n credential

### B. `Finally Settled Viral Clip Factory v3`
- workflow id: `K63Ut64YfW8Ll6BF`
- active: `true`
- archived: `false`
- triggers:
  - schedule trigger
  - manual trigger
  - webhook trigger
- schedule:
  - workflow export shows cron expression `30 */3 * * *`
  - practical interpretation: every 3 hours at minute 30
- webhook path:
  - `finally-settled-test`
- external dependencies:
  - Publer API
  - Gemini API
  - Shotstack API
  - Apify video download actor
  - Apify transcript actor
- Airtable destination actually used:
  - base `apptgY5Qc6HvgZKB8`
  - table `tbliG4q5QElW9rV5Q` (`Video Clip Feed`)
- unsafe findings:
  - no n8n credential objects are used for key APIs
  - Gemini key, Apify token, Airtable PAT, and Shotstack key are hardcoded inline
  - this active workflow does not target the Finally Settled Airtable social tables described in Notion

### C. `FS_Reel_AutoDraft`
- workflow id: `5Fjnc5fB1dXH94vV`
- active: `false`
- archived: `false`
- triggers:
  - schedule trigger
  - webhook trigger
- schedule:
  - cron `*/10 * * * *`
  - practical interpretation: every 10 minutes
- webhook path:
  - `fs-reel-test`
- external dependencies:
  - Airtable
  - Render endpoint `https://rawfunds-ffmpeg-render.onrender.com/render-reel`
  - Publer API
- Airtable destination:
  - base `appLmQyh1ov0NDQ58`
  - table `tblg93KZ6mhpiyg1u` (`SocialContentQueue`)
- status note:
  - this looks closer to the Notion social-engine data model than the currently active `Viral Clip Factory v3`

Workflow exports recovered:
- `automation/n8n/finallysettled-apify-listings-sync.json`
- `automation/n8n/finally-settled-viral-clip-factory-v3.json`
- `automation/n8n/fs-reel-autodraft.json`

## 4. Airtable Audit

Verified live base:
- base id: `appLmQyh1ov0NDQ58`
- recovered schema: `airtable/schema/finally-settled-airtable-schema.json`

Total tables found in base:
- 17

High-signal tables:
- `Listings` — `tblJBrj6XNjap4wQb`
- `Applications` — `tblTgMoIGtR0y6m7O`
- `Showing Requests` — `tblPU4U1XhDKCrAW0`
- `SocialImagePool` — `tblCLKcbcat9jto3c`
- `SocialContentQueue` — `tblg93KZ6mhpiyg1u`

Important Airtable findings:
- The listings base is much broader than the repo functions alone suggest
- Social engine tables already exist live in Airtable
- Applications table includes the extra qualifier fields mentioned in Notion:
  - `Down Payment Amount`
  - `Active Bankruptcy or Foreclosure`
  - `Active or Recent Lawsuits`
  - `Deal Decision`
  - `Recommended Sale Price`
  - `Est Monthly Payment`
  - `Est Net Per Month`
  - `Deal Notes`

Mismatch:
- Notion says the active social content engine should use `SocialImagePool` + `SocialContentQueue` in `appLmQyh1ov0NDQ58`
- the active workflow `Finally Settled Viral Clip Factory v3` uses a different Airtable base and table entirely

## 5. Notion Audit

High-signal Notion pages found:
- `🏡 Finally Settled — Homes Listings Site Build Spec (Claude Cowork)`
- `🏠 Finally Settled — Cloudflare Pages Site Build Spec (Claude Cowork)`
- `🏠 FinallySettled — Apify → Airtable Listings Sync (n8n Workflow Spec)`
- `Finally Settled — Social Content Engine`
- `🏠 Finally Settled — Full Strategy & Build Log (April 15, 2026)`
- `🔄 Session Handoff — April 1 2026`

Recovered Notion evidence:
- docs summary: `docs/notion-finally-settled-sources.md`

Key Notion findings:
- Notion accurately documents the live listings sync workflow id `VqLfiyi9b86A4AVb`
- Notion claims a buyer form is live at `/qualify.html`
- Notion claims an internal deal qualifier exists as a local HTML file
- Notion says the social engine artifacts were delivered as:
  - `finally-settled-content-engine-v2.json`
  - `source-images-to-canva.py`
  - `finally-settled-bulk-create.csv`
  - `finally-settled-content-system.md`
- Notion handoff notes say Finally Settled exists as a company record in OpsCommand/Supabase

Critical security finding:
- multiple Notion pages contain plaintext secrets or tokens
- Notion is currently being used as an unsafe secret store

## 6. Local Files / Nearby Workspaces

Recovered local artifacts:
- `docs/finally-settled-homes-build-spec.md` copied from local Downloads
- `qualify.html` recovered from live production

Nearby codebases inspected:
- `/Users/chris/Desktop/project-omega`
- `/Users/chris/Desktop/runpod-chatterbox/dashboard-central`

Findings:
- `project-omega` contains generic Airtable/Supabase/n8n tooling and a separate Airtable base
- `dashboard-central` appears to be OpsCommand / portfolio control-plane code
- Notion says Finally Settled was added to OpsCommand/Supabase, but no dedicated Finally Settled Supabase migration or function files were recovered locally for this repo

## 7. Supabase Audit

Direct Finally Settled repo findings:
- no Supabase folder or migrations existed before this audit
- no Finally Settled-specific SQL or function files were recovered locally

Indirect evidence:
- Notion handoff lists Finally Settled as a company in OpsCommand/Supabase with id `18d5ce46-25af-4934-8558-68bfad07794f`

Assessment:
- Supabase is not currently a public-site runtime dependency for `rf1212/finally-settled`
- Supabase appears to be an adjacent portfolio-management dependency, not a repo-owned application layer

## 8. Missing or Unrecovered Assets

Not found locally:
- `finally-settled-content-engine-v2.json`
- `source-images-to-canva.py`
- `finally-settled-bulk-create.csv`
- `finally-settled-content-system.md`
- internal deal qualifier HTML file
- any Finally Settled-specific Supabase migrations or edge functions
- any Cloudflare Pages config file such as `wrangler.toml`
- any Finally Settled-specific `.env.example` checked into source prior to this audit

Recovered but inconsistent:
- `qualify.html` exists live but is not a real qualification form; it is a static page/homepage variant with no `<form>` or submit behavior

## Conclusion

GitHub is now materially closer to the real operating state, but it is not yet the sole source of truth.

The public site and core listings functions are in GitHub. The biggest remaining drift is in:
- live n8n content automation
- secrets management
- missing content-engine source artifacts
- the fake/live-drifted `qualify.html`
- the production admin route accepting the fallback password

Those issues are detailed in:
- `ops/audit/finally-settled-asset-inventory.md`
- `ops/audit/finally-settled-bottlenecks.md`
- `ops/audit/finally-settled-next-actions.md`
