import { fail, redirect } from '@sveltejs/kit';
import { db, papers } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';

// @ts-ignore
export async function load({ cookies }) {
	const sessionCookie = cookies.get('club_session');
	if (!sessionCookie) throw redirect(302, '/');

	const user = JSON.parse(sessionCookie);
	const allPapers = await db.select().from(papers);

	return { user, papers: allPapers };
}

export const actions = {
	// @ts-ignore
	upload: async ({ request, cookies }) => {
		const sessionCookie = cookies.get('club_session');
		if (!sessionCookie) return fail(401, { error: 'Unauthorized' });
		const user = JSON.parse(sessionCookie);

		const formData = await request.formData();
		const title = formData.get('title')?.toString().trim();
		const file = formData.get('file');

		if (!title || !(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Title and file are required.' });
		}

		try {
			const uploadsDir = path.resolve('static/uploads');
			if (!fs.existsSync(uploadsDir)) {
				fs.mkdirSync(uploadsDir, { recursive: true });
			}

			const fileName = `${Date.now()}-${file.name.replaceAll(' ', '_')}`;
			const filePath = path.join(uploadsDir, fileName);
			const buffer = Buffer.from(await file.arrayBuffer());
			fs.writeFileSync(filePath, buffer);

			let extractedText = title + ' ' + file.name;
			const lowerName = file.name.toLowerCase();

			// Parse Word documents (.docx) via Mammoth
			if (
				file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
				lowerName.endsWith('.docx')
			) {
				const result = await mammoth.extractRawText({ buffer });
				extractedText = result.value;
			} 
			// Parse text files
			else if (file.type === 'text/plain' || lowerName.endsWith('.txt')) {
				extractedText = buffer.toString('utf-8');
			}
			// Parse PDFs for automatic content search
			else if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
				const pdfModule = await import('pdf-parse');
				const parser = new pdfModule.PDFParse({ data: buffer });
				const pdfData = await parser.getText();
				extractedText = pdfData?.text || '';
				await parser.destroy();
			}
			// For other files, we fallback cleanly to title/filename index
			// (or you can paste abstracts in the title/metadata field for instant AI keyword matching)

			await db.insert(papers).values({
				title,
				fileName: `/uploads/${fileName}`,
				content: extractedText,
				posterEmail: user.email
			});

			return { success: 'Document uploaded and indexed successfully!' };
		} catch (err) {
			console.error("Document Processing error:", err);
			return fail(500, { error: 'Failed to process document file.' });
		}
	},

	// @ts-ignore
	delete: async ({ request, cookies }) => {
		const sessionCookie = cookies.get('club_session');
		if (!sessionCookie) return fail(401, { error: 'Unauthorized' });
		const user = JSON.parse(sessionCookie);

		const formData = await request.formData();
		const id = parseInt(formData.get('id')?.toString() || '0');

		if (!id) return fail(400, { error: 'Invalid paper ID.' });

		try {
			const target = await db.select().from(papers).where(eq(papers.id, id));
			if (target.length === 0) {
				return fail(404, { error: 'Paper not found.' });
			}

			if (target[0].posterEmail !== user.email) {
				return fail(403, { error: 'Only the paper poster can delete this paper.' });
			}

			const filePath = path.resolve(`static${target[0].fileName}`);
			if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
			await db.delete(papers).where(eq(papers.id, id));
			return { success: 'Paper deleted successfully.' };
		} catch (err) {
			return fail(500, { error: 'Failed to delete paper.' });
		}
	}
};