# Finally Settled Bottlenecks

## 1. Production Admin API accepts default password

Why it matters:
- The public admin proxy at `https://finallysettled.com/api/admin/airtable` authenticated when sent `X-Admin-Auth: FS2026Admin`.
- That means the fallback password path in production is active right now.

Evidence:
- no auth → `401 unauthorized`
- `X-Admin-Auth: FS2026Admin` → `400 table required`

Location:
- repo code: `functions/api/admin/airtable.js`
- live system: `finallysettled.com/api/admin/airtable`

Impact:
- predictable admin credential on a public endpoint
- unauthorized Airtable reads/updates are possible if route usage is understood

## 2. n8n workflows contain inline secrets and are not safely versioned

Why it matters:
- active Finally Settled workflows store secrets inline inside workflow JSON, not in credential objects
- GitHub cannot safely become source-of-truth while the live automation layer depends on hidden, hardcoded secrets

Evidence:
- `FinallySettled — Apify Listings Sync` hardcodes Apify token in URLs
- `Finally Settled Viral Clip Factory v3` hardcodes Airtable PAT, Gemini key, Apify token, and Shotstack key

Location:
- live n8n: `VqLfiyi9b86A4AVb`, `K63Ut64YfW8Ll6BF`, `5Fjnc5fB1dXH94vV`
- Notion pages also repeat sensitive credential material

Impact:
- unsafe to re-import blindly
- high secret-rotation overhead
- difficult to audit or promote between environments

## 3. Social content engine is drifted and incomplete

Why it matters:
- Notion says the Finally Settled social engine should use `SocialImagePool` and `SocialContentQueue` in the Finally Settled Airtable base
- the active content workflow is pointed at a different Airtable base/table
- the key source artifacts referenced in Notion were not recoverable

Evidence:
- active workflow `K63Ut64YfW8Ll6BF` writes to `apptgY5Qc6HvgZKB8/tbliG4q5QElW9rV5Q`
- Notion social engine expects `appLmQyh1ov0NDQ58/tblg93KZ6mhpiyg1u` and `tblCLKcbcat9jto3c`
- missing files:
  - `finally-settled-content-engine-v2.json`
  - `source-images-to-canva.py`
  - `finally-settled-bulk-create.csv`
  - `finally-settled-content-system.md`

Impact:
- social engine cannot be treated as repo-backed or reproducible
- current active workflow may be operating on the wrong dataset

## 4. `qualify.html` drift: live page exists, GitHub did not have it, and it is not a real form

Why it matters:
- Notion says a live buyer form exists at `/qualify.html`
- GitHub had no `qualify.html`
- recovered live page contains no `<form>` and no submission logic

Evidence:
- `https://finallysettled.com/qualify.html` → HTTP 200
- recovered file is static page content with no form POST flow

Impact:
- qualification funnel is unclear and misleading
- GitHub was missing a production asset
- business logic described in Notion does not match the live file

## 5. `/api/apply` exists but degrades to server error on malformed input

Why it matters:
- public application route should fail gracefully with validation errors
- current malformed request returned `500 internal_error`

Location:
- repo code: `functions/api/apply.js`
- live route: `finallysettled.com/api/apply`

Impact:
- noisy failures
- hard-to-debug frontend behavior
- possible operational alert fatigue

## 6. Cloudflare Pages config is not repo-owned

Why it matters:
- the site is clearly live on Cloudflare Pages
- no deployment config or Pages settings export was recovered into GitHub

Impact:
- GitHub still cannot fully recreate production
- domain bindings, env vars, and KV bindings remain operator memory / dashboard state

## 7. Notion is being used as a plaintext secret store

Why it matters:
- multiple Finally Settled Notion pages contain real tokens and credentials in plain text

Impact:
- security exposure
- audit ambiguity because secrets are spread across docs, not isolated in a secrets manager

## 8. The canonical social publishing path is still ambiguous

Why it matters:
- live evidence points to at least three different Finally Settled social paths:
  - active `Finally Settled Viral Clip Factory v3`
  - inactive `FS_Reel_AutoDraft`
  - historical Claude-only references to `FS_Content_Select`, `FS_Generate_Static_Image_Post`, `FS_Generate_Reel_Post`, and `ffmpeg-render-service.py`
- GitHub cannot become source-of-truth for social operations until one path is declared canonical and the others are retired or archived

Evidence:
- live n8n currently has active `K63Ut64YfW8Ll6BF` and inactive `5Fjnc5fB1dXH94vV`
- Claude history references unrecovered workflow/script names plus Railway deployment artifacts for a separate render path
- the missing artifact list still includes the claimed v2 content-engine files and the unrecovered render-service files

Impact:
- operators cannot tell which flow is safe to run
- social publishing logic remains split across live n8n, Notion, and unrecovered Claude outputs
- rebuilding from GitHub alone is not possible yet
