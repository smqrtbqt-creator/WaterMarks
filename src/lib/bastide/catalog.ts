import data from '../data/bastide.json';
import type { DataCategory, Fact, Lesson, Scenario, StageId } from './types';

export const facts = data.facts as Fact[];
export const lessons = data.lessons as Record<StageId, Lesson>;
export const scenarios = data.scenarios as Scenario[];

export const CATEGORY_LABEL: Record<DataCategory, string> = {
	official: 'Donnée du site',
	educational_assumption: 'Hypothèse pédagogique',
	regulatory_reference: 'Référence réglementaire'
};

export function factById(id: string): Fact {
	const fact = facts.find((item) => item.id === id);
	if (!fact) throw new Error(`Donnée inconnue : ${id}`);
	return fact;
}

export function factNumber(id: string): number {
	const fact = factById(id);
	if (typeof fact.value !== 'number') throw new Error(`Donnée non numérique : ${id}`);
	return fact.value;
}

export function scenarioById(id: string): Scenario {
	const scenario = scenarios.find((item) => item.id === id);
	if (!scenario) throw new Error(`Scénario inconnu : ${id}`);
	return scenario;
}
