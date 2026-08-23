import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/server/db.js',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'sqlite.db'
  }
});