const SEGMENT = '/alcalinite'

/** Préfixe réel : /alcalinite en local, /waterstation/alcalinite sur le serveur. */
export function publicBasename(): string {
	if (typeof window === 'undefined') return SEGMENT
	const path = window.location.pathname
	const at = path.indexOf(SEGMENT)
	if (at === -1) return SEGMENT
	const next = path.charAt(at + SEGMENT.length)
	if (next && next !== '/') return SEGMENT
	return path.slice(0, at + SEGMENT.length)
}

/** Racine du site, vide en local et /waterstation sur le serveur. */
export function siteRoot(): string {
	return publicBasename().slice(0, -SEGMENT.length)
}
