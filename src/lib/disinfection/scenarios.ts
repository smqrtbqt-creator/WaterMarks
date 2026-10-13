import { DEFAULT_SETTINGS } from './engine';
import type { Evaluation, Goal, SafetyFlags, Settings } from './types';

export type Scenario = {
	id: string;
	atelier: number;
	title: string;
	summary: string;
	objective: string;
	settings: Settings;
};

export const WATERS: { id: string; title: string; note: string; patch: Pick<Settings, 'turbidityNtu' | 'ph' | 'bacteria' | 'virus' | 'giardia' | 'crypto' | 'temperatureC' | 'demandMgL' | 'organic'> }[] = [
	{
		id: 'claire',
		title: 'Eau relativement claire',
		note: 'Valeurs pédagogiques simulées, pas une analyse de ressource.',
		patch: { turbidityNtu: 0.6, ph: 7.3, bacteria: 35, virus: 28, giardia: 12, crypto: 8, temperatureC: 12, demandMgL: 0.25, organic: 15 }
	},
	{
		id: 'turbide',
		title: 'Eau turbide',
		note: 'La turbidité simulée gêne la désinfection. Elle ne se corrige pas seulement avec du chlore.',
		patch: { turbidityNtu: 14, ph: 7.1, bacteria: 70, virus: 55, giardia: 60, crypto: 45, temperatureC: 10, demandMgL: 0.9, organic: 40 }
	},
	{
		id: 'risque',
		title: 'Risque microbiologique élevé',
		note: 'Indicateurs hauts, dont des protozoaires. La chloration seule ne couvre pas Cryptosporidium.',
		patch: { turbidityNtu: 1.8, ph: 7.6, bacteria: 90, virus: 80, giardia: 70, crypto: 85, temperatureC: 16, demandMgL: 0.45, organic: 28 }
	}
];

function withBase(patch: Partial<Settings>): Settings {
	return { ...DEFAULT_SETTINGS, filtrationAid: 0, uvAid: false, ozoneAid: false, membraneAid: false, ...patch };
}

