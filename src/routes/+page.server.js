import { fail, redirect } from '@sveltejs/kit';
import { db, allowedUsers } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { sendEmail } from '$lib/server/email';

export const actions = {
	// @ts-ignore
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().toLowerCase().trim();
		const password = data.get('password')?.toString();

		if (!email) {
			return fail(400, { loginError: 'Email is required.' });
		}

		if (password !== env.GROUP_PASSWORD) {
			return fail(401, { loginError: 'Incorrect group password.' });
		}

		const user = db.select().from(allowedUsers).where(eq(allowedUsers.email, email)).get();

		if (!user) {
			return fail(403, { loginError: 'This email is not registered with the club.' });
		}

		cookies.set('club_session', JSON.stringify({ email: user.email, role: user.role }), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 30,
			secure: process.env.NODE_ENV === 'production'
		});

		throw redirect(303, '/dashboard');
	},

	// @ts-ignore
	forgot: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().toLowerCase().trim();

		if (!email) {
			return { forgotSuccess: 'If that email is registered, the password has been sent.' };
		}

		const user = await db.select().from(allowedUsers).where(eq(allowedUsers.email, email)).get();
        
		if (user) {
			try {
				await sendEmail({
					to: email,
					subject: 'Club Website Password Reminder',
					text: `Hello,\n\nThe shared group password for the wyvern club website is: ${env.GROUP_PASSWORD}\n\nSee you inside!`
				});
			} catch (err) {
				// Deliberately not surfaced to the visitor: the response must stay
				// identical whether or not the address is registered, so the form
				// cannot be used to enumerate club members. Check the Railway
				// deploy logs if a reminder does not arrive.
				console.error('[forgot] failed to send password reminder:', err);
			}
		}

		return { forgotSuccess: 'If that email is registered, the password has been sent.' };
	}
};