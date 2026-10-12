import data from '$lib/data/plant.json';
import type { PlantParams, Scenario, UnitId } from '$lib/sim/types';

export const plant = data.plant as PlantParams;
export const scenarios = data.scenarios as Scenario[];
export const hypotheses = data.hypotheses as string[];

export function scenarioById(id: string): Scenario {
	const scenario = scenarios.find((item) => item.id === id);
	if (!scenario) throw new Error(`Scénario inconnu : ${id}`);
	return scenario;
}

export const UNITS: {
	id: UnitId;
	index: string;
	title: string;
	duty: string;
	blurb: string;
}[] = [
	{
		id: 'intake',
		index: '01',
		title: 'Prise d’eau',
		duty: 'Gérer la ressource',
		blurb: 'Le débit prélevé ne peut pas dépasser ce que la rivière offre. Une crue change à la fois le débit disponible et la turbidité.'
	},
	{
		id: 'coagulation',
		index: '02',
		title: 'Coagulation',
		duty: 'Doser les réactifs',
		blurb: 'Le coagulant, sa dose, le pH et le polymère décident de la taille des flocs. Ce qui n’est pas agrégé ici se retrouve dans le décanteur.'
	},
	{
		id: 'settling',
		index: '03',
		title: 'Décantation',
		duty: 'Séparer les particules',
		blurb: 'Le décanteur de ce modèle est prévu pour 200 m³/h. Il ne rattrape pas des flocs qui ne se sont pas formés.'
	},
	{
		id: 'filtration',
		index: '04',
		title: 'Filtration',
		duty: 'Gérer le filtre',
		blurb: 'La perte de charge monte avec les particules retenues. Un lavage restaure la capacité, le temps qu’il dure la production baisse.'
	},
	{
		id: 'remineralization',
		index: '05',
		title: 'Reminéralisation',
		duty: 'Ajuster la chimie',
		blurb: 'La chaux apporte calcium et alcalinité. Le CO₂ ramène le pH. Un pH dans la cible ne dit pas, à lui seul, que l’eau est équilibrée.'
	},
	{
		id: 'disinfection',
		index: '06',
		title: 'Désinfection',
		duty: 'Sécuriser l’eau',
		blurb: 'Le résiduel dépend de la dose et de la demande. Le CT dépend aussi du pH et du temps de séjour, donc du débit.'
	},
	{
		id: 'storage',
		index: '07',
		title: 'Stockage',
		duty: 'Tenir la demande',
		blurb: 'Le réservoir encaisse un écart entre production et consommation. Il se vide si la pointe dure et que les ouvrages ne suivent pas.'
	}
];
