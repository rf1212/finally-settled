# 🏡 Finally Settled — Homes Listings Site Build Spec (Claude Cowork)

## Build Status

| Phase | Status |
|-------|--------|
| Phase 1 — CF Pages Functions (API + Image Proxy) | ⬜ Not started |
| Phase 2 — DNS (homes.finallysettled.com) | ⬜ Not started |
| Phase 3 — Listings Grid (/homes/) | ⬜ Not started |
| Phase 4 — Detail Page (/homes/listing/) | ⬜ Not started |
| Phase 5 — tawk.to Integration | ⬜ Not started |

---

## What This Is

Build spec for the **Finally Settled homes listings site** at `homes.finallysettled.com`. This is a **subdirectory** (`/homes/`) inside the existing `rf1212/finally-settled` Cloudflare Pages repo. It replaces `homes.rawfunds.com` (Softr) and must be fully functional and verified live before the Softr site is shut down.

The site is a **world-class property listings experience** — think Redfin-quality UI — built for buyers with 20%+ down payments who don't qualify for traditional financing. The core differentiator shown to every visitor is **"Own it for $X/mo"** (PITI monthly payment) with an **interactive down payment slider** that recalculates in real time.

> ⛔ Do NOT launch publicly or update DNS until Chairman confirms.
> ⛔ Do NOT touch any existing files in `rf1212/finally-settled` (index.html, /apply, /request-showing, /agents, /how-it-works, /blog stubs).
> ⛔ No reference to Zillow anywhere — in code, comments, URLs, alt text, or HTML source.

---

## Architecture Overview

```
browser
  └── homes.finallysettled.com/homes/          → CF Pages (static HTML/JS)
  └── homes.finallysettled.com/homes/listing/  → CF Pages (static detail template)
  └── homes.finallysettled.com/api/listings    → CF Pages Function (JSON, proxies Airtable)
  └── homes.finallysettled.com/api/image       → CF Pages Function (image proxy)
```

**Two CF Pages Functions** in the existing repo:
1. `functions/api/listings.js` — fetches Airtable, caches 5 min in CF KV, returns clean JSON
2. `functions/api/image.js` — fetches external property images, strips all identifying headers, serves through CF CDN

Both are deployed automatically by CF Pages as part of the existing `finally-settled` project — no separate Worker deployments needed.

---

## Brand & Design Direction

