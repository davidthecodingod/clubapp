import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import fs from 'fs';
import path from 'path';

const dbUrl = process.env.DB_URL || 'file:./local.db';
const dbPath = dbUrl.replace('file:', '');

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

export const allowedUsers = sqliteTable('allowed_users', {
    email: text('email').primaryKey(),
    role: text('role').notNull().default('member')
});

export const meetings = sqliteTable('meetings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    date: text('date').notNull(),
    address: text('address').notNull(),
    pictureUrl: text('picture_url')
});

export const rsvps = sqliteTable('rsvps', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    meetingId: integer('meeting_id').notNull(),
    email: text('email').notNull(),
    status: text('status').notNull() // 'yes' or 'no'
});

export const papers = sqliteTable('papers', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    fileName: text('file_name').notNull(),
    content: text('content').notNull(), // Extracted text for AI search
    posterEmail: text('poster_email').notNull()
});

const sqlite = new Database(dbPath);

// Automatically create tables if they do not exist yet
function initializeDatabase() {
    try {
        sqlite.exec(`
            CREATE TABLE IF NOT EXISTS allowed_users (
                email TEXT PRIMARY KEY,
                role TEXT NOT NULL DEFAULT 'member'
            );

            CREATE TABLE IF NOT EXISTS meetings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                date TEXT NOT NULL,
                address TEXT NOT NULL,
                picture_url TEXT
            );

            CREATE TABLE IF NOT EXISTS rsvps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meeting_id INTEGER NOT NULL,
                email TEXT NOT NULL,
                status TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS papers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                file_name TEXT NOT NULL,
                content TEXT NOT NULL,
                poster_email TEXT NOT NULL DEFAULT ''
            );
        `);
    } catch (error) {
        console.error('Error initializing database tables:', error);
    }
}

initializeDatabase();

export const db = drizzle(sqlite, { schema: { allowedUsers, meetings, rsvps, papers } });
