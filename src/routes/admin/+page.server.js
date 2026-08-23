import { fail, redirect } from '@sveltejs/kit';
import { db, allowedUsers } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import nodemailer from 'nodemailer';

// @ts-ignore
export async function load({ cookies }) {
	const sessionCookie = cookies.get('club_session');
	if (!sessionCookie) throw redirect(302, '/');

	const user = JSON.parse(sessionCookie);
	if (user.role !== 'admin') throw redirect(302, '/dashboard');

	const users = await db.select().from(allowedUsers);
	return { users, currentUserEmail: user.email };
}

export const actions = {
	// @ts-ignore
	invite: async ({ request, cookies }) => {
		const sessionCookie = cookies.get('club_session');
		if (!sessionCookie) return fail(401, { error: 'Unauthorized' });
		
		const currentUser = JSON.parse(sessionCookie);
		if (currentUser.role !== 'admin') return fail(403, { error: 'Admin access required.' });

		const data = await request.formData();
		const email = data.get('email')?.toString().toLowerCase().trim();

		if (!email) return fail(400, { error: 'Email is required.' });

		try {
			await db.insert(allowedUsers).values({ email, role: 'member' });

			const transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: { user: env.SMTP_EMAIL, pass: env.SMTP_PASSWORD }
			});

			await transporter.sendMail({
				from: env.SMTP_EMAIL,
				to: email,
				subject: 'Club Portal Invitation',
				text: `Hello,\n\nYou have been authorized to join the club website.\n\nLog in here: ${env.BETTER_AUTH_URL || 'https://owyverns-production.up.railway.app'}\nShared Group Password: ${env.GROUP_PASSWORD}\n\nWelcome!`
			});

			return { success: `Successfully invited ${email} as a member` };
		} catch (err) {
			return fail(400, { error: 'Email is already authorized or database error occurred.' });
		}
	},

	// @ts-ignore
	deleteUser: async ({ request, cookies }) => {
		const sessionCookie = cookies.get('club_session');
		if (!sessionCookie) return fail(401, { error: 'Unauthorized' });
		
		const currentUser = JSON.parse(sessionCookie);
		if (currentUser.role !== 'admin') return fail(403, { error: 'Admin access required.' });

		const data = await request.formData();
		const emailToDelete = data.get('email')?.toString().toLowerCase().trim();

		if (!emailToDelete) return fail(400, { error: 'Email is required.' });

		// Prevent admin from deleting themselves
		if (emailToDelete === currentUser.email) {
			return fail(400, { error: 'You cannot delete your own admin account.' });
		}

		try {
			await db.delete(allowedUsers).where(eq(allowedUsers.email, emailToDelete));
			return { success: `Successfully removed ${emailToDelete}` };
		} catch (err) {
			return fail(500, { error: 'Failed to delete user from database.' });
		}
	}
};