export type PlaceId = 'source' | 'champ' | 'confluence' | 'aval';
export type WeatherId = 'sec' | 'pluie' | 'epandage';

export type Place = {
	id: PlaceId;
	name: string;
	where: string;
	x: number;
	y: number;
	/** Où poser le nom par rapport au point, pour qu’il reste sur son cours d’eau. */
	side: 'up' | 'up-left' | 'left' | 'right';
	nitrate: number;
	turbidity: number;
	conductivity: number;
};

/**
 * Deux cours d’eau seulement.
 * Le ruisseau des champs est le trait de gauche : (40,230) → confluence (480,270).
 * L’autre vient de la source, en forêt : (120,40) → (280,120) → confluence.
 * Après la jonction, la rivière descend jusqu’au point le plus bas (780,444).
 */
export const PLACES: Place[] = [
	{ id: 'source', name: 'Source', where: 'Forêt, en amont', x: 152, y: 56, side: 'right', nitrate: 3, turbidity: 1.2, conductivity: 90 },
	{ id: 'champ', name: 'Ruisseau des champs', where: 'Sur ce seul cours d’eau, avant la jonction', x: 220, y: 246.4, side: 'up-left', nitrate: 38, turbidity: 8, conductivity: 410 },
	{ id: 'confluence', name: 'Confluence', where: 'Pile à la rencontre des deux cours d’eau', x: 480, y: 270, side: 'up', nitrate: 27, turbidity: 6.5, conductivity: 320 },
	{ id: 'aval', name: 'Point aval', where: 'Au point le plus bas, avant la prise d’eau', x: 780, y: 444, side: 'up-left', nitrate: 21, turbidity: 4, conductivity: 280 }
];

export const NITRATE_REFERENCE_MG_L = 50;

export function sample(place: Place, weather: WeatherId) {
	let nitrate = place.nitrate;
	let turbidity = place.turbidity;
	let conductivity = place.conductivity;
	if (weather === 'pluie') {
		turbidity *= place.id === 'source' ? 1.5 : 2.6;
		nitrate *= 0.7;
		conductivity *= 0.85;
	}
	if (weather === 'epandage' && (place.id === 'champ' || place.id === 'confluence' || place.id === 'aval')) {
		nitrate *= place.id === 'champ' ? 2.1 : 1.45;
		conductivity *= 1.08;
	}
	return {
		nitrate,
		turbidity,
		conductivity
	};
}
