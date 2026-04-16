/**
 * Finally Settled — Buyer Application API
 * POST /api/apply
 *
 * 1. Writes application to Airtable Applications table (tblTgMoIGtR0y6m7O)
 * 2. Creates or finds Contact record (tbl7tvIG4aI4shoXy) and links it
 * 3. Creates Lead record (tblLjlwiIec04i2B6) and links it
 * 4. Adds subscriber to MailerLite "Finally Settled Buyers" group
 * 5. Sends notification email via MailerLite transactional
 *
 * Required env vars (set in Cloudflare Pages dashboard):
 *   AIRTABLE_API_KEY     — existing key
 *   MAILERLITE_API_KEY   — MailerLite API key
 *   MAILERLITE_GROUP_ID  — Finally Settled Buyers group ID
 *   NOTIFY_EMAIL         — defaults to info@rawfunds.com
 */

const AIRTABLE_BASE      = 'appLmQyh1ov0NDQ58';
const APPLICATIONS_TABLE = 'tblTgMoIGtR0y6m7O';
const CONTACTS_TABLE     = 'tbl7tvIG4aI4shoXy';
const LEADS_TABLE        = 'tblLjlwiIec04i2B6';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

const clean = (val, max = 500) =>
  typeof val === 'string' ? val.trim().slice(0, max) : String(val ?? '');

function getInstantDecision(body) {
  const down = parseFloat(body.downPayment) || 0;
  if (body.activeBankruptcy === 'Yes') return 'DECLINED — Active bankruptcy or foreclosure';
  if (body.activeLawsuit === 'Yes')    return 'DECLINED — Active or recent lawsuit';
  if (down < 15000)                    return 'DECLINED — Down payment under $15,000';
  return null;
}

