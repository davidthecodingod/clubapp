import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Point to your local SQLite database file
const sqlite = new Database('sqlite.db');
const db = drizzle(sqlite);

const allowedUsers = sqliteTable('allowed_users', {
	email: text('email').primaryKey(),
	role: text('role').notNull().default('member')
});

async function seed() {
	const myEmail = 'davidcolgateheller@gmail.com'; // Replace with your email

	try {
		await db.insert(allowedUsers).values({
			email: myEmail,
			role: 'admin'
		}).onConflictDoUpdate({
			target: allowedUsers.email,
			set: { role: 'admin' }
		});
		console.log(`Successfully added ${myEmail} as admin!`);
	} catch (err) {
		console.error('Error seeding user:', err);
	}
	
	sqlite.close();
}

seed();