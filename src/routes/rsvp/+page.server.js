import { fail, redirect } from '@sveltejs/kit';
import { db, meetings, rsvps } from '$lib/server/db';
import { eq } from 'drizzle-orm';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function load(event) {
	const { cookies } = event;
	const sessionCookie = cookies.get('club_session');
	if (!sessionCookie) throw redirect(302, '/');

	const user = JSON.parse(sessionCookie);

	const allMeetings = await db.select().from(meetings);
	const userRsvps = await db.select().from(rsvps).where(eq(rsvps.email, user.email));
	
	/** @type {{[key:number]: string}} */
	const rsvpMap = {};
	for (const r of userRsvps) {
		rsvpMap[r.meetingId] = r.status;
	}

	/** @type {any[]} */
	let allRsvps = [];
	if (user.role === 'admin') {
		allRsvps = await db.select().from(rsvps);
	}

	return { user, meetings: allMeetings, rsvpMap, allRsvps };
}

/** @type {import('@sveltejs/kit').Actions} */
export const actions = {
	rsvp: async (event) => {
		const { request, cookies } = event;
		const sessionCookie = cookies.get('club_session');
		if (!sessionCookie) return fail(401, { error: 'Unauthorized' });
		const user = JSON.parse(sessionCookie);

		const data = await request.formData();
		const meetingId = parseInt(data.get('meetingId')?.toString() || '0');
		const status = data.get('status')?.toString();

		if (!meetingId || (status !== 'yes' && status !== 'no')) {
			return fail(400, { error: 'Invalid RSVP selection.' });
		}

		/** @type {string} */
		const statusStr = status;

		const existing = await db.select().from(rsvps).where(eq(rsvps.meetingId, meetingId));
		const userExisting = existing.find((r) => r.email === user.email);

		if (userExisting) {
			await db.update(rsvps).set({ status: statusStr }).where(eq(rsvps.id, userExisting.id));
		} else {
			await db.insert(rsvps).values({ meetingId, email: user.email, status: statusStr });
		}

		return { success: 'RSVP updated successfully!' };
	},

	createMeeting: async (event) => {
		const { request, cookies } = event;
		const sessionCookie = cookies.get('club_session');
		if (!sessionCookie) return fail(401, { error: 'Unauthorized' });
		const user = JSON.parse(sessionCookie);

		if (user.role !== 'admin') return fail(403, { error: 'Admin access required.' });

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const date = data.get('date')?.toString();
		const address = data.get('address')?.toString().trim();
		const pictureUrl = data.get('pictureUrl')?.toString().trim() || null;

		if (!name || !date || !address) {
			return fail(400, { error: 'Meeting name, date, and address are required.' });
		}

		try {
			await db.insert(meetings).values({ name, date, address, pictureUrl });
			return { meetingSuccess: 'New meeting published successfully!' };
		} catch (err) {
			return fail(500, { error: 'Failed to create meeting in database.' });
		}
	},

	deleteMeeting: async (event) => {
		const { request, cookies } = event;
		const sessionCookie = cookies.get('club_session');
		if (!sessionCookie) return fail(401, { error: 'Unauthorized' });
		const user = JSON.parse(sessionCookie);

		if (user.role !== 'admin') return fail(403, { error: 'Admin access required.' });

		const data = await request.formData();
		const meetingId = parseInt(data.get('meetingId')?.toString() || '0');

		if (!meetingId) return fail(400, { error: 'Invalid meeting ID.' });

		try {
			// Delete related RSVPs first to maintain data integrity, then delete meeting
			await db.delete(rsvps).where(eq(rsvps.meetingId, meetingId));
			await db.delete(meetings).where(eq(meetings.id, meetingId));
			return { meetingSuccess: 'Meeting deleted successfully.' };
		} catch (err) {
			return fail(500, { error: 'Failed to delete meeting.' });
		}
	}
};