| Element | Value |
|---------|-------|
| Brand name | Finally Settled |
| Domain | homes.finallysettled.com |
| Repo | rf1212/finally-settled (existing) — add /homes/ subdirectory |
| Design target | World-class. Redfin-quality UI. Not a template site. |
| Color palette | Deep forest green (#1a4731) primary, warm off-white (#fafaf8) background, charcoal (#1c1c1e) text, gold accent (#c9a84c) for CTAs and highlights |
| Typography | Headings: Playfair Display (Google Fonts). Body: DM Sans. Both via Google Fonts CDN. |
| Tone | Warm, direct, aspirational — "You belong in a home." No lender jargon. |
| Target buyer | Has 20%+ down payment saved. Rejected by banks. Self-employed, past evictions OK. |
| Hero message on every card | "Own it for $X/mo" (PITI) — this is the primary conversion hook |
| No pricing | Do NOT display list price anywhere. Monthly payment + down payment only. |

---

## Airtable Data Source

**Base ID:** `appLmQyh1ov0NDQ58`
**Table ID:** `tblJBrj6XNjap4wQb`
**API Key:** stored as CF Pages environment variable `AIRTABLE_API_KEY` — never hardcoded

### Field Mapping (use field IDs — names may change)

| Data point | Field ID | Notes |
|-----------|----------|-------|
| Property ID / slug | `fldNYnIZnQzwIRoDr` | e.g. "901058" → URL: /homes/listing/?id=901058 |
| Full address | `fldJ1MoKriw2aRmGh` | Display only |
| Street | `fldMzHMiPE6No4y7N` | |
| City | `fldFPDUXq9AxAvrdO` | For filters + display |
| State | `fldjc13LDUlqOEUgc` | For filters + display |
| ZIP | `fldGVFasLdVJhGxrM` | |
| Beds | `fldInDKIkBtURyyOA` | For filters + display |
| Baths | `fldNK77Wj6DqfZyxl` | For filters + display |
| Sq ft | `fldk2RjgnBvqwu36S` | Display only |
| Lot acres | `fld9IwAmF73xYbKqO` | Display only |
| Listing status | `fldTs13pt84AlOQYm` | Filter: show only "ForSale" |
| List price (calc ONLY — never display) | `fldjcHm04IUft78CD` | |
| Photo keys | `fldAv5I8yOuWZSiPG` | Comma-separated. First = card thumb. All = gallery. |
| Primary photo URL (fallback) | `fldQx0K4sOMa95oHQ` | Use if photo keys field is empty |
| Monthly interest rate | `fldLb98z8iZunmkAO` | Treat as CONSTANT: 0.016666... (20% APR ÷ 12) |
| Term months | `fld5m9Co9F7grn7Z1` | Treat as CONSTANT: 360 |
| Monthly taxes estimate | `fldDSPULkWVlGRNm1` | Added to P&I for PITI |
| Monthly insurance estimate | `fldci7qEHyWjWFiX2` | Added to P&I for PITI |
| Listing agent/brokerage | `fldlN63KQantdKUpS` | Detail page only |

### Payment Calculation Logic (client-side JavaScript)

The list price is NEVER displayed. All payment calculations happen client-side when the user adjusts the down payment slider.

```javascript
// CONSTANTS
const MONTHLY_RATE = 0.016666666666666666; // 20% APR ÷ 12
const TERM_MONTHS  = 360;                   // 30 years

function calcPITI(listPrice, downPct, monthlyTaxes, monthlyIns) {
  const downAmount = listPrice * (downPct / 100);
  const principal  = listPrice - downAmount;
  const r = MONTHLY_RATE;
  const n = TERM_MONTHS;
  const PI = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const PITI = PI + (monthlyTaxes || 0) + (monthlyIns || 0);
  return {
    monthly: Math.round(PITI),
    downAmount: Math.round(downAmount)
  };
}

// Default slider: 20% (minimum). Max: 100%.
// Display: "Own it for $1,847/mo" and "Down payment: $30,000 (20%)"
```

---

## PHASE 1 — CF Pages Functions (API + Image Proxy)

### File locations in repo

```
functions/
  api/
    listings.js   ← serves GET /api/listings
    image.js      ← serves GET /api/image?key=[photoKey]
```

### 1A — Listings API (`functions/api/listings.js`)

**Method:** GET
**Response:** JSON array of listing objects
**Cache:** CF KV binding `FS_CACHE`, key `listings_v1`, TTL 300 seconds

Airtable request — include these fields only:

```
GET https://api.airtable.com/v0/appLmQyh1ov0NDQ58/tblJBrj6XNjap4wQb
  ?filterByFormula={fldTs13pt84AlOQYm}="ForSale"
  &fields[]=fldNYnIZnQzwIRoDr
  &fields[]=fldJ1MoKriw2aRmGh
  &fields[]=fldMzHMiPE6No4y7N
  &fields[]=fldFPDUXq9AxAvrdO
  &fields[]=fldjc13LDUlqOEUgc
  &fields[]=fldGVFasLdVJhGxrM
  &fields[]=fldInDKIkBtURyyOA
  &fields[]=fldNK77Wj6DqfZyxl
  &fields[]=fldk2RjgnBvqwu36S
  &fields[]=fld9IwAmF73xYbKqO
  &fields[]=fldjcHm04IUft78CD
  &fields[]=fldAv5I8yOuWZSiPG
  &fields[]=fldQx0K4sOMa95oHQ
  &fields[]=fldDSPULkWVlGRNm1
  &fields[]=fldci7qEHyWjWFiX2
  &fields[]=fldlN63KQantdKUpS
  &sort[0][field]=fldInDKIkBtURyyOA&sort[0][direction]=asc
  &pageSize=100
  Authorization: Bearer [env.AIRTABLE_API_KEY]
```

**Output JSON shape per listing:**

```json
{
  "id": "901058",
  "address": "2633 6th St NW, Birmingham, AL 35215",
  "street": "2633 6th St NW",
  "city": "Birmingham",
  "state": "AL",
  "zip": "35215",
  "beds": 3,
  "baths": 2,
  "sqft": 1224,
  "lotAcres": 0.43,
  "listPrice": 150000,
  "photoKeys": ["eaf6c6210c8afe01e623c6c3701e3d4e", "6d61cbcc1ee31c04fda9b77e9f284311"],
  "monthlyTaxes": 47.5,
  "monthlyIns": 129.75,
  "listingAgent": "eXp Realty, LLC Central"
}
```

**Rules:**
- `photoKeys`: split `fldAv5I8yOuWZSiPG` on comma + trim. If empty, extract key from `fldQx0K4sOMa95oHQ` URL via regex: `/fp\/([a-f0-9]+)-/`
- Never include raw photo CDN URLs in JSON — only keys
- Never include the string "zillow" anywhere in any response
- Handle Airtable pagination: if `offset` is returned, fetch next page and merge
- On Airtable error: return `{"error": "listings_unavailable"}` with HTTP 503
- CORS: `Access-Control-Allow-Origin: https://homes.finallysettled.com`

### 1B — Image Proxy (`functions/api/image.js`)

**Method:** GET `?key=[photoKey]`

```javascript
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key || !/^[a-f0-9]{32}$/.test(key)) {
    return placeholder();
  }

  // Source URL reconstructed server-side — never exposed to browser
  const sourceUrl = `https://photos.zillowstatic.com/fp/${key}-p_e.jpg`;

  try {
    const resp = await fetch(sourceUrl, {
      headers: {
        'Referer': 'https://www.google.com/',
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)'
      }
    });

    if (!resp.ok) return placeholder();

    return new Response(resp.body, {
      headers: {
        'Content-Type': resp.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': 'https://homes.finallysettled.com'
        // No upstream headers pass through
      }
    });
  } catch {
    return placeholder();
  }
}

