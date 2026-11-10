export type PlaceId = 'source' | 'champ' | 'village' | 'confluence' | 'aval';
export type WeatherId = 'sec' | 'pluie' | 'epandage';

export type Place = {
	id: PlaceId;
	name: string;
	where: string;
	x: number;
	y: number;
	nitrate: number;
	turbidity: number;
	conductivity: number;
};

/** Concentrations simulées, pas un relevé de terrain. */
export const PLACES: Place[] = [
	{ id: 'source', name: 'Source', where: 'Forêt, en amont', x: 118, y: 78, nitrate: 3, turbidity: 1.2, conductivity: 90 },
	{ id: 'champ', name: 'Ruisseau des champs', where: 'Plateau cultivé', x: 250, y: 210, nitrate: 38, turbidity: 8, conductivity: 410 },
	{ id: 'village', name: 'Aval du bourg', where: 'Après le village', x: 470, y: 150, nitrate: 16, turbidity: 5, conductivity: 340 },
	{ id: 'confluence', name: 'Confluence', where: 'Les deux ruisseaux se rejoignent', x: 430, y: 280, nitrate: 27, turbidity: 6.5, conductivity: 320 },
	{ id: 'aval', name: 'Point aval', where: 'Avant la prise d’eau', x: 680, y: 330, nitrate: 21, turbidity: 4, conductivity: 280 }
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
