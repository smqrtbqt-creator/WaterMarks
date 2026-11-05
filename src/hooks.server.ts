import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Handle } from '@sveltejs/kit';

const redoxIndexFiles = [
	join(process.cwd(), 'static', 'redox', 'index.html'),
	join(process.cwd(), 'build', 'client', 'redox', 'index.html'),
	join(process.cwd(), 'client', 'redox', 'index.html')
];

const alcaliniteIndexFiles = [
	join(process.cwd(), 'static', 'alcalinite', 'index.html'),
	join(process.cwd(), 'build', 'client', 'alcalinite', 'index.html'),
	join(process.cwd(), 'client', 'alcalinite', 'index.html')
];

async function readFirst(files: string[]) {
	for (const file of files) {
		try {
			return await readFile(file);
		} catch {
			/* emplacement suivant */
		}
	}
	return null;
}

/** SPA React sous /redox/ et /alcalinite/ : routes clientes renvoient l’index. */
export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const asset = /\.[a-z0-9]+$/i.test(path);

	if (!asset) {
		if (path === '/redox' || path.startsWith('/redox/')) {
			const html = await readFirst(redoxIndexFiles);
			if (html) {
				return new Response(html, {
					headers: { 'content-type': 'text/html; charset=utf-8' }
				});
			}
		}
		if (path === '/alcalinite' || path.startsWith('/alcalinite/')) {
			const html = await readFirst(alcaliniteIndexFiles);
			if (html) {
				return new Response(html, {
					headers: { 'content-type': 'text/html; charset=utf-8' }
				});
			}
		}
	}

	return resolve(event);
};
