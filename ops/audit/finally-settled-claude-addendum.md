# Finally Settled Claude Addendum

Audit date: 2026-04-22

Status:
- Secondary historical context only
- Live repo, live n8n, live Airtable, and live site checks remain primary truth
- Both provided Claude exports appeared to contain the same conversation set; useful findings were deduplicated

## Confirmed Useful Findings From Claude History

### 1. Listings sync build intent is clearer than the current repo alone

Historical Claude work consistently ties the listings pipeline to:
- workflow name `FinallySettled — Apify Listings Sync`
- workflow id `VqLfiyi9b86A4AVb`
- Airtable base `appLmQyh1ov0NDQ58`
- Airtable table `tblJBrj6XNjap4wQb`
- 34-field mapping from Apify/Zillow into Airtable
- schedule intent `0 5 * * 2,5` / Monday and Thursday at 11:00 PM CST / Tuesday and Friday at 05:00 UTC
- success and failure emails to `info@rawfunds.com`

Claude history also records one abandoned but relevant requirement:
- the user asked for a separate Airtable test table before cutover from the client-facing listings table

That request does not match the live workflow state recovered during the audit, which writes to the live `Listings` table.

### 2. Claude history strengthens the missing social-engine artifact trail

Claude history explicitly claims the following asset set was produced for Finally Settled:
- `finally-settled-content-engine-v2.json`
- `source-images-to-canva.py`
- `finally-settled-bulk-create.csv`
- `finally-settled-content-system.md`

Claude history also says:
- `SocialImagePool` was created as `tblCLKcbcat9jto3c`
- `SocialContentQueue` was created as `tblg93KZ6mhpiyg1u`
- the v2 content engine was intended to run Airtable -> Canva -> Publer
- Canva brand templates were expected to use fields `HOOK`, `SUBHOOK`, `DOWN`, `CTA`, `CITY`, `EXTERIOR`, `KITCHEN`, `BATHROOM`, `BEDROOM`

This matches the live Airtable schema recovered during the audit and increases confidence that the missing artifact set was real, not just aspirational.

### 3. Additional historical social/reel automation names were referenced

Claude history mentions these Finally Settled workflow/script names:
- `FS_Content_Select`
- `FS_Generate_Static_Image_Post`
- `FS_Generate_Reel_Post`
- `FS_Reel_AutoDraft`
- `Finally Settled Viral Clip Factory v3`
- `fs-reel-agent.py`
- `ffmpeg-render-service.py`

Referenced endpoint/route names:
- `/render-image`
- `/render-reel`
- `/files/<filename>`

Referenced deployment/support files:
- `render-service-deploy.tar.gz`
- `RAILWAY_DEPLOY_INSTRUCTIONS.md`
- `railway.json`
- `Procfile`
- `requirements.txt`

These were not recovered into the repo during the live audit and should be treated as candidate historical assets, not confirmed production source.

### 4. OpsCommand / Noir linkage is real but adjacent to this repo

Claude history supports the Notion handoff claim that Finally Settled exists in the adjacent OpsCommand / Noir system with company/noir id:
- `18d5ce46-25af-4934-8558-68bfad07794f`

Historical bug/fix notes say:
- `modules/02-noir-factory/module.js` in the `dashboard-central` codebase was missing `finallysettled` in `COMPANY_TO_NOIR_ID`
- this caused the Finally Settled button in OpsCommand to fail until mapped

This is useful operating context, but it is not evidence of repo-owned Finally Settled app code.

## Deprecated Or Conflicting Items

- Claude history contains conflicting statements about the listings sync design:
  - one step said to fetch the latest Apify run only
  - a later spec said to trigger the Apify actor task and poll for completion
  - the live workflow export remains the authoritative source for current behavior

- Claude history claimed an Apify header-auth credential was wired into `VqLfiyi9b86A4AVb`, but the live n8n export recovered during this audit still shows an inline Apify token pattern rather than a clean credential-backed setup.

- Claude history requested a separate Airtable test table before replacing the client-facing listings pipeline, but the live workflow now targets the production `Listings` table directly.

- Claude history includes extensive render-service / tunnel / Railway attempts for a direct Publer video path, but no deployed public service or recoverable canonical source was found. Those attempts should not replace the live `Finally Settled Viral Clip Factory v3` and `FS_Reel_AutoDraft` findings.

- Several historical threads drift into RawFunds, ProxiTap, and NF2 publishing details. They explain adjacent operator behavior, but they are not authoritative Finally Settled production state.

## Unresolved Questions Still Needing Verification

- Was `finally-settled-content-engine-v2.json` ever imported into n8n, or was it only produced as a Claude output artifact?
- Were `FS_Content_Select`, `FS_Generate_Static_Image_Post`, and `FS_Generate_Reel_Post` ever imported into a live n8n instance?
- Was `ffmpeg-render-service.py` ever deployed to Railway or Render, or was it abandoned in favor of Shotstack and/or Publer-only paths?
- Where were the Claude-generated assets originally written after creation, beyond the Notion references to output folders?
- Were the required Canva brand templates ever created, and if so what are their live template IDs?
- Was the requested Airtable test table for listings sync ever created, or was production cut over directly?

## Missing but Referenced Assets

Still not recovered locally or into this repo:
- `finally-settled-content-engine-v2.json`
- `source-images-to-canva.py`
- `finally-settled-bulk-create.csv`
- `finally-settled-content-system.md`
- `fs-reel-agent.py`
- `ffmpeg-render-service.py`
- `render-service-deploy.tar.gz`
- `RAILWAY_DEPLOY_INSTRUCTIONS.md`
- `reel-rotating-sample.html`
- workflow exports for `FS_Content_Select`
- workflow exports for `FS_Generate_Static_Image_Post`
- workflow exports for `FS_Generate_Reel_Post`

## Ownership Clues From Claude History

- `Claude` historically handled spec writing, Notion updates, Airtable table setup, workflow generation, and the missing social-engine/render artifacts.
- `Codex` remains the right owner for repo sync, Cloudflare/site hardening, API fixes, and turning GitHub into the actual source of truth.
- `ChatGPT` remains the best owner for secret-rotation coordination, Notion cleanup, and operator-facing documentation/governance cleanup.
