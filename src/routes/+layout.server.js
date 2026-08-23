// @ts-ignore
export async function load({ cookies }) {
	const sessionCookie = cookies.get('club_session');
	if (!sessionCookie) return { user: null };

	try {
		const user = JSON.parse(sessionCookie);
		return { user };
	} catch (err) {
		return { user: null };
	}
}