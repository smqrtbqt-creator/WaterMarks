/** Récompenses du jeu. Le niveau et les objets ne viennent que des énigmes. */

export type EnigmaId = 'bache' | 'hstat' | 'ruisseau' | 'bascule' | 'riviere';

export type Enigma = {
	id: EnigmaId;
	title: string;
	where: string;
	href: string;
	ask: string;
	itemName: string;
	bonus: number;
};

export type Monster = {
	id: string;
	name: string;
	hp: number;
	atk: number;
	blurb: string;
};

export const ENIGMAS: Enigma[] = [
	{
		id: 'bache',
		title: 'La bâche a soif',
		where: 'Station de pompage',
		href: '/modules/pompage',
		ask: 'Partir du niveau d’alerte, sous 20 %, et le remonter à 70 % avec un débit plus fort que la demande.',
		itemName: 'Clé à molette mouillée',
		bonus: 3
	},
	{
		id: 'hstat',
		title: 'La vraie hauteur statique',
		where: 'Station de pompage',
		href: '/modules/pompage',
		ask: 'Porter la hauteur statique à 35 m et continuer à remplir le réservoir. La puissance monte parce que H comprend cette dénivelée.',
		itemName: 'Échelle de Marceline',
		bonus: 6
	},
	{
		id: 'ruisseau',
		title: 'Le ruisseau qui dépasse',
		where: 'Bassin versant',
		href: '/modules/bassin',
		ask: 'Après un épandage, noter le prélèvement du ruisseau des champs, le seul qui dépasse 50 mg/L dans cette simulation.',
		itemName: 'Épuisette à nitrates',
		bonus: 8
	},
	{
		id: 'bascule',
		title: 'Faire basculer ΔᵣG',
		where: 'Énergie de Gibbs',
		href: '/modules/gibbs',
		ask: 'Sur une même réaction, passer du sens écrit au sens inverse.',
		itemName: 'Balance en mousse',
		bonus: 10
	},
	{
		id: 'riviere',
		title: 'Tenir la Rivière Blanche',
		where: 'Rivière Blanche',
		href: '/',
		ask: 'Tenir les objectifs d’un scénario de la station jusqu’au bout.',
		itemName: 'Badge de la rivière',
		bonus: 12
	}
];

export const MONSTERS: Monster[] = [
	{ id: 'tetard', name: 'Têtard mouillé', hp: 40, atk: 2, blurb: 'Il glisse. Le premier à tomber, si une énigme est déjà résolue.' },
	{ id: 'canard', name: 'Canard de bâche', hp: 160, atk: 9, blurb: 'Il garde le réservoir. Deux énigmes commencent à suffire.' },
	{ id: 'nitrate', name: 'Nitrate gluant', hp: 320, atk: 12, blurb: 'Il dépasse 50 et il colle. Il faut déjà plusieurs énigmes.' },
	{ id: 'turbine', name: 'Turbine possédée', hp: 560, atk: 15, blurb: 'Elle tourne à l’envers. L’avant-dernier mur avant le réservoir.' },
	{
		id: 'kraken',
		name: 'Kraken du réservoir',
		hp: 840,
		atk: 18,
		blurb: 'Le dernier. Sans les cinq énigmes, il dissout Goutte avant la fin.'
	}
];

export const BASE_DAMAGE = 1;
/** Mains nues, aucun module : le coup effleure. */
export const BARE_DAMAGE = 0.2;
export const BASE_HP = 14;
export const HP_PER_LEVEL = 12;
/** Au-dessus de ce trait, le coup part. */
export const HIT_LINE = 62;
/** Deux clics plus serrés que ça comptent pour un seul, pour laisser marteler sans compter deux fois le même appui. */
export const DEBOUNCE_MS = 80;
/** Même en martelant au plus vite, chaque coup suivant paie au moins ce temps-là. */
export const RED_FLOOR_MS = 180;

/** Hauteur ajoutée à la jauge par un clic. */
export function pumpOf(solved: number): number {
	return solved <= 0 ? 12 : 14 + solved * 4;
}

/** Vitesse de retombée de la jauge, par seconde. Moins de modules : elle retombe plus vite. */
export function drainPerSec(solved: number): number {
	return solved <= 0 ? 90 : 64 - solved * 8;
}

/** Sans module, le plafond reste sous le trait : marteler ne suffit pas. */
export function powerCap(solved: number): number {
	return solved <= 0 ? 48 : 100;
}