function placeholder() {
  // 1x1 transparent GIF
  const gif = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));
  return new Response(gif, { headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'public, max-age=60' } });
}
```

**Critical:** The browser only ever calls `/api/image?key=abc123`. It never sees or constructs the upstream CDN URL.

### KV Namespace Setup

Create a KV namespace `FS_CACHE` in the Cloudflare account and bind it to the `finally-settled` Pages project as `FS_CACHE`.

```bash
# Via Wrangler or CF dashboard
wrangler kv:namespace create "FS_CACHE"
# Then add binding in Pages project settings: Variable name = FS_CACHE
```

### Phase 1 Verification Checklist

- [ ] `GET https://homes.finallysettled.com/api/listings` returns JSON array with 10+ records
- [ ] JSON response contains no string "zillow" (case-insensitive grep)
- [ ] `photoKeys` array is populated on at least 5 records
- [ ] `GET https://homes.finallysettled.com/api/image?key=eaf6c6210c8afe01e623c6c3701e3d4e` returns a JPEG (Content-Type: image/jpeg)
- [ ] Image response headers contain no reference to upstream CDN domain
- [ ] `GET /api/image?key=invalid` returns placeholder GIF (not 500)
- [ ] KV cache binding confirmed in CF Pages project settings

**Do not proceed to Phase 2 until all boxes are checked.**

---

## PHASE 2 — DNS