export const SCENARIOS: Scenario[] = [
	{
		id: 'nominal',
		atelier: 2,
		title: 'Situation nominale',
		summary: 'Eau déjà clarifiée, réglages cohérents, sonde disponible.',
		objective: 'Garder un résiduel libre, un pH dans la référence citée et un indicateur bactérien bas, sans faire monter les sous-produits.',
		settings: { ...DEFAULT_SETTINGS }
	},
	{
		id: 'ph',
		atelier: 3,
		title: 'pH défavorable',
		summary: 'Même famille de dose et de temps, mais un pH qui laisse peu de HOCl.',
		objective: 'Retrouver une part de HOCl suffisante sans sortir de la référence de pH 6,5 à 9.',
		settings: withBase({ ph: 8.8, doseMgL: 1, contactMin: 30, demandMgL: 0.3, turbidityNtu: 0.5, filtrationAid: 30, bacteria: 55, organic: 16 })
	},
	{
		id: 'demande',
		atelier: 2,
		title: 'Forte demande en chlore',
		summary: 'Une grande partie du chlore réagit avec l’eau avant de laisser un résiduel.',
		objective: 'Obtenir un résiduel libre pédagogique sans dose excessive au regard de l’indice de sous-produits.',
		settings: withBase({ demandMgL: 1.7, doseMgL: 0.6, contactMin: 25, organic: 22, turbidityNtu: 0.5, filtrationAid: 20, ph: 7.3, bacteria: 60 })
	},
	{
		id: 'turbidite',
		atelier: 4,
		title: 'Turbidité élevée',
		summary: 'L’eau arrive trouble en désinfection. Le chlore et les UV perdent de l’effet.',
		objective: 'Améliorer la filtration amont jusqu’à une turbidité simulée basse, puis vérifier l’indicateur bactérien.',
		settings: withBase({ turbidityNtu: 12, filtrationAid: 0, doseMgL: 1.2, contactMin: 30, ph: 7.2, demandMgL: 0.4, bacteria: 75, organic: 30 })
	},
	{
		id: 'crypto',
		atelier: 4,
		title: 'Cryptosporidium',
		summary: 'La chloration classique ne donne pas le résultat attendu sur ce protozoaire.',
		objective: 'Ajouter une barrière adaptée : filtration, UV, ozone ou membrane. Monter seulement la dose de chlore ne suffit pas.',
		settings: withBase({ crypto: 80, giardia: 50, bacteria: 40, doseMgL: 1.4, contactMin: 40, ph: 7, turbidityNtu: 0.8, filtrationAid: 0, organic: 18 })
	},
	{
		id: 'derive',
		atelier: 6,
		title: 'Dérive de mesure',
		summary: 'L’analyseur continu n’affiche plus la même valeur que le DPD de référence.',
		objective: 'Repérer l’écart, puis étalonner la sonde ou décider à partir du DPD.',
		settings: withBase({ ...DEFAULT_SETTINGS, probeMode: 'drift', probeDriftMgL: 0.7, useDpdAsReference: false, filtrationAid: 40 })
	},
	{
		id: 'signal',
		atelier: 6,
		title: 'Défaut de surveillance',
		summary: 'L’analyseur continu ne transmet plus de signal.',
		objective: 'Ne pas inventer une mesure. S’appuyer sur le contrôle DPD et maintenir la surveillance.',
		settings: withBase({ ...DEFAULT_SETTINGS, probeMode: 'lost', useDpdAsReference: false, filtrationAid: 40 })
	},
	{
		id: 'sous-produits',
		atelier: 2,
		title: 'Sous-produits',
		summary: 'Dose haute, matière organique haute et temps long : l’indice pédagogique de sous-produits s’allume.',
		objective: 'Faire redescendre l’indice tout en gardant l’indicateur bactérien bas.',
		settings: withBase({ doseMgL: 3, organic: 78, contactMin: 50, ph: 8.1, demandMgL: 0.4, turbidityNtu: 0.6, filtrationAid: 25, bacteria: 45 })
	},
	{
		id: 'securite',
		atelier: 6,
		title: 'Incident de sécurité',
		summary: 'Une odeur piquante et une alarme signalent une fuite de chlore gazeux dans un local.',
		objective: 'Évacuer, interdire l’accès et alerter les secours ainsi que le personnel formé. Ne pas intervenir soi-même sur la fuite.',
		settings: { ...DEFAULT_SETTINGS }
	}
];

export function scenarioById(id: string): Scenario {
	const found = SCENARIOS.find((item) => item.id === id);
	if (!found) throw new Error(`Scénario inconnu : ${id}`);
	return found;
}

function organism(evaluation: Evaluation, id: 'bacteria' | 'crypto') {
	const found = evaluation.organisms.find((item) => item.id === id);
	if (!found) throw new Error(id);
	return found;
}

