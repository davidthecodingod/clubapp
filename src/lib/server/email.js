import { env } from '$env/dynamic/private';

/**
 * Sends email through Resend's HTTPS API.
 *
 * Railway blocks outbound SMTP (ports 25/465/587) on Free, Trial and Hobby
 * plans, so Gmail/nodemailer works locally but times out once deployed.
 * Resend goes over plain HTTPS on 443, which is never blocked.
 *
 * Required env vars (set these in Railway -> your service -> Variables):
 *   RESEND_API_KEY  e.g. re_xxxxxxxxxxxxxxxx
 *   EMAIL_FROM      e.g. "Wyvern Club <noreply@yourdomain.com>"
 *
 * @param {{ to: string, subject: string, text: string }} message
 * @returns {Promise<{ id: string }>} the Resend message id
 * @throws {Error} if config is missing or Resend rejects the send
 */
export async function sendEmail({ to, subject, text }) {
	const apiKey = env.RESEND_API_KEY;
	const from = env.EMAIL_FROM;

	if (!apiKey) {
		throw new Error('RESEND_API_KEY is not set. Add it in the Railway service variables.');
	}
	if (!from) {
		throw new Error('EMAIL_FROM is not set. Add it in the Railway service variables.');
	}

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ from, to, subject, text })
	});

	// Resend returns a JSON body on both success and failure, but be defensive:
	// a proxy or outage can hand back HTML or an empty body.
	/** @type {any} */
	let body = null;
	try {
		body = await response.json();
	} catch {
		body = null;
	}

	if (!response.ok) {
		const detail = body?.message || body?.error || `HTTP ${response.status}`;
		throw new Error(`Resend rejected the send: ${detail}`);
	}

	const id = body?.id ?? 'unknown';
	// Positive confirmation in the logs. Resend accepting the message is not
	// the same as it landing in the inbox, so check the Resend dashboard for
	// the delivered/bounced outcome if a message does not turn up.
	console.log(`[email] Resend accepted "${subject}" for ${to} (id ${id})`);
	return { id };
}
