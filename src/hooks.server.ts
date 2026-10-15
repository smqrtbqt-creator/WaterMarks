import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Handle } from '@sveltejs/kit';

const indexFiles = [
	join(process.cwd(), 'static', 'redox', 'index.html'),
	join(process.cwd(), 'build', 'client', 'redox', 'index.html'),
	join(process.cwd(), 'client', 'redox', 'index.html')
];

async function redoxPage() {
	for (const file of indexFiles) {
		try {
			return await readFile(file);
		} catch {
			/* emplacement suivant */
		}
	}
	return null;
}

/** /redox/quiz n’a pas de fichier : on renvoie la page du jeu. Les fichiers réels restent servis tels quels. */
export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const inGame = path === '/redox' || path.startsWith('/redox/');
	const asset = /\.[a-z0-9]+$/i.test(path);
	if (inGame && !asset) {
		const html = await redoxPage();
		if (html) {
			return new Response(html, {
				headers: { 'content-type': 'text/html; charset=utf-8' }
			});
		}
	}
	return resolve(event);
};
