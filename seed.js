import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Resolve the database the SAME way src/lib/server/db.js does. These used to
// disagree -- this script wrote to sqlite.db while the app read local.db -- so
// seeding appeared to succeed and the new admin could never log in.
const dbUrl = process.env.DB_URL || 'file:./local.db';
const dbPath = dbUrl.replace('file:', '');

// Pass an address as an argument or ADMIN_EMAIL to seed someone else:
//   node seed.js someone@example.com
const adminEmail = (process.argv[2] || process.env.ADMIN_EMAIL || 'davidcolgateheller@gmail.com')
	.toLowerCase()
	.trim();

const sqlite = new Database(dbPath);

const allowedUsers = sqliteTable('allowed_users', {
	email: text('email').primaryKey(),
	role: text('role').notNull().default('member')
});

// A freshly mounted volume has no tables yet, and this script may well be the
// first thing to touch it, so make sure the table exists before inserting.
sqlite.exec(`
	CREATE TABLE IF NOT EXISTS allowed_users (
		email TEXT PRIMARY KEY,
		role TEXT NOT NULL DEFAULT 'member'
	);
`);

const db = drizzle(sqlite);

async function seed() {
	try {
		await db
			.insert(allowedUsers)
			.values({ email: adminEmail, role: 'admin' })
			.onConflictDoUpdate({ target: allowedUsers.email, set: { role: 'admin' } });

		console.log(`Successfully added ${adminEmail} as admin in ${dbPath}`);
		console.log('Allowed users:', await db.select().from(allowedUsers));
	} catch (err) {
		console.error('Error seeding user:', err);
		process.exitCode = 1;
	}

	sqlite.close();
}

seed();