async function atGet(env, table, filterFormula) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${table}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}` } });
  const d = await r.json();
  return d.records?.[0] || null;
}

async function atCreate(env, table, fields) {
  const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${table}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`Airtable create failed: ${JSON.stringify(d)}`);
  return d;
}

async function atUpdate(env, table, recordId, fields) {
  const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${table}/${recordId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  return r.json();
}

async function mlAddSubscriber(env, email, firstName, lastName, extraFields = {}) {
  if (!env.MAILERLITE_API_KEY) return null;
  const body = {
    email,
    fields: { name: `${firstName} ${lastName}`.trim(), ...extraFields },
    groups: env.MAILERLITE_GROUP_ID ? [env.MAILERLITE_GROUP_ID] : [],
    status: 'active',
  };
  const r = await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.MAILERLITE_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    const firstName   = clean(body.firstName);
    const lastName    = clean(body.lastName);
    const email       = clean(body.email).toLowerCase();
    const phone       = clean(body.phone);
    const downAmt     = parseFloat(body.downPayment) || 0;
    const income      = parseFloat(body.monthlyIncome) || null;
    const submittedAt = new Date().toISOString();

    const declineReason = getInstantDecision(body);

    // ── Find or create Contact ──────────────────────────────────
    let contactId = null;
    try {
      const existing = await atGet(env, CONTACTS_TABLE, `{Email} = "${email}"`);
      if (existing) {
        contactId = existing.id;
      } else {
        const c = await atCreate(env, CONTACTS_TABLE, {
          'Name':                   `${firstName} ${lastName}`.trim(),
          'Email':                  email,
          'Phone':                  phone,
          'Income Range':           income ? `$${Math.round(income).toLocaleString()}/mo` : '',
          'Down Payment Available': downAmt ? `$${Math.round(downAmt).toLocaleString()}` : '',
          'Locations':              `${clean(body.preferredCity)}, ${clean(body.preferredState)}`,
          'Price Range':            clean(body.maxPrice),
          'Timeline':               clean(body.moveTimeline),
        });
        contactId = c.id;
      }
    } catch (e) {
      console.error('Contact error (non-fatal):', e.message);
    }

    // ── Create Application ──────────────────────────────────────
    const appFields = {
      'First Name':                        firstName,
      'Last Name':                         lastName,
      'Email':                             email,
      'Phone':                             phone,
      'Status':                            declineReason ? 'Declined' : 'New',
      'Housing Status':                    clean(body.housingStatus),
      'Occupants':                         clean(body.occupants),
      'Employment Status':                 clean(body.employmentStatus),
      'Employer':                          clean(body.employer),
      'Job Title':                         clean(body.jobTitle),
      'Years Employed':                    clean(body.yearsEmployed),
      'Monthly Income':                    income,
      'Has Co-Applicant':                  clean(body.hasCoApplicant),
      'Co-Applicant Name':                 body.hasCoApplicant === 'Yes'
                                             ? `${clean(body.coFirstName)} ${clean(body.coLastName)}`.trim() : '',
      'Co-Applicant Income':               body.coIncome ? parseFloat(body.coIncome) : null,
      'Co-Applicant Employer':             clean(body.coEmployer),
      'Preferred State':                   clean(body.preferredState),
      'Preferred City':                    clean(body.preferredCity),
      'Max Price Range':                   clean(body.maxPrice),
      'Down Payment Amount':               downAmt ? String(downAmt) : '',
      'Move-In Timeline':                  clean(body.moveTimeline),
      'Min Bedrooms':                      clean(body.minBeds),
      'Min Bathrooms':                     clean(body.minBaths),
      'Specific Home':                     clean(body.specificHome),
      'Additional Notes':                  clean(body.additionalNotes, 2000),
      'Active Bankruptcy or Foreclosure':  clean(body.activeBankruptcy || 'No'),
      'Active or Recent Lawsuits':         clean(body.activeLawsuit || 'No'),
      'Source':                            clean(body.source || 'finallysettled.com/qualify'),
      'Submitted At':                      submittedAt,
      ...(declineReason ? { 'Deal Decision': declineReason } : {}),
      ...(contactId     ? { 'Contact': [contactId] } : {}),
    };
    Object.keys(appFields).forEach(k => {
      if (appFields[k] === null || appFields[k] === '') delete appFields[k];
    });

    const appRecord = await atCreate(env, APPLICATIONS_TABLE, appFields);
    const appId = appRecord.id;

    // ── Create Lead ─────────────────────────────────────────────
    try {
      const leadFields = {
        'Name':             `${firstName} ${lastName}`.trim(),
        'Email':            email,
        'Phone':            phone,
        'Source':           clean(body.source || 'finallysettled.com/qualify'),
        'Status':           declineReason ? 'Declined' : 'New',
        'Property Interest': clean(body.specificHome || `${clean(body.preferredCity)}, ${clean(body.preferredState)}`),
        'Notes':            declineReason || `Down: $${Math.round(downAmt).toLocaleString()} | Income: ${income ? '$' + Math.round(income).toLocaleString() + '/mo' : 'not provided'}`,
        'Last Contact Date': submittedAt.split('T')[0],
        ...(contactId ? { 'Contact': [contactId] } : {}),
        ...(appId     ? { 'Application': [appId] } : {}),
      };
      Object.keys(leadFields).forEach(k => {
        if (leadFields[k] === null || leadFields[k] === '') delete leadFields[k];
      });
      await atCreate(env, LEADS_TABLE, leadFields);
    } catch (e) {
      console.error('Lead create failed (non-fatal):', e.message);
    }

    // ── Back-link Contact → Application ─────────────────────────
    if (contactId && appId) {
      atUpdate(env, CONTACTS_TABLE, contactId, { 'Applications': [appId] })
        .catch(e => console.error('Contact backlink failed (non-fatal):', e.message));
    }

    // ── MailerLite — add subscriber (approved only) ─────────────
    if (!declineReason) {
      mlAddSubscriber(env, email, firstName, lastName, {
        state:         clean(body.preferredState),
        down_payment:  String(downAmt),
        move_timeline: clean(body.moveTimeline),
      }).catch(e => console.error('MailerLite add failed (non-fatal):', e.message));
    }

    // ── Notification email ───────────────────────────────────────
    if (env.MAILERLITE_API_KEY) {
      const notifyTo = env.NOTIFY_EMAIL || 'info@rawfunds.com';
      const name = `${firstName} ${lastName}`.trim();
      fetch('https://connect.mailerlite.com/api/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.MAILERLITE_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          from: { email: 'hello@finallysettled.com', name: 'Finally Settled' },
          to: [{ email: notifyTo }],
          subject: `${declineReason ? '⛔ DECLINED' : '✅ NEW APP'}: ${name} — ${clean(body.preferredState)} — $${Math.round(downAmt).toLocaleString()} down`,
          text: `Finally Settled — Application\n${declineReason ? '⛔ AUTO-DECLINED: ' + declineReason : '✅ NEW — Review Required'}\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nIncome: ${income ? '$' + Math.round(income).toLocaleString() + '/mo' : '—'}\nDown Payment: $${Math.round(downAmt).toLocaleString()}\nLocation: ${clean(body.preferredCity)}, ${clean(body.preferredState)}\nMax Price: ${clean(body.maxPrice) || '—'}\nTimeline: ${clean(body.moveTimeline) || '—'}\nSpecific Home: ${clean(body.specificHome) || 'None'}\nBankruptcy/FC: ${clean(body.activeBankruptcy || 'No')}\nLawsuit: ${clean(body.activeLawsuit || 'No')}\n\nAirtable: https://airtable.com/${AIRTABLE_BASE}/${APPLICATIONS_TABLE}/${appId}\nSubmitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST`,
        }),
      }).catch(e => console.error('Notification email failed (non-fatal):', e.message));
    }

    return json({ success: true, declined: !!declineReason, reason: declineReason || null });

  } catch (err) {
    console.error('Apply handler error:', err.message);
    return json({ error: 'internal_error' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
