# Finally Settled Recovery Plan

Plan date: 2026-04-22

Source of truth:
- current repo state
- `ops/audit/finally-settled-system-audit.md`
- `ops/audit/finally-settled-asset-inventory.md`
- `ops/audit/finally-settled-bottlenecks.md`
- `ops/audit/finally-settled-next-actions.md`
- `ops/audit/finally-settled-claude-addendum.md`
- PR #8 findings and artifacts already committed on `audit/finally-settled-system-sync`

Operating rule:
- live-system audit remains primary truth
- Claude-history is only used where already reconciled in the audit

## Executive Call

Finally Settled does not need the full social/reel stack to launch a phase-1 lead engine.

What can be launched now, after targeted hardening:
- the public site on Cloudflare Pages
- the homes listings experience at `homes.finallysettled.com`
- the listings sync workflow `VqLfiyi9b86A4AVb`
- a lead intake flow centered on `/apply` once request validation and security issues are fixed

What is blocked:
- treating GitHub as the full source of truth while Cloudflare config and live secrets remain off-repo
- trusting the public admin route while the fallback password path is active
- relying on the current social/reel stack as canonical, because the workflow path and missing assets are still ambiguous

What can be bypassed temporarily:
- `qualify.html` as a separate funnel
- Canva/Publer/reel automation
- FFmpeg/Railway render-service recovery
- the full social content engine rebuild

Are reels required for phase-1 lead generation:
- no
- phase-1 can launch with listings, apply flow, request-showing flow, and basic email/Airtable capture
- reels are a traffic amplifier, not a hard dependency for validating lead intake or buyer demand

## Minimum Launchable Lead Engine

Phase-1 launchable stack:
1. public marketing site on `finallysettled.com`
2. live listings site on `homes.finallysettled.com`
3. working listings sync from Apify -> Airtable -> site
4. one canonical buyer intake path, preferably `/apply`
5. Airtable writes for applications, contacts, and leads
6. basic operator visibility into submissions and showing requests

Phase-1 does not require:
- reels
- Canva automation
- Publer automation
- a render service
- the full content-engine v2 artifact set

## Task Queue

Ranking scale:
- severity: Critical / High / Medium / Low
- speed to complete: Fast / Medium / Slow
- revenue impact: High / Medium / Low

### Bucket 1: Recover Existing Missing Assets

#### 1. Recover canonical social-engine artifacts from original outputs
- status: `RECOVER`
- severity: High
- speed to complete: Medium
- revenue impact: Medium
- dependency order: 7
- owner: Claude
- scope:
  - `finally-settled-content-engine-v2.json`
  - `source-images-to-canva.py`
  - `finally-settled-bulk-create.csv`
  - `finally-settled-content-system.md`
- reason:
  - audit and reconciled Claude history both say these existed
  - they are not required for phase-1 launch, but they are the most likely recoverable missing operating assets

#### 2. Recover any unretrieved workflow exports for historical social paths
- status: `RECOVER`
- severity: Medium
- speed to complete: Medium
- revenue impact: Low
- dependency order: 8
- owner: Claude
- scope:
  - `FS_Content_Select`
  - `FS_Generate_Static_Image_Post`
  - `FS_Generate_Reel_Post`
- reason:
  - these were referenced in reconciled history but not found in current repo/workspace
  - recover only if they can be tied to a real live or exported asset

#### 3. Recover internal deal qualifier asset if it still exists anywhere in operator files
- status: `RECOVER`
- severity: Medium
- speed to complete: Medium
- revenue impact: Medium
- dependency order: 9
- owner: Claude
- scope:
  - internal deal qualifier HTML referenced by Notion
- reason:
  - this may support internal buyer screening, but it is not required to open phase-1 lead intake

### Bucket 2: Rebuild Unrecoverable Assets

#### 4. Rebuild the buyer-intake flow around one canonical entrypoint
- status: `REBUILD`
- severity: Critical
- speed to complete: Medium
- revenue impact: High
- dependency order: 3
- owner: Codex
- scope:
  - decide `/apply` vs `/qualify.html`
  - either deprecate `qualify.html` or replace it with a real form
  - ensure a single public CTA path
- reason:
  - the launch funnel is unclear today
  - this is a direct conversion blocker

#### 5. Rebuild request validation and graceful failure behavior in `/api/apply`
- status: `REBUILD`
- severity: Critical
- speed to complete: Fast
- revenue impact: High
- dependency order: 2
- owner: Codex
- scope:
  - reject malformed payloads with 400s
  - add clear validation messages
  - add structured error logging around Airtable/MailerLite
- reason:
  - this endpoint currently throws `500 internal_error` on malformed input

#### 6. Rebuild repo-owned Cloudflare deployment documentation/templates
- status: `REBUILD`
- severity: High
- speed to complete: Medium
- revenue impact: Medium
- dependency order: 6
- owner: Codex
- scope:
  - Pages env var inventory
  - domain bindings
  - KV/binding requirements
  - deployment runbook/template docs
- reason:
  - GitHub cannot be source-of-truth without this

#### 7. Rebuild the social stack only after a canonical path is chosen
- status: `REBUILD`
- severity: Medium
- speed to complete: Slow
- revenue impact: Low
- dependency order: 12
- owner: Claude
- scope:
  - choose between current active workflow, `FS_Reel_AutoDraft`, or a rebuilt simplified path
  - rebuild only the chosen path
- reason:
  - current social architecture is ambiguous
  - not required for phase-1 lead generation

### Bucket 3: Validate Live n8n Workflows

