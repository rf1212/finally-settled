# Finally Settled Request Showing Follow-Up

Updated: 2026-04-23

Purpose:
- align `/request-showing` with the live canonical intake route at `/apply`

What changed:
- kept `/request-showing` as a buyer-facing page, but made it explicitly secondary to `/apply`
- updated the page title from `Request a Showing` to `Showings After Pre-Approval`
- updated the main headline from `Request a Showing` to `Showings Start With Pre-Approval`
- tightened the supporting copy to make the sequencing explicit
- updated the main CTA label from `Start Pre-Approval` to `Apply for Pre-Approval`

Why:
- the canonical intake path is now `/apply`
- showings should not read like a parallel primary intake flow
- buyer-facing entry points should consistently push pre-approval first

Scope:
- this change is limited to the static `/request-showing` page in the repo
- no shared nav component or runtime API logic was changed in this follow-up

Manual verification:
```bash
curl -sL https://finallysettled.com/request-showing | rg -n "Showings Start With Pre-Approval|Showings are coordinated after pre-approval|Apply for Pre-Approval"
```

Expected:
- headline shows `Showings Start With Pre-Approval`
- body copy says showings are coordinated after pre-approval
- main CTA points to `/apply`