export function evaluateGoals(scenarioId: string, evaluation: Evaluation, safety: SafetyFlags): Goal[] {
	const bacteria = organism(evaluation, 'bacteria');
	const crypto = organism(evaluation, 'crypto');
	const free = evaluation.balance.freeMgL;
	const ph = evaluation.settings.ph;
	const goals: Goal[] = [];
	const push = (goal: Goal) => goals.push(goal);

	if (scenarioId === 'nominal' || scenarioId === 'demande' || scenarioId === 'turbidite' || scenarioId === 'sous-produits' || scenarioId === 'ph') {
		push({
			id: 'bacteria',
			label: 'Indicateur bactérien bas',
			basis: 'educational_assumption',
			ok: bacteria.remaining <= 8,
			detail: `Indicateur simulé ${bacteria.remaining.toFixed(1)} / 100. Objectif pédagogique : 8. Ce n’est pas un dénombrement d’E. coli.`
		});
	}
	if (scenarioId === 'nominal' || scenarioId === 'demande' || scenarioId === 'sous-produits') {
		push({
			id: 'residual',
			label: 'Résiduel libre dans la bande d’exercice',
			basis: 'educational_assumption',
			ok: free >= 0.1 && free <= 0.8,
			detail: `Chlore libre ${free.toFixed(2)} mg/L. Bande pédagogique 0,10 à 0,80 mg/L, pas une limite de l’arrêté.`
		});
	}
	if (scenarioId === 'nominal' || scenarioId === 'ph') {
		push({
			id: 'ph',
			label: 'pH entre 6,5 et 9',
			basis: 'regulatory_reference',
			ok: ph >= 6.5 && ph <= 9,
			detail: `pH ${ph.toFixed(2)}. Référence citée de l’arrêté du 11 janvier 2007 modifié. Les eaux ne doivent pas être agressives.`
		});
	}
	if (scenarioId === 'ph') {
		push({
			id: 'hocl',
			label: 'Part de HOCl redevenue majoritaire',
			basis: 'educational_assumption',
			ok: evaluation.balance.hoclFraction >= 0.5 && ph >= 6.5,
			detail: `HOCl estimé ${(evaluation.balance.hoclFraction * 100).toFixed(0)} %. Le pKa pédagogique vaut ${evaluation.balance.pKa.toFixed(2)} à ${evaluation.settings.temperatureC.toFixed(0)} °C.`
		});
	}
	if (scenarioId === 'turbidite') {
		push({
			id: 'turbidity',
			label: 'Turbidité d’entrée abaissée',
			basis: 'educational_assumption',
			ok: evaluation.effectiveTurbidityNtu <= 1,
			detail: `Turbidité simulée après filtration amont ${evaluation.effectiveTurbidityNtu.toFixed(2)} NTU. La comparaison avec 1,0 NFU est pédagogique : l’arrêté vise le point de mise en distribution, dans un champ précis.`
		});
	}
	if (scenarioId === 'crypto') {
		push({
			id: 'crypto',
			label: 'Cryptosporidium réduit par une autre barrière',
			basis: 'educational_assumption',
			ok: crypto.remaining <= 25,
			detail: `Indicateur ${crypto.remaining.toFixed(1)} / 100. La chloration seule reste limitée dans ce modèle.`
		});
	}
	if (scenarioId === 'derive') {
		const ok = evaluation.settings.probeMode === 'calibrated' || evaluation.settings.useDpdAsReference;
		push({
			id: 'probe',
			label: 'Écart de sonde pris en compte',
			basis: 'educational_assumption',
			ok,
			detail: ok
				? 'La décision s’appuie sur une sonde étalonnée ou sur le DPD de référence.'
				: `Analyseur ${evaluation.probeMgL?.toFixed(2) ?? '—'} mg/L, DPD ${evaluation.dpdMgL.toFixed(2)} mg/L.`
		});
	}
	if (scenarioId === 'signal') {
		push({
			id: 'signal',
			label: 'Surveillance compensatoire',
			basis: 'educational_assumption',
			ok: evaluation.settings.useDpdAsReference || evaluation.settings.probeMode === 'calibrated',
			detail: 'Le signal continu manque au départ. Le contrôle DPD simulé, ou une sonde de nouveau étalonnée, rétablit une base de décision.'
		});
	}
	if (scenarioId === 'sous-produits' || scenarioId === 'nominal' || scenarioId === 'demande') {
		push({
			id: 'byproducts',
			label: 'Indice de sous-produits contenu',
			basis: 'educational_assumption',
			ok: evaluation.byproductRisk <= 40,
			detail: `Indice ${evaluation.byproductRisk.toFixed(0)} / 100. Hypothèse pédagogique, pas un dosage de trihalométhanes.`
		});
	}
	if (scenarioId === 'securite') {
		const safe = safety.evacuate && safety.isolate && safety.alert && !safety.approach && !safety.waterOnLeak;
		push({
			id: 'safety',
			label: 'Alerte sans intervention sur la fuite',
			basis: 'educational_assumption',
			ok: safe,
			detail: safe
				? 'Zone évacuée, accès interdit, secours et personnel formé alertés.'
				: 'La conduite attendue est d’évacuer, d’interdire l’accès et d’alerter. Un débutant ne traite pas lui-même une fuite de chlore gazeux.'
		});
	}
	return goals;
}