#### 8. Secure and validate `FinallySettled — Apify Listings Sync`
- status: `REBUILD`
- severity: High
- speed to complete: Medium
- revenue impact: High
- dependency order: 5
- owner: Claude
- scope:
  - move inline secrets to credentials/env-backed config
  - confirm schedule, actor task, field mapping, and email notifications
  - confirm it writes correctly to `Listings`
- reason:
  - this is the core inventory supply engine for the listings site

#### 9. Validate whether any social workflow should remain active for launch
- status: `DEFER`
- severity: Medium
- speed to complete: Medium
- revenue impact: Low
- dependency order: 11
- owner: Claude
- scope:
  - inspect `K63Ut64YfW8Ll6BF`
  - inspect `5Fjnc5fB1dXH94vV`
  - either archive, disable, or bless one as canonical
- reason:
  - launch can proceed without reels
  - this should not block lead engine release

### Bucket 4: Validate Airtable Dependencies

#### 10. Validate the launch-critical Airtable tables and field dependencies
- status: `REBUILD`
- severity: High
- speed to complete: Fast
- revenue impact: High
- dependency order: 4
- owner: Codex
- scope:
  - `Listings`
  - `Applications`
  - `Contacts`
  - `Leads`
  - `Showing Requests`
- reason:
  - these support the actual lead engine
  - social tables can be secondary for phase 1

#### 11. Validate write paths from site functions into Airtable
- status: `REBUILD`
- severity: High
- speed to complete: Medium
- revenue impact: High
- dependency order: 10
- owner: Codex
- scope:
  - `functions/api/apply.js`
  - any showing-request handling path
  - downstream email/subscriber behavior
- reason:
  - a working frontend without persistent writes is not a launch

### Bucket 5: Validate Canva / Publer / Reel Pipeline

#### 12. Determine whether Canva/Publer are recoverable, rebuildable, or deferrable
- status: `DEFER`
- severity: Low
- speed to complete: Medium
- revenue impact: Low
- dependency order: 13
- owner: Claude
- scope:
  - confirm live Canva dependency
  - confirm live Publer dependency
  - confirm whether any render service is actually in use
- reason:
  - this pipeline is not needed to validate buyer demand in phase 1

#### 13. Archive or document non-canonical reel/render artifacts
- status: `DEFER`
- severity: Low
- speed to complete: Fast
- revenue impact: Low
- dependency order: 14
- owner: Claude
- scope:
  - `ffmpeg-render-service.py`
  - `fs-reel-agent.py`
  - Railway deploy references
  - render-service preview artifacts
- reason:
  - once a decision is made, remaining historical assets should be archived or dropped

### Bucket 6: Define Minimum Launchable Lead Engine

#### 14. Remove the admin fallback password and harden the public admin surface
- status: `REBUILD`
- severity: Critical
- speed to complete: Fast
- revenue impact: High
- dependency order: 1
- owner: Codex
- scope:
  - remove fallback `FS2026Admin`
  - require `ADMIN_PASSWORD`
  - restrict or remove the public route
- reason:
  - this is the most urgent live-system security issue

#### 15. Clean up Notion-secret sprawl and rotate compromised values
- status: `REBUILD`
- severity: Critical
- speed to complete: Slow
- revenue impact: Medium
- dependency order: 15
- owner: ChatGPT
- scope:
  - rotate exposed secrets
  - replace secrets in Notion with variable names or secret-manager references
- reason:
  - this matters for source-of-truth integrity and long-term safety

## Decision Table For Missing Assets

| Asset | Decision | Why |
| --- | --- | --- |
| `finally-settled-content-engine-v2.json` | `RECOVER` | explicitly referenced in reconciled audit/addendum and likely existed outside repo |
| `source-images-to-canva.py` | `RECOVER` | explicitly referenced in reconciled audit/addendum and likely existed outside repo |
| `finally-settled-bulk-create.csv` | `RECOVER` | likely generated output, useful but non-blocking |
| `finally-settled-content-system.md` | `RECOVER` | likely generated output, useful but non-blocking |
| `fs-reel-agent.py` | `DEFER` | historical social artifact, not needed for phase-1 lead engine |
| `ffmpeg-render-service.py` | `DEFER` | historical social artifact, not needed for phase-1 lead engine |
| `render-service-deploy.tar.gz` | `DEFER` | tied to non-essential reel path |
| `RAILWAY_DEPLOY_INSTRUCTIONS.md` | `DEFER` | tied to non-essential reel path |
| `reel-rotating-sample.html` | `DEFER` | preview-only asset for non-essential reel path |
| `FS_Content_Select` export | `RECOVER` | recover if present anywhere, otherwise do not rebuild before launch |
| `FS_Generate_Static_Image_Post` export | `RECOVER` | recover if present anywhere, otherwise do not rebuild before launch |
| `FS_Generate_Reel_Post` export | `RECOVER` | recover if present anywhere, otherwise do not rebuild before launch |
| internal deal qualifier HTML | `RECOVER` | useful internal tool, not a phase-1 blocker |
| Cloudflare Pages config file | `REBUILD` | required for GitHub source-of-truth goal |
| Finally Settled-specific Supabase migrations/functions | `DEFER` | not part of current public-site runtime |

## Dependency Order Summary

1. remove admin fallback and harden admin surface
2. fix `/api/apply` validation
3. choose one canonical buyer-intake path
4. validate Airtable launch tables
5. secure and validate listings sync workflow
6. document Cloudflare deployment state
7. recover likely-missing social-engine artifacts
8. recover any historical workflow exports that actually exist
9. recover internal deal qualifier if found
10. validate all launch-critical Airtable writes end to end
11. decide whether any social workflow remains active during launch
12. rebuild a canonical social stack only if traffic strategy requires it
13. assess Canva/Publer pipeline after launch-critical path is stable
14. archive non-canonical reel/render assets
15. rotate secrets and clean Notion storage