Create CNAME record pointing `homes.finallysettled.com` → `finallysettled.com`.

**Via Porkbun API:**

```bash
curl -X POST https://api.porkbun.com/api/json/v3/dns/create/finallysettled.com \
  -H "Content-Type: application/json" \
  -d '{
    "secretapikey": "[REDACTED]",
    "apikey": "[REDACTED]",
    "type": "CNAME",
    "host": "homes",
    "answer": "finallysettled.com",
    "ttl": "600"
  }'
```

Then add `homes.finallysettled.com` as a **custom domain** in the Cloudflare Pages project settings for `finally-settled`.

### Phase 2 Verification Checklist

- [ ] Porkbun API returns success (status 200 / "SUCCESS")
- [ ] `homes.finallysettled.com` added as custom domain in CF Pages project
- [ ] `curl -I https://homes.finallysettled.com` returns HTTP 200 (allow up to 5 min for DNS propagation)

**Do not proceed to Phase 3 until all boxes are checked.**

---

## PHASE 3 — Listings Grid (`/homes/`)

**File:** `homes/index.html`

### Page Structure

```
[STICKY HEADER]
  Logo: "Finally Settled" wordmark → links to finallysettled.com
  Nav: Browse Homes (active) | How It Works (/how-it-works) | Blog (/blog) | Start Pre-Approval → /apply (green button)
  Mobile: hamburger menu

[HERO STRIP — dark green bg, white text]
  H1: "Find Your Home. No Bank Needed."
  Subhead: "Browse owner-financed homes in Alabama, Indiana & Georgia.
            If you have a down payment, you may qualify today."
  Stat pills: [X Homes Available] [20% Min. Down] [Move In ~35 Days]

[FILTER BAR — sticky on scroll, sits below header]
  See Filter Bar spec below

[RESULTS COUNT + SORT]
  "Showing X homes" | Sort dropdown (right-aligned)

[LISTINGS GRID]
  3 columns desktop (≥1024px) | 2 columns tablet (768–1023px) | 1 column mobile (<768px)
  Cards animate in: staggered fade-up, 50ms delay between cards

[FOOTER]
  Logo + social icons (Facebook, Twitter, Instagram)
  "Finally Settled © 2025 | finallysettled.com"
  "Owner financing. No bank needed. No credit score required."
  Equal Housing Opportunity logo/text
```

### Filter Bar — Redfin-Style UI

All filtering and sorting is **client-side only** — no API calls on filter change. The full listings array is fetched once on load and filtered in memory.

```
Pill buttons in a horizontal scrollable bar:

  [City ▾]          Multi-select dropdown. Options built dynamically from listings data.
                    Default: "All Cities"

  [2+ Beds] [3+ Beds] [4+ Beds]    Toggle pills (any = no filter)

  [1+ Ba] [2+ Ba]                   Toggle pills

  [Sq Ft ▾]         Range: 0–3,000 sqft. Slider with min/max handles.
                    Label: "500–1,500 sq ft" or "Any size"

  [More Filters ▾]  Expands panel below bar:
    Down Payment %: Slider 20–100%, step 1%, default 20%
                    THIS is the global slider — changing it recalculates
                    "Own it for $X/mo" on ALL visible cards simultaneously
    Max Monthly Payment: text input "$___/mo — hide homes above this amount"

  [Clear All]       Appears only when any filter is active. Resets everything.

Sort dropdown (right side):
  Monthly Payment ↑ (Low to High)  ← default
  Monthly Payment ↓ (High to Low)
  Most Bedrooms
  Largest (sq ft)
  Newest Listed
```

### Listing Card Spec

