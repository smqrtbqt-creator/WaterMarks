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
	{ id: 'tetard', name: 'Têtard mouillé', hp: 8, atk: 0, blurb: 'Il glisse. Il ne mord pas.' },
	{ id: 'canard', name: 'Canard de bâche', hp: 30, atk: 3, blurb: 'Il garde le réservoir. Mal.' },
	{ id: 'nitrate', name: 'Nitrate gluant', hp: 70, atk: 5, blurb: 'Il dépasse 50 et il est fier.' },
	{ id: 'turbine', name: 'Turbine possédée', hp: 140, atk: 8, blurb: 'Elle tourne à l’envers par principe.' },
	{ id: 'kraken', name: 'Kraken du réservoir', hp: 280, atk: 10, blurb: 'Il habite la hauteur statique. Enfin, il le croit.' }
];

export const BASE_DAMAGE = 1;
export const BASE_HP = 14;
export const HP_PER_LEVEL = 12;
/** Deux coups par seconde : le bouton de l’arène reprend après 500 ms. */
export const CLICKS_PER_SEC = 2;

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
	return BASE_DAMAGE + owned(save).reduce((sum, enigma) => sum + enigma.bonus, 0);
}

export function hpOf(save: Save): number {
	return BASE_HP + (levelOf(save) - 1) * HP_PER_LEVEL;
}

export function solve(save: Save, id: EnigmaId): { save: Save; fresh: boolean } {
	if (save.solved.includes(id)) return { save, fresh: false };
	return { save: { ...save, solved: [...save.solved, id] }, fresh: true };
}

export function secondsToWin(save: Save, monster: Monster): number {
	const dps = damageOf(save) * CLICKS_PER_SEC;
	if (dps <= 0) return Number.POSITIVE_INFINITY;
	return monster.hp / dps;
}

export function damageTaken(save: Save, monster: Monster): number {
	return monster.atk * secondsToWin(save, monster);
}

/** Vrai si, en tapant au rythme prévu, Goutte abat le monstre avant d’être dissoute. */
export function canBeat(save: Save, monster: Monster): boolean {
	return damageTaken(save, monster) < hpOf(save);
}
