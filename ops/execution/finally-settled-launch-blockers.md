# Finally Settled Launch Blockers

Updated: 2026-04-22

## Launch Verdict

Not safe to call fully launch-ready yet.

Safe path:
- launch a narrowed phase-1 lead engine after fixing the security and intake blockers below

Not required for phase 1:
- reels
- Canva automation
- Publer automation
- FFmpeg/Railway render-service recovery

## Hard Blockers

### 1. Public admin route accepts the default fallback password
- severity: Critical
- speed to complete: Fast
- revenue impact: High
- dependency order: 1
- owner: Codex
- blocker type: Security
- exact issue:
  - `functions/api/admin/airtable.js` falls back to `FS2026Admin`
  - live endpoint authenticated with that path during audit
- launch decision:
  - must fix before any serious traffic push

### 2. `/api/apply` does not fail safely
- severity: Critical
- speed to complete: Fast
- revenue impact: High
- dependency order: 2
- owner: Codex
- blocker type: Conversion
- exact issue:
  - malformed payload returned `500 {"error":"internal_error"}`
- launch decision:
  - must fix before paid traffic or outbound prospecting

### 3. Canonical buyer intake path is unclear
- severity: Critical
- speed to complete: Medium
- revenue impact: High
- dependency order: 3
- owner: Codex
- blocker type: Funnel clarity
- exact issue:
  - `/qualify.html` exists live but is not a real form
  - `/apply` exists, but the public CTA structure is not clearly aligned around it
- launch decision:
  - must fix before phase-1 launch

### 4. Listings sync workflow is live but not safely versioned
- severity: High
- speed to complete: Medium
- revenue impact: High
- dependency order: 5
- owner: Claude
- blocker type: Supply engine
- exact issue:
  - `VqLfiyi9b86A4AVb` is operationally critical but still contains inline secret handling
- launch decision:
  - can soft-launch before full cleanup if the workflow is stable, but should be corrected immediately after

### 5. Cloudflare deployment state is not repo-owned
- severity: High
- speed to complete: Medium
- revenue impact: Medium
- dependency order: 6
- owner: Codex
- blocker type: Source-of-truth integrity
- exact issue:
  - env vars, bindings, and deployment settings are not reconstructed from repo state
- launch decision:
  - does not block a narrow traffic launch
  - does block the bigger goal of GitHub as true source of truth

## Soft Blockers

### 6. Social content engine is incomplete and ambiguous
- severity: Medium
- speed to complete: Slow
- revenue impact: Low
- dependency order: 11
- owner: Claude
- blocker type: Growth ops
- exact issue:
  - live social workflows drift from documented Airtable tables
  - key source artifacts remain missing
- launch decision:
  - bypass for phase 1

### 7. Notion secret sprawl
- severity: Medium
- speed to complete: Slow
- revenue impact: Medium
- dependency order: 15
- owner: ChatGPT
- blocker type: Governance
- exact issue:
  - operational secrets are spread across Notion
- launch decision:
  - should be fixed urgently
  - not a reason to delay a tightly controlled phase-1 lead launch once exposed keys are rotated

## What Can Launch Now

If the top 3 hard blockers are fixed, this can launch now:
- listings site
- apply flow
- request-showing flow
- Airtable-backed lead capture
- operator follow-up from Airtable/email

## What Is Blocked

Blocked until fixed:
- secure public launch with the current admin fallback
- reliable paid traffic to `/apply` while the endpoint can 500 on bad inputs
- any claim that GitHub alone can recreate production

## What Can Be Bypassed Temporarily

Bypass in phase 1:
- `qualify.html` as a separate funnel
- reels
- Canva
- Publer
- FFmpeg render service
- social-image pool automation

## Phase-1 Answer On Reels

Reels are not required for phase-1 lead generation.

Phase-1 lead generation only needs:
- inventory
- credible listings pages
- a working intake form
- Airtable capture
- follow-up operations