```
┌────────────────────────────────┐
│ [PHOTO — 16:9 ratio]      1/8 ›│  ← photo count top-right
│ ‹                              │  ← prev/next on hover
├────────────────────────────────┤
│ Own it for $1,847/mo           │  ← #1a4731 green, 22px bold
│ ↕ Down: $30,000 (20%)         │  ← gray, 14px. Updates with global slider.
├────────────────────────────────┤
│ 3 bd  ·  2 ba  ·  1,224 sqft  │
│ 2633 6th St NW                 │
│ Birmingham, AL 35215           │
├────────────────────────────────┤
│ [Request Showing] [Learn More] │  ← two CTAs
└────────────────────────────────┘
```

**Card behavior:**
- Photo loads via `/api/image?key=[firstKey]`. All img elements use `loading="lazy"`.
- Hover: show ‹ › arrows. Clicking cycles through all `photoKeys` for that listing client-side. Preload adjacent photos on hover.
- Photo count badge: `"1/8"` — updates as user cycles.
- "Own it for" recalculates instantly when global down payment slider changes.
- "Request Showing" → `/request-showing`
- "Learn More" → `/homes/listing/?id=[id]`
- Clicking anywhere on card (except CTAs) → `/homes/listing/?id=[id]`
- Card hover: subtle lift shadow

**Empty state:** Centered message: "No homes match your filters. Try adjusting your search." + [Clear All Filters] button.

**Loading state:** Show 6 skeleton cards (pulsing gray placeholder) while API fetches.

### Phase 3 Verification Checklist

- [ ] `https://homes.finallysettled.com/homes/` returns HTTP 200
- [ ] Listings grid loads — at least 10 cards visible
- [ ] All card photos load (no broken images) — confirm via network tab
- [ ] No "zillow" in page source (view-source) or any network request URL
- [ ] City filter works client-side
- [ ] Beds filter works
- [ ] Down payment slider changes "Own it for $X/mo" on all cards in real time
- [ ] Sort: monthly payment low-to-high is default and correct
- [ ] Photo cycle (click ‹ ›) works — count updates
- [ ] Mobile 375px: 1 column, no horizontal overflow, filter bar scrolls horizontally
- [ ] "Request Showing" → /request-showing ✓
- [ ] "Learn More" → /homes/listing/?id=... ✓
- [ ] Skeleton loading state visible before data loads
- [ ] Zero console errors

**Do not proceed to Phase 4 until all boxes are checked.**

---

## PHASE 4 — Detail Page (`/homes/listing/`)

**File:** `homes/listing/index.html`

**URL:** `/homes/listing/?id=901058`

Optionally add to `_redirects` for clean URLs:
```
/homes/:id  /homes/listing/?id=:id  200
```

Data: fetch `/api/listings` (same cached endpoint), find record where `id === queryParam`. If not found: show "This home is no longer available" + [Browse All Homes] button.

### Page Layout

```
[SHARED HEADER — identical to listings page]

[BREADCRUMB]
  Browse Homes > Birmingham, AL > 2633 6th St NW

[PHOTO GALLERY]
  Hero photo: full-width, 16:9, max-height 500px on desktop
  Thumbnail strip: horizontal scroll, all photos, 80×60px each
  Click thumbnail → swap hero
  All photos via /api/image?key=...
  Counter: "Photo 3 of 8" (top-right of hero)
  Keyboard: ← → arrow keys navigate
  No Zillow watermarks, no external URLs in source

[TWO-COLUMN LAYOUT — desktop only; stacked on mobile]

LEFT (65%):
  H1: Street address
  Subtitle: "3 beds  ·  2 baths  ·  1,224 sq ft  ·  0.43 acres"
  Divider
  "About This Home"
    Property type: House
    Square footage, lot size
    Listed by: [Listing Agent/Brokerage name] (no source URL mention)

RIGHT (35%) — sticky sidebar on scroll:
  ┌──────────────────────────────┐
  │  🏡 Own This Home            │
  │                              │
  │  Own it for                  │
  │  $1,847/mo  ← large green   │
  │  Includes taxes & insurance  │
  │                              │
  │  Down Payment                │
  │  $30,000  —  20%             │
  │  [══════|══════════]         │  ← slider 20–100%
  │  Minimum 20%  ·  Max 100%    │
  │                              │
  │  [  Request a Showing  →  ]  │  ← green button → /request-showing
  │  [  Start Pre-Approval →  ]  │  ← outline button → /apply
  │                              │
  │  ✅ No bank approval needed  │
  │  ✅ Bad credit OK            │
  │  ✅ Move in ~35 days         │
  └──────────────────────────────┘

[SIMILAR HOMES]
  H2: "More Homes You May Like"
  3-card grid using same card component
  Filter: same city as current listing, sorted by closest monthly payment
  If < 3 same-city: fill from all listings by closest payment

[SHARED FOOTER]
```