export function drainGauge(power: number, solved: number, gapMs: number): number {
	return Math.max(0, power - drainPerSec(solved) * (gapMs / 1000));
}

export function pumpGauge(power: number, solved: number): number {
	return Math.min(powerCap(solved), Math.max(0, power) + pumpOf(solved));
}

export type IntroId = 'pompage' | 'bassin' | 'gibbs';

export type Save = {
	solved: EnigmaId[];
	seenIntro: boolean;
	seen: IntroId[];
};

const KNOWN = new Set(ENIGMAS.map((enigma) => enigma.id));
const INTROS = new Set<IntroId>(['pompage', 'bassin', 'gibbs']);

export function emptySave(): Save {
	return { solved: [], seenIntro: false, seen: [] };
}

export function sanitizeSave(value: unknown): Save {
	if (!value || typeof value !== 'object') return emptySave();
	const raw = value as { solved?: unknown; seenIntro?: unknown; seen?: unknown };
	const solved = Array.isArray(raw.solved)
		? raw.solved.filter((id): id is EnigmaId => typeof id === 'string' && KNOWN.has(id as EnigmaId))
		: [];
	const seen = Array.isArray(raw.seen)
		? raw.seen.filter((id): id is IntroId => typeof id === 'string' && INTROS.has(id as IntroId))
		: [];
	if (raw.seenIntro === true && !seen.includes('pompage')) seen.push('pompage');
	return { solved: [...new Set(solved)], seenIntro: raw.seenIntro === true || seen.includes('pompage'), seen: [...new Set(seen)] };
}

export function levelOf(save: Save): number {
	return 1 + save.solved.length;
}

export function owned(save: Save): Enigma[] {
	return ENIGMAS.filter((enigma) => save.solved.includes(enigma.id));
}

export function damageOf(save: Save): number {
	if (save.solved.length === 0) return BARE_DAMAGE;
	return BASE_DAMAGE + owned(save).reduce((sum, enigma) => sum + enigma.bonus, 0);
}

export function hpOf(save: Save): number {
	return BASE_HP + (levelOf(save) - 1) * HP_PER_LEVEL;
}

/** Chaque monstre demande les PV d'un module de plus. Sans module, personne n'est accessible. */
export function hpRequired(monster: Monster): number {
	const rank = Math.max(0, MONSTERS.findIndex((item) => item.id === monster.id));
	return BASE_HP + (rank + 1) * HP_PER_LEVEL;
}

export function canFace(save: Save, monster: Monster): boolean {
	return hpOf(save) >= hpRequired(monster);
}

export function solve(save: Save, id: EnigmaId): { save: Save; fresh: boolean } {
	if (save.solved.includes(id)) return { save, fresh: false };
	return { save: { ...save, solved: [...save.solved, id] }, fresh: true };
}

export type Strike = { landed: boolean; green: number; red: number; power: number };

/**
 * Un clic de jauge. gapMs = 0 au premier appui : rien n’est encaissé.
 * Le coup part seulement si la jauge dépasse le trait après ce clic.
 */
export function strike(save: Save, monster: Monster, gapMs: number, power: number, live = false): Strike {
	const solved = save.solved.length;
	const opening = gapMs === 0;
	const drained = opening || live ? power : drainGauge(power, solved, gapMs);
	const next = pumpGauge(drained, solved);
	const landed = next >= HIT_LINE;
	const red = opening ? 0 : monster.atk * (Math.max(gapMs, RED_FLOOR_MS) / 1000);
	const green = landed ? damageOf(save) : solved === 0 ? BARE_DAMAGE : 0;
	return { landed, green, red, power: next };
}

export function damageTaken(save: Save, monster: Monster): number {
	const green = damageOf(save);
	if (green <= 0) return Number.POSITIVE_INFINITY;
	let power = 0;
	let foe = monster.hp;
	let red = 0;
	for (let i = 0; i < 800 && foe > 0; i += 1) {
		const hit = strike(save, monster, i === 0 ? 0 : DEBOUNCE_MS, power);
		power = hit.power;
		red += hit.red;
		if (hit.green > 0) foe -= hit.green;
	}
	return foe <= 0 ? red : Number.POSITIVE_INFINITY;
}

/** Vrai si, en cliquant au plus vite, Goutte abat le monstre avant d’être dissoute. */
export function canBeat(save: Save, monster: Monster): boolean {
	return damageTaken(save, monster) < hpOf(save);
}
