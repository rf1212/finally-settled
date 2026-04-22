# Finally Settled Next Actions

## Ranked Blockers

### 1. Admin proxy default password is active in production
- blocker: predictable admin access to a live public endpoint
- why it blocks launch: a public admin surface with a known fallback password is an immediate security risk and makes the stack unsafe to treat as production-ready
- exact file/system where it lives: `functions/api/admin/airtable.js` and `https://finallysettled.com/api/admin/airtable`
- fix required: remove the default fallback entirely, require `ADMIN_PASSWORD`, rotate the live password, and restrict the route by origin/IP or remove it from public exposure
- owner: Codex

### 2. n8n workflows rely on inline secrets
- blocker: live automations cannot be safely versioned, reviewed, or re-imported
- why it blocks launch: GitHub cannot become source-of-truth while critical workflows depend on hardcoded API tokens and keys embedded directly in workflow JSON
- exact file/system where it lives: live n8n workflows `VqLfiyi9b86A4AVb`, `K63Ut64YfW8Ll6BF`, `5Fjnc5fB1dXH94vV`
- fix required: move every secret to named n8n credentials or environment variables, rotate exposed values, then re-export clean workflow JSON into `automation/n8n/`
- owner: Claude

### 3. Social content engine is not fully recoverable
- blocker: missing source artifacts and active/live drift
- why it blocks launch: the content engine cannot be rebuilt from GitHub alone because key source files are missing and the active workflow points at a different Airtable base than the documented Finally Settled social tables
- exact file/system where it lives: Notion page `Finally Settled — Social Content Engine`, live n8n workflow `K63Ut64YfW8Ll6BF`, missing files `finally-settled-content-engine-v2.json` and `source-images-to-canva.py`
- fix required: recover the missing artifacts from the original output location or rebuild them, align the live workflow to `appLmQyh1ov0NDQ58` tables `tblCLKcbcat9jto3c` and `tblg93KZ6mhpiyg1u`, then commit the canonical versions
- owner: Claude

### 4. `qualify.html` is live drift and not an actual qualification form
- blocker: qualification funnel does not match the documented operating model
- why it blocks launch: Notion says the buyer form is live, but the recovered file is just a static page variant with no form logic, so the public funnel and internal expectations are out of sync
- exact file/system where it lives: `https://finallysettled.com/qualify.html`, recovered file `qualify.html`, Notion page `🏠 Finally Settled — Full Strategy & Build Log (April 15, 2026)`
- fix required: decide whether `/qualify.html` should be deprecated or replaced with a real form tied to `/api/apply`, then commit the canonical page and remove the misleading live variant
- owner: Codex

### 5. `/api/apply` does not fail safely
- blocker: public form backend returns generic server errors for malformed requests
- why it blocks launch: a brittle intake endpoint creates silent drop-off risk and makes frontend troubleshooting harder during launch
- exact file/system where it lives: `functions/api/apply.js` and `https://finallysettled.com/api/apply`
- fix required: add request-shape validation, explicit 400 responses for bad payloads, and structured logging around Airtable/MailerLite failures
- owner: Codex

### 6. Cloudflare Pages state is not in GitHub
- blocker: deployment cannot be recreated from source alone
- why it blocks launch: env vars, KV binding `FS_CACHE`, custom domains, and Pages project config still live in dashboard state instead of source control
- exact file/system where it lives: Cloudflare Pages project for `finally-settled`
- fix required: export and document Pages settings, bindings, domains, and required env vars; add repo-owned config documentation and templates
- owner: Codex

### 7. Notion contains plaintext secrets
- blocker: secret sprawl across documentation
- why it blocks launch: operators will keep using compromised values until secrets are rotated and docs are cleaned, undermining the whole source-of-truth effort
- exact file/system where it lives: multiple Notion pages including the Homes build spec and Cloudflare Pages build spec
- fix required: rotate exposed credentials, scrub Notion pages, and replace live secret values with references to a proper secret manager or environment-variable names only
- owner: ChatGPT

## Fastest Stabilization Path

1. Kill the admin fallback password and rotate any exposed credentials.
2. Decide the canonical buyer-intake entrypoint: `/apply`, `/qualify.html`, or both.
3. Rebuild the n8n exports around credential objects and one Airtable base strategy.
4. Recover or rebuild the missing social-engine source files.
5. Document Cloudflare Pages settings so the repo can actually recreate production.
