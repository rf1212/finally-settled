# Finally Settled Asset Inventory

Audit date: 2026-04-22

## Recovered Into GitHub

| Asset | Source | Synced Path | Status |
| --- | --- | --- | --- |
| Existing site root | existing repo | repo root | already present |
| Homes listings UI | existing repo | `homes/` | already present |
| Listings API | existing repo | `functions/api/listings.js` | already present |
| Image proxy | existing repo | `functions/api/image.js` | already present |
| Buyer application API | existing repo | `functions/api/apply.js` | already present |
| Admin Airtable proxy | existing repo | `functions/api/admin/airtable.js` | already present |
| Live `qualify.html` page | production site | `qualify.html` | recovered during audit |
| Homes build spec | local Downloads | `docs/finally-settled-homes-build-spec.md` | copied |
| Listings sync workflow | live n8n | `automation/n8n/finallysettled-apify-listings-sync.json` | exported + redacted |
| Viral clip factory v3 | live n8n | `automation/n8n/finally-settled-viral-clip-factory-v3.json` | exported + redacted |
| FS reel autodraft | live n8n | `automation/n8n/fs-reel-autodraft.json` | exported + redacted |
| Full Airtable schema | live Airtable metadata API | `airtable/schema/finally-settled-airtable-schema.json` | exported |
| Key Airtable tables snapshot | live Airtable metadata API | `airtable/schema/finally-settled-key-tables.json` | exported |
| Notion source index | Notion | `docs/notion-finally-settled-sources.md` | summarized |
| Environment placeholder template | audit-created | `docs/finally-settled.env.example` | added |

## Verified Live But Not Fully Captured As Source

| Asset | Live Location | Finding |
| --- | --- | --- |
| Cloudflare Pages deployment config | Cloudflare Pages project | no repo-owned config file recovered |
| Airtable contents | Airtable base `appLmQyh1ov0NDQ58` | schema captured, but table data was not exported |
| OpsCommand/Supabase company record | portfolio control plane | documented indirectly via Notion only |
| Internal deal qualifier | local/internal per Notion | not found on disk |

## Found Outside GitHub But Not Imported As Executable Assets

| Asset | Source | Reason Not Imported |
| --- | --- | --- |
| Notion specs and handoff pages | Notion | contain mixed operational guidance and plaintext secrets; summarized instead |
| Telegram export references to older RawFunds/Make workflows | local Downloads | historical context, not authoritative Finally Settled source |

## Missing

| Expected Asset | Expected Source | Result |
| --- | --- | --- |
| `finally-settled-content-engine-v2.json` | Notion social engine page | not found locally |
| `source-images-to-canva.py` | Notion social engine page | not found locally |
| `finally-settled-bulk-create.csv` | Notion social engine page | not found locally |
| `finally-settled-content-system.md` | Notion social engine page | not found locally |
| internal deal qualifier HTML | Notion build log | not found locally |
| Finally Settled-specific Supabase migrations/functions | local disk / repo | not found |
| Cloudflare Pages config file | repo/local disk | not found |
| existing safe `.env.example` | repo/local disk | not found |

## n8n Workflow Matrix

| Workflow | ID | Active | Trigger | Airtable Base/Table | Key Dependencies |
| --- | --- | --- | --- | --- | --- |
| FinallySettled — Apify Listings Sync | `VqLfiyi9b86A4AVb` | yes | Tue/Fri 05:00 UTC | `appLmQyh1ov0NDQ58` / `tblJBrj6XNjap4wQb` | Apify, Airtable, Gmail |
| Finally Settled Viral Clip Factory v3 | `K63Ut64YfW8Ll6BF` | yes | every 3 hours at :30, plus manual/webhook | `apptgY5Qc6HvgZKB8` / `tbliG4q5QElW9rV5Q` | Publer, Gemini, Shotstack, Apify |
| FS_Reel_AutoDraft | `5Fjnc5fB1dXH94vV` | no | every 10 min, plus webhook | `appLmQyh1ov0NDQ58` / `tblg93KZ6mhpiyg1u` | Render, Publer, Airtable |

## Files Found

Files found in or synced into this repo during the audit:

- `qualify.html`
- `docs/finally-settled-homes-build-spec.md`
- `docs/notion-finally-settled-sources.md`
- `docs/finally-settled.env.example`
- `automation/n8n/finallysettled-apify-listings-sync.json`
- `automation/n8n/finally-settled-viral-clip-factory-v3.json`
- `automation/n8n/fs-reel-autodraft.json`
- `airtable/schema/finally-settled-airtable-schema.json`
- `airtable/schema/finally-settled-key-tables.json`

## Files Missing

- `finally-settled-content-engine-v2.json`
- `source-images-to-canva.py`
- `finally-settled-bulk-create.csv`
- `finally-settled-content-system.md`
- internal deal qualifier HTML
- any Finally Settled-specific Supabase SQL/migrations/functions
- any repo-owned Cloudflare Pages config file