### Phase 4 Verification Checklist

- [ ] `/homes/listing/?id=901058` loads correctly — correct address displayed
- [ ] All gallery photos load via proxy — no broken images
- [ ] Photo gallery nav (thumbnails + keyboard arrows) works
- [ ] Sidebar down payment slider recalculates monthly + down amount in real time
- [ ] Slider range: 20% min, 100% max
- [ ] "Request a Showing" → /request-showing ✓
- [ ] "Start Pre-Approval" → /apply ✓
- [ ] "Similar Homes" section shows 3 cards
- [ ] Unknown id shows "no longer available" message + CTA
- [ ] No "zillow" in page source or network requests
- [ ] Sticky sidebar works on desktop
- [ ] Mobile: single column, sidebar below gallery, no overflow
- [ ] Breadcrumb "Browse Homes" → /homes/ ✓
- [ ] Zero console errors

**Do not proceed to Phase 5 until all boxes are checked.**

---

## PHASE 5 — tawk.to Integration

### Step 5A — Create tawk.to Property

Log into the tawk.to account and create a **new Property**:
- Property name: `Finally Settled`
- Website URL: `https://finallysettled.com`

Retrieve the embed script. Record the `PROPERTY_ID` and `WIDGET_ID` from the embed src URL:
`https://embed.tawk.to/[PROPERTY_ID]/[WIDGET_ID]`

Document them here once created:
- PROPERTY_ID: `_________________`
- WIDGET_ID: `_________________`

### Step 5B — Install Script

Add the tawk.to async script to **both**:
- `homes/index.html`
- `homes/listing/index.html`

**Placement:** As the last element in `<head>`, after all other scripts.

**Do NOT add** to any other page in the repo (index.html, /apply, /request-showing, etc.).

```html
<!--Start of Tawk.to Script-->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/[PROPERTY_ID]/[WIDGET_ID]';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>
<!--End of Tawk.to Script-->
```

Rules:
- `s1.async=true` — never change to `defer`
- Script loads last in `<head>` — does not block rendering
- Do not inline-block the script

### Step 5C — Connect n8n Chat Router Webhook

In tawk.to dashboard → Property Settings → Webhooks:
- Add the n8n Chat Router webhook URL
- Trigger events: `chat:start`, `chat:end`, `message:send`

The n8n Chat Router workflow `bwI5MNqAGqrHIqcq` at `https://n8n.autogrowthhub.com` is already active and handles multi-company routing. It just needs the tawk.to webhook pointed at it.

> ⚠️ If you cannot access n8n to retrieve the webhook URL, **stop and flag this as a blocker**. Do not skip this step.

### Phase 5 Verification Checklist

- [ ] tawk.to property "Finally Settled" created — PROPERTY_ID and WIDGET_ID documented above
- [ ] Chat widget visible on `homes.finallysettled.com/homes/` (bottom-right corner)
- [ ] Chat widget visible on detail page `/homes/listing/?id=901058`
- [ ] Chat widget does NOT appear on `finallysettled.com` (homepage)
- [ ] n8n webhook URL configured in tawk.to — or blocker explicitly reported

---

## Credentials Reference

