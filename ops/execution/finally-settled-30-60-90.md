# Finally Settled 30-60-90

Updated: 2026-04-22

## 0-30 Days

Primary objective:
- make the current lead engine safe and launchable

Priority outcomes:
1. Remove admin fallback auth from `functions/api/admin/airtable.js`
2. Fix `/api/apply` validation and error handling
3. Pick one canonical intake path and align CTAs to it
4. Validate Airtable writes for applications, contacts, leads, and showing requests
5. Validate `FinallySettled — Apify Listings Sync` against live Airtable output
6. Capture Cloudflare Pages settings in repo docs/templates

Success criteria:
- no public default admin credential
- no malformed-input 500s on `/api/apply`
- one clear public intake route
- listings refresh on schedule
- applications land in Airtable cleanly

## 31-60 Days

Primary objective:
- restore source-of-truth discipline and recover missing operating assets

Priority outcomes:
1. Recover the likely-missing social-engine artifacts
2. Recover any historical workflow exports that still exist
3. Decide whether `K63Ut64YfW8Ll6BF` or `5Fjnc5fB1dXH94vV` is the supported social path
4. Archive or disable non-canonical social workflows
5. Rotate compromised secrets and scrub Notion

Success criteria:
- all recoverable operating artifacts are either in repo or explicitly marked unrecoverable
- one documented social path exists, even if inactive
- live secrets no longer live in docs

## 61-90 Days

Primary objective:
- improve growth operations only after the lead engine is stable

Priority outcomes:
1. Rebuild any unrecoverable but valuable social assets
2. Reassess Canva/Publer/reel pipeline from a revenue perspective
3. Implement a simplified, canonical social publishing path if still justified
4. Decide whether to revive, replace, or permanently defer FFmpeg/render-service work

Success criteria:
- every active workflow has a repo-owned export/runbook
- growth automation is documented, minimal, and intentionally scoped
- no active workflow depends on undocumented operator memory

## 30-60-90 Ownership

### Codex
- admin route hardening
- `/api/apply` reliability
- intake path cleanup
- Cloudflare repo-owned deployment/runbook docs
- Airtable write-path validation

### Claude
- recover missing social assets
- validate live n8n workflows
- choose/archive social workflow paths
- rebuild social artifacts only if still justified

### ChatGPT
- secret rotation coordination
- Notion cleanup
- operator-facing documentation and governance cleanup
