import { redirect } from '@sveltejs/kit';

export const actions = {
	// @ts-ignore
	default: async ({ cookies }) => {
		cookies.delete('club_session', { path: '/' });
		throw redirect(303, '/');
	}
};

export async function load() {
	throw redirect(303, '/');
}