| Service | Value |
|---------|-------|
| GitHub Token | `[REDACTED]` |
| GitHub Username | `rf1212` |
| GitHub Repo | `rf1212/finally-settled` (existing — do NOT recreate) |
| Cloudflare Account ID | `adb2110ada5a7f8d9d576c079128c967` |
| Cloudflare Workers/Pages Token | `cwKi2ZwIKZYoJM3sfWZ3sFCB1mnLpqhKDan1AjYd` |
| Airtable API Key | Set as CF Pages env var `AIRTABLE_API_KEY` — retrieve from environment, never hardcode |
| Airtable Base ID | `appLmQyh1ov0NDQ58` |
| Airtable Table ID | `tblJBrj6XNjap4wQb` |
| Porkbun API Key | `[REDACTED]` |
| Porkbun Secret | `[REDACTED]` |
| tawk.to | Create new property — see Phase 5 |
| n8n Chat Router | Workflow `bwI5MNqAGqrHIqcq` at `https://n8n.autogrowthhub.com` |

> ⚠️ The Airtable API key must be set as a CF Pages environment variable named `AIRTABLE_API_KEY`. Check the existing `finally-settled` project environment variables first — it may already be there. If not, the Chairman will provide it.

---

## Ground Rules for Claude Cowork

1. Read this entire spec before writing a single line of code
2. One phase at a time — present verification checklist with YES/NO evidence before proceeding
3. Wait for explicit "proceed" confirmation before starting the next phase
4. Never modify existing files: `index.html`, `/apply`, `/request-showing`, `/agents`, `/how-it-works`, `/blog`
5. Static HTML/CSS/JS only for pages — no React, no Vue, no build step, no npm
6. CF Pages Functions (JS) for the two API endpoints — only server-side code in this project
7. Never hardcode credentials — use CF Pages environment variables
8. **Zero references to "Zillow" anywhere**: no HTML, no JS, no comments, no variable names, no alt text, no console.log, no network request URLs visible to browser
9. Test every URL with curl before reporting phase complete
10. If anything is ambiguous: stop, state the ambiguity clearly, ask before proceeding

---

## Cowork Session Prompt

Copy everything below the line and paste as the first message in Claude Cowork Desktop:

---

You are the CTO executing a precise build spec. Your job is to build the Finally Settled homes listings site at `homes.finallysettled.com` — a world-class property listings experience that replaces an existing Softr site.

Read the full build spec in Notion: find the page titled "🏡 Finally Settled — Homes Listings Site Build Spec (Claude Cowork)" under the CEO Operating Hub.

Also read the existing Finally Settled Cloudflare Pages spec for context on what's already built: "🏠 Finally Settled — Cloudflare Pages Site Build Spec (Claude Cowork)"

OPERATING RULES:
1. Read the full spec before writing any code
2. One phase at a time. Stop after each phase. Present verification checklist with YES/NO and curl/network evidence.
3. Wait for explicit "proceed" before starting the next phase
4. Never touch existing repo files (index.html, stub pages for /apply /request-showing /agents /how-it-works /blog)
5. Static HTML/CSS/JS for pages. CF Pages Functions for /api/ endpoints. No frameworks, no build step, no npm.
6. Never hardcode credentials — use CF Pages environment variables
7. ZERO references to "Zillow" anywhere: no HTML, no JS, no comments, no variable names, no URLs exposed to browser
8. World-class UI — Redfin quality. Playfair Display + DM Sans fonts. Colors: #1a4731 green, #fafaf8 bg, #c9a84c gold accent.
9. If you hit a blocker: stop immediately. Describe exactly what's blocked and what resolves it.

START: Do Phase 1 only (CF Pages Functions for /api/listings and /api/image + KV namespace setup). Stop when complete. Present checklist YES/NO with curl evidence. Write "Ready for Phase 2 on your confirmation." Do not proceed until told to.
