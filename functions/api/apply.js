/**
 * Finally Settled — Buyer Application API
 * POST /api/apply
 *
 * Writes application to Airtable Applications table
 * and sends notification email via Resend (optional).
 *
 * Required env vars (set in Cloudflare Pages dashboard):
 *   AIRTABLE_API_KEY       — existing key already used for listings
 *   AIRTABLE_APPLY_TABLE   — table ID for Applications (create this in Airtable)
 *   RESEND_API_KEY         — optional, for email notifications
 *   NOTIFY_EMAIL           — optional, defaults to info@rawfunds.com
 */

const AIRTABLE_BASE = 'appLmQyh1ov0NDQ58';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function sanitize(val) {
  if (typeof val !== 'string') return String(val || '');
  return val.trim().slice(0, 1000);
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    // ── Build Airtable fields ──────────────────────────────────
    const fields = {
      'First Name':         sanitize(body.firstName),
      'Last Name':          sanitize(body.lastName),
      'Email':              sanitize(body.email),
      'Phone':              sanitize(body.phone),
      'Housing Status':     sanitize(body.housingStatus),
      'Occupants':          sanitize(body.occupants),
      'Employment Status':  sanitize(body.employmentStatus),
      'Employer':           sanitize(body.employer),
      'Job Title':          sanitize(body.jobTitle),
      'Years Employed':     sanitize(body.yearsEmployed),
      'Monthly Income':     body.monthlyIncome ? Number(body.monthlyIncome) : null,
      'Has Co-Applicant':   sanitize(body.hasCoApplicant),
      'Co-Applicant Name':  body.hasCoApplicant === 'Yes'
                              ? `${sanitize(body.coFirstName)} ${sanitize(body.coLastName)}`.trim()
                              : '',
      'Co-Applicant Income': body.coIncome ? Number(body.coIncome) : null,
      'Co-Applicant Employer': sanitize(body.coEmployer),
      'Preferred State':    sanitize(body.preferredState),
      'Preferred City':     sanitize(body.preferredCity),
      'Max Price Range':    sanitize(body.maxPrice),
      'Down Payment Range': sanitize(body.downPayment),
      'Move-In Timeline':   sanitize(body.moveTimeline),
      'Min Bedrooms':       sanitize(body.minBeds),
      'Min Bathrooms':      sanitize(body.minBaths),
      'Specific Home':      sanitize(body.specificHome),
      'Additional Notes':   sanitize(body.additionalNotes),
      'Status':             'New',
      'Source':             sanitize(body.source || 'finallysettled.com/apply'),
      'Submitted At':       body.submittedAt || new Date().toISOString(),
    };

    // Remove null/empty fields to keep Airtable clean
    Object.keys(fields).forEach(k => {
      if (fields[k] === null || fields[k] === '') delete fields[k];
    });

    // ── Write to Airtable ──────────────────────────────────────
    const tableId = env.AIRTABLE_APPLY_TABLE || 'Applications';
    const atRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(tableId)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    if (!atRes.ok) {
      const err = await atRes.text();
      console.error('Airtable error:', err);
      return json({ error: 'submission_failed' }, 500);
    }

    // ── Send notification email (optional, requires Resend) ────
    if (env.RESEND_API_KEY) {
      const notifyTo = env.NOTIFY_EMAIL || 'info@rawfunds.com';
      const name = `${fields['First Name']} ${fields['Last Name']}`;
      const emailBody = `
New Finally Settled Application

Name:           ${name}
Email:          ${fields['Email']}
Phone:          ${fields['Phone']}
Employment:     ${fields['Employment Status']} — ${fields['Employer'] || ''}
Monthly Income: ${fields['Monthly Income'] ? '$' + Number(fields['Monthly Income']).toLocaleString() : '—'}
State:          ${fields['Preferred State']}
Max Price:      ${fields['Max Price Range'] || '—'}
Down Payment:   ${fields['Down Payment Range'] || '—'}
Timeline:       ${fields['Move-In Timeline'] || '—'}
Specific Home:  ${fields['Specific Home'] || 'None specified'}
Notes:          ${fields['Additional Notes'] || 'None'}

Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST
      `.trim();

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Finally Settled <noreply@finallysettled.com>',
          to: [notifyTo],
          subject: `New Application: ${name} — ${fields['Preferred State']} — ${fields['Move-In Timeline'] || 'TBD'}`,
          text: emailBody,
        }),
      }).catch(e => console.error('Email send failed (non-fatal):', e.message));
    }

    return json({ success: true });

  } catch (err) {
    console.error('Apply handler error:', err.message);
    return json({ error: 'internal_error' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
