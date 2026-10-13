import { COAGULANTS, clamp, doseEfficiency, langelier, phEfficiency, remineralize } from '../sim/chemistry';
import { hoclFraction } from '../disinfection/engine';
import { MODULES, MOLECULES, RUN_VOLUME_M3, defaultSettings } from './treatments';
import { MODULE_ORDER, type ModuleId, type MoleculeId, type TrainSettings, type Water } from './types';

/**
 * Moteur pédagogique du laboratoire de traitement.
 * Déterministe : même eau et mêmes réglages donnent le même résultat.
 * Ce n’est pas un modèle d’usine, ni une preuve de potabilité.
 *
 * Hypothèses communes
 * - Courbe saturante 1 − exp(−x) : doubler une dose ne double pas le rendement.
 * - Bilans : fer et manganèse dissous deviennent particulaires à l’oxydation ;
 *   la filtration retire des particules, pas le dissous.
 * - H₂S : l’aération le transfère à l’air (eau + gaz = constant) ;
 *   l’oxydation chimique le détruit dans l’eau (eau + oxydé = constant).
 * - Température fixée à 15 °C pour la fraction HOCl (Morris, via le module désinfection).
 * - TDS 220 mg/L et 15 °C pour l’indice de Langelier, hypothèse pédagogique.
 * - Aucun coût en euros : les prix de réactifs ne sont pas des données du projet.
 */

export const MODEL_LIMITS = [
	'Les doses, temps de contact et débits sont des plages d’atelier. Ils ne reproduisent pas une consigne d’exploitation.',
	'La courbe d’élimination sature. Une dose déjà efficace gagne peu si on la double.',
	'Le fer et le manganèse dissous traversent un filtre. Il faut d’abord les transformer en particules.',
	'Le chlore oxyde mal le manganèse tant que le pH reste proche de la neutralité, dans ce modèle.',
	'L’aération déplace le H₂S vers l’air. Elle ne le détruit pas. Le gaz est toxique et l’odeur n’est pas une mesure.',
	'Le COT ne dit pas quelle part est biodégradable ou adsorbable. Le filtre biologique est plafonné à environ 36 %.',
	'Deux pesticides n’ont pas la même adsorption, la même réactivité à l’ozone, ni la même rétention membranaire.',
	'L’ultrafiltration ne retire pas les nitrates, la dureté ni le pesticide dissous de ces cas.',
	'L’indice de Langelier utilise 15 °C et 220 mg/L de TDS, valeurs d’atelier, pas une analyse du cas.',
	'L’indicateur microbien va de 0 à 100. Il ne remplace pas un dénombrement d’E. coli dans 100 mL.',
	'Un objectif atteint ici n’autorise pas à déclarer l’eau potable.'
];

export type StepEffect = {
	id: ModuleId | 'control';
	title: string;
	enabled: boolean;
	summary: string;
};

export type ReagentUse = {
	label: string;
	detail: string;
};

export type Simulation = {
	before: Water;
	after: Water;
	steps: StepEffect[];
	profile: { id: string; title: string; water: Water }[];
	reagents: ReagentUse[];
	reagentIndex: number;
	issues: string[];
	volumeM3: number;
	lsi: number;
	stability: string;
};

type Ctx = { floc: number; oxidized: boolean };

const NUMERIC_RANGES: Record<string, [number, number]> = {
	airIntensity: [0, 100],
	airContactMin: [0, 40],
	airFlow: [0, 200],
	neutralDose: [0, 80],
	neutralTargetPh: [6.2, 8.6],
	oxidantDose: [0, 8],
	oxidantContactMin: [0, 60],
	coagulantDose: [0, 80],
	coagMix: [0, 100],
	coagContactMin: [0, 40],
	settlingMin: [0, 90],
	filterRate: [2, 20],
	filterState: [0, 100],
	reminContactMin: [0, 40],
	reminLime: [0, 80],
	reminCo2: [0, 80],
	softenerCapacity: [0, 100],
	nitrateRate: [0, 100],
	nitrateCapacity: [0, 100],
	carbonContactMin: [0, 40],
	carbonSaturation: [0, 100],
	membranePressure: [0, 16],
	membraneRecovery: [50, 95],
	ozoneDose: [0, 5],
	ozoneContactMin: [0, 30],
	ozoneTransfer: [0, 100],
	uvDose: [0, 80],
	uvFlow: [5, 200],
	chlorineDose: [0, 5],
	chlorineDemand: [0, 4],
	chlorineContactMin: [0, 90]
};

function sat(x: number): number {
	if (!Number.isFinite(x) || x <= 0) return 0;
	return 1 - Math.exp(-x);
}

function num(value: number, fallback = 0): number {
	return Number.isFinite(value) ? value : fallback;
}

export function cloneWater(water: Water): Water {
	return { ...water };
}

export function ironTotal(water: Water): number {
	return water.ironDissolvedMgL + water.ironParticulateMgL;
}

export function manganeseTotal(water: Water): number {
	return water.manganeseDissolvedMgL + water.manganeseParticulateMgL;
}

export function h2sAccounted(water: Water): number {
	return water.h2sMgL + water.h2sStrippedMgL + water.h2sOxidizedMgL;
}

function cleanWater(input: Water): { water: Water; issues: string[] } {
	const issues: string[] = [];
	const water = cloneWater(input);
	const keys = Object.keys(water) as (keyof Water)[];
	for (const key of keys) {
		const value = water[key];
		if (typeof value !== 'number' || !Number.isFinite(value)) {
			issues.push(`Valeur d’eau illisible pour ${key} : remplacée par 0.`);
			water[key] = 0;
		} else if (key === 'ph') {
			water.ph = clamp(value, 4, 10);
		} else if (value < 0) {
			issues.push(`${key} était négatif : ramené à 0.`);
			water[key] = 0;
		}
	}
	water.microbial = clamp(water.microbial, 0, 100);
	water.hardnessF = water.calciumF + water.magnesiumF;
	return { water, issues };
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T, issues: string[], label: string): T {
	if (allowed.includes(value as T)) return value as T;
	issues.push(`${label} inconnu : valeur pédagogique par défaut.`);
	return fallback;
}

export function sanitize(input: Partial<TrainSettings> | TrainSettings): { settings: TrainSettings; issues: string[] } {
	const issues: string[] = [];
	const base = defaultSettings();
	const source = input ?? {};
	const settings: TrainSettings = { ...base, ...source, enabled: { ...base.enabled } };
	for (const id of MODULE_ORDER) {
		settings.enabled[id] = Boolean(source.enabled?.[id]);
	}
	for (const [key, range] of Object.entries(NUMERIC_RANGES)) {
		const field = key as keyof typeof NUMERIC_RANGES;
		const raw = (source as Record<string, unknown>)[field];
		if (raw === undefined) continue;
		if (typeof raw !== 'number' || !Number.isFinite(raw)) {
			issues.push(`${field} illisible : réglage pédagogique conservé.`);
			(settings as unknown as Record<string, number>)[field] = (base as unknown as Record<string, number>)[field];
			continue;
		}
		const next = clamp(raw, range[0], range[1]);
		if (next !== raw) issues.push(`${field} hors plage pédagogique : ramené à ${next}.`);
		(settings as unknown as Record<string, number>)[field] = next;
	}
	settings.neutralReagent = oneOf(source.neutralReagent, ['lime', 'soda', 'calcite'] as const, 'soda', issues, 'Réactif de neutralisation');
	settings.oxidant = oneOf(source.oxidant, ['chlorine', 'permanganate', 'ozone'] as const, 'chlorine', issues, 'Oxydant');
	settings.coagulant = oneOf(source.coagulant, ['alum', 'ferric'] as const, 'alum', issues, 'Coagulant');
	settings.filterMedia = oneOf(source.filterMedia, ['sand', 'manganese', 'dual', 'bio'] as const, 'sand', issues, 'Média filtrant');
	settings.reminMedia = oneOf(source.reminMedia, ['calcite', 'lime-co2'] as const, 'lime-co2', issues, 'Reminéralisation');
	settings.nitrateTech = oneOf(source.nitrateTech, ['biological', 'resin'] as const, 'resin', issues, 'Technologie nitrates');
	settings.carbonType = oneOf(source.carbonType, ['gac', 'pac'] as const, 'gac', issues, 'Charbon');
	settings.membrane = oneOf(source.membrane, ['uf', 'nf', 'ro'] as const, 'uf', issues, 'Membrane');
	settings.moleculeId = oneOf(source.moleculeId, ['cas', 'faible'] as const, 'cas', issues, 'Molécule');
	settings.sourceInvestigated = Boolean(source.sourceInvestigated);
	return { settings, issues };
}

function finish(water: Water): Water {
	water.ph = clamp(num(water.ph, 7), 4, 10);
	const keys = Object.keys(water) as (keyof Water)[];
	for (const key of keys) {
		if (key === 'ph') continue;
		water[key] = Math.max(0, num(water[key]));
	}
	water.microbial = clamp(water.microbial, 0, 100);
	water.hardnessF = water.calciumF + water.magnesiumF;
	return water;
}

function rateFactor(rate: number): number {
	if (rate <= 8) return 1;
	return clamp(8 / rate, 0.35, 1);
}

function screen(water: Water): { water: Water; summary: string } {
	const next = finish(cloneWater(water));
	next.turbidityNtu *= 0.97;
	next.ironParticulateMgL *= 0.99;
	next.manganeseParticulateMgL *= 0.99;
	return {
		water: finish(next),
		summary: 'Débris grossiers retenus. Colloïdes et espèces dissoutes presque inchangés.'
	};
}

function aeration(water: Water, settings: TrainSettings): { water: Water; summary: string; reagent: ReagentUse } {
	const next = finish(cloneWater(water));
	const drive = sat((settings.airIntensity / 70) * (settings.airContactMin / 8) * (settings.airFlow / 60));
	const strip = 0.93 * drive;
	const removed = next.h2sMgL * strip;
	next.h2sMgL -= removed;
	next.h2sStrippedMgL += removed;
	const phOx = clamp((next.ph - 6.5) / 1.2, 0, 1);
	const feFrac = 0.62 * sat((settings.airIntensity / 80) * (settings.airContactMin / 8)) * phOx;
	const feMoved = next.ironDissolvedMgL * feFrac;
	next.ironDissolvedMgL -= feMoved;
	next.ironParticulateMgL += feMoved;
	next.turbidityNtu += feMoved * 3.2;
	const mnFrac = 0.05 * drive * clamp((next.ph - 8) / 1, 0, 1);
	const mnMoved = next.manganeseDissolvedMgL * mnFrac;
	next.manganeseDissolvedMgL -= mnMoved;
	next.manganeseParticulateMgL += mnMoved;
	return {
		water: finish(next),
		summary: `H₂S transféré vers l’air : ${removed.toFixed(3)} mg/L. Le gaz n’est pas détruit. Fer oxydé par l’air : ${feMoved.toFixed(2)} mg/L.`,
		reagent: { label: 'Air', detail: `${settings.airFlow} m³/h d’air, intensité ${settings.airIntensity} (échelle pédagogique)` }
	};
}

function neutralization(water: Water, settings: TrainSettings): { water: Water; summary: string; reagent: ReagentUse } {
	const next = finish(cloneWater(water));
	const names = { lime: 'Chaux', soda: 'Soude', calcite: 'Calcaire' };
	const target = settings.neutralTargetPh;
	if (settings.neutralReagent === 'soda') {
		const frac = sat(settings.neutralDose / 22);
		const room = Math.max(0, target - next.ph);
		next.ph += room * frac;
		next.alkalinityF += 1.1 * frac;
	} else if (settings.neutralReagent === 'lime') {
		const frac = sat(settings.neutralDose / 20);
		const room = Math.max(0, target - next.ph);
		next.ph += room * frac;
		next.calciumF += 5.5 * frac;
		next.alkalinityF += 6.5 * frac;
	} else {
		const frac = sat(settings.neutralDose / 22);
		const room = Math.max(0, Math.min(target, 7.8) - next.ph);
		next.ph += room * frac;
		next.calciumF += 7 * frac;
		next.alkalinityF += 7.2 * frac;
	}
	next.hardnessF = next.calciumF + next.magnesiumF;
	return {
		water: finish(next),
		summary:
			settings.neutralReagent === 'soda'
				? 'Le pH se rapproche de la cible. Calcium presque inchangé : ce n’est pas une reminéralisation.'
				: 'Le pH monte et le calcium ainsi que l’alcalinité augmentent.',
		reagent: { label: names[settings.neutralReagent], detail: `${settings.neutralDose} mg/L ou min de contact, cible pH ${target}` }
	};
}

function oxidation(water: Water, settings: TrainSettings, ctx: Ctx): { water: Water; summary: string; reagent: ReagentUse } {
	const next = finish(cloneWater(water));
	const phFe = settings.oxidant === 'permanganate' ? 1 : clamp((next.ph - 5.5) / 1.4, 0.2, 1);
	const feDrive = sat((settings.oxidantDose / (0.55 + 0.28 * Math.max(next.ironDissolvedMgL, 0.05))) * (settings.oxidantContactMin / 10) * phFe);
	const feFrac = feDrive * (settings.oxidant === 'ozone' ? 0.9 : 1);
	const feMoved = next.ironDissolvedMgL * feFrac;
	next.ironDissolvedMgL -= feMoved;
	next.ironParticulateMgL += feMoved;
	next.turbidityNtu += feMoved * 3.5;
	let phMn = 0;
	if (settings.oxidant === 'chlorine') phMn = clamp((next.ph - 7.6) / 1.1, 0, 1);
	if (settings.oxidant === 'permanganate') phMn = clamp((next.ph - 6.2) / 0.8, 0.45, 1);
	if (settings.oxidant === 'ozone') phMn = 0.9;
	const mnDrive =
		sat((settings.oxidantDose / (0.35 + 1.2 * Math.max(next.manganeseDissolvedMgL, 0.02))) * (settings.oxidantContactMin / 12)) * phMn;
	const mnMoved = next.manganeseDissolvedMgL * mnDrive;
	next.manganeseDissolvedMgL -= mnMoved;
	next.manganeseParticulateMgL += mnMoved;
	next.turbidityNtu += mnMoved * 4;
	if (settings.oxidant === 'permanganate' && settings.oxidantDose > 1.8 && next.manganeseDissolvedMgL < 0.03) {
		next.manganeseDissolvedMgL += (settings.oxidantDose - 1.8) * 0.02;
	}
	const h2sFrac = 0.95 * sat((settings.oxidantDose / 0.5) * (settings.oxidantContactMin / 8));
	const h2sRemoved = next.h2sMgL * h2sFrac;
	next.h2sMgL -= h2sRemoved;
	next.h2sOxidizedMgL += h2sRemoved;
	if (feMoved + mnMoved > 0.05) ctx.oxidized = true;
	const names = { chlorine: 'Chlore oxydant', permanganate: 'Permanganate', ozone: 'Ozone oxydant' };
	return {
		water: finish(next),
		summary: `Fer dissous transformé : ${feMoved.toFixed(2)} mg/L. Manganèse dissous transformé : ${mnMoved.toFixed(3)} mg/L. H₂S détruit dans l’eau : ${h2sRemoved.toFixed(3)} mg/L.`,
		reagent: { label: names[settings.oxidant], detail: `${settings.oxidantDose} mg/L, ${settings.oxidantContactMin} min` }
	};
}

function coagulation(water: Water, settings: TrainSettings, ctx: Ctx): { water: Water; summary: string; reagent: ReagentUse } {
	const next = finish(cloneWater(water));
	const spec = COAGULANTS[settings.coagulant];
	const optimal = spec.doseK * Math.sqrt(Math.max(next.turbidityNtu, 0.4));
	const ratio = settings.coagulantDose / Math.max(optimal, 0.2);
	const eff =
		doseEfficiency(ratio) *
		phEfficiency(next.ph, spec.phCenter, spec.phHalfWidth) *
		sat(settings.coagContactMin / 8) *
		(0.5 + 0.5 * (settings.coagMix / 100));
	const capture = 0.93 * clamp(eff, 0, 1);
	next.turbidityNtu *= 1 - capture;
	next.ironParticulateMgL *= 1 - capture;
	next.manganeseParticulateMgL *= 1 - capture;
	next.alkalinityF = Math.max(0.4, next.alkalinityF - (settings.coagulantDose * spec.alkPerMg) / 10);
	ctx.floc = clamp(eff, 0, 1);
	return {
		water: finish(next),
		summary: `Floc ${ctx.floc < 0.35 ? 'médiocre' : ctx.floc < 0.65 ? 'moyen' : 'net'}. Les colloïdes se regroupent ; le dissous reste.`,
		reagent: { label: spec.name, detail: `${settings.coagulantDose} mg/L (dose pédagogique, sommet illustratif vers ${optimal.toFixed(1)} mg/L)` }
	};
}

function settling(water: Water, settings: TrainSettings, ctx: Ctx): { water: Water; summary: string } {
	const next = finish(cloneWater(water));
	const settle = sat(settings.settlingMin / 22) * (0.15 + 0.8 * ctx.floc);
	const cut = 0.9 * settle;
	next.turbidityNtu *= 1 - cut;
	next.ironParticulateMgL *= 1 - cut;
	next.manganeseParticulateMgL *= 1 - cut;
	return {
		water: finish(next),
		summary: ctx.floc < 0.2 ? 'Peu de dépôt : le floc est insuffisant.' : 'Une partie des agrégats se dépose.'
	};
}

function filtration(water: Water, settings: TrainSettings, ctx: Ctx): { water: Water; summary: string } {
	const next = finish(cloneWater(water));
	const clean = 1 - 0.75 * (settings.filterState / 100);
	const sized = 0.28 + 0.72 * ctx.floc;
	const turbFactor = ctx.oxidized ? Math.max(sized, 0.96) : sized;
	const base = settings.filterMedia === 'dual' ? 0.96 : settings.filterMedia === 'bio' ? 0.9 : 0.94;
	const turbCut = clamp(base * turbFactor * rateFactor(settings.filterRate) * clean, 0, 0.985);
	next.turbidityNtu *= 1 - turbCut;
	if (settings.filterState > 80) next.turbidityNtu += 0.45 * ((settings.filterState - 80) / 20);
	const metalBase = settings.filterMedia === 'manganese' || settings.filterMedia === 'dual' ? 0.99 : 0.985;
	const metalCut = clamp(metalBase * (ctx.oxidized ? 0.99 : sized) * rateFactor(settings.filterRate) * clean, 0, 0.985);
	next.ironParticulateMgL *= 1 - metalCut;
	next.manganeseParticulateMgL *= 1 - (settings.filterMedia === 'manganese' ? Math.min(0.99, metalCut + 0.01) : metalCut);
	if (settings.filterMedia === 'bio') {
		const bio = 0.36 * (settings.filterState < 90 ? 1 - settings.filterState / 140 : 0.15) * rateFactor(settings.filterRate);
		next.tocMgL *= 1 - bio;
	}
	const mediaNames = { sand: 'sable', manganese: 'sable manganifère', dual: 'bicouche', bio: 'filtre biologique' };
	return {
		water: finish(next),
		summary: `Rétention des particules sur ${mediaNames[settings.filterMedia]}. Le dissous n’est pas arrêté par le sable.`
	};
}

function remineralization(water: Water, settings: TrainSettings): { water: Water; summary: string; reagent: ReagentUse } {
	const next = finish(cloneWater(water));
	const lime = settings.reminMedia === 'calcite' ? settings.reminContactMin * 1.5 : settings.reminLime;
	const co2 = settings.reminMedia === 'calcite' ? lime * (44.01 / 74.09) * 2 : settings.reminCo2;
	const mineral = remineralize({
		phIn: next.ph,
		calciumMgL: next.calciumF * 4.008,
		alkalinityMgL: next.alkalinityF * 10,
		limeMgL: lime,
		co2MgL: co2,
		temperatureC: 15,
		tdsMgL: 220
	});
	next.ph = mineral.ph;
	next.calciumF = mineral.calciumMgL / 4.008;
	next.alkalinityF = mineral.alkalinityMgL / 10;
	next.hardnessF = next.calciumF + next.magnesiumF;
	return {
		water: finish(next),
		summary: `Calcium et alcalinité évoluent à part du simple ajustement à la soude. Bilan calco-carbonique du modèle : ${mineral.balance}.`,
		reagent: {
			label: settings.reminMedia === 'calcite' ? 'Calcaire de contact' : 'Chaux et CO₂',
			detail: `${lime.toFixed(0)} mg/L de chaux équivalente, ${co2.toFixed(0)} mg/L de CO₂`
		}
	};
}

function softening(water: Water, settings: TrainSettings): { water: Water; summary: string } {
	const next = finish(cloneWater(water));
	const cap = settings.softenerCapacity / 100;
	if (cap <= 0.02) {
		return { water: next, summary: 'Résine épuisée : la dureté ne change pas. Une régénération restaure la capacité.' };
	}
	next.calciumF *= 1 - 0.9 * cap;
	next.magnesiumF *= 1 - 0.84 * cap;
	next.hardnessF = next.calciumF + next.magnesiumF;
	return {
		water: finish(next),
		summary: 'Calcium et magnésium diminuent. Les nitrates ne sont pas échangés sur cette résine.'
	};
}

function nitrate(water: Water, settings: TrainSettings): { water: Water; summary: string; reagent: ReagentUse } {
	const next = finish(cloneWater(water));
	if (settings.nitrateTech === 'biological') {
		const frac = 0.86 * sat(settings.nitrateRate / 38) * sat(settings.nitrateCapacity / 28);
		next.nitrateMgL = Math.max(1.5, next.nitrateMgL * (1 - frac));
		next.microbial = clamp(next.microbial + 18 * frac, 0, 100);
		return {
			water: finish(next),
			summary: 'Dénitrification biologique. L’indicateur microbien augmente : prévoir une désinfection ensuite.',
			reagent: { label: 'Dénitrification', detail: `charge ${settings.nitrateRate}, capacité biologique ${settings.nitrateCapacity}` }
		};
	}
	const frac = 0.93 * (settings.nitrateCapacity / 100) * sat(settings.nitrateRate / 32);
	next.nitrateMgL = Math.max(1.2, next.nitrateMgL * (1 - frac));
	return {
		water: finish(next),
		summary: 'Résine sélective des nitrates. La saumure de régénération est un résidu à gérer, non modélisé en masse.',
		reagent: { label: 'Résine nitrates', detail: `capacité restante ${settings.nitrateCapacity} %, débit relatif ${settings.nitrateRate}` }
	};
}

function carbon(water: Water, settings: TrainSettings): { water: Water; summary: string } {
	const next = finish(cloneWater(water));
	const molecule = MOLECULES[settings.moleculeId];
	const fresh = clamp(1 - settings.carbonSaturation / 100, 0, 1);
	const contact = sat(settings.carbonContactMin / 10);
	const kind = settings.carbonType === 'gac' ? 0.96 : 0.7;
	const pestFrac = clamp(molecule.adsorbability * fresh * contact * kind, 0, 0.98);
	next.pesticideUgL *= 1 - pestFrac;
	const tocFrac = 0.78 * fresh * contact * (settings.carbonType === 'gac' ? 1 : 0.72);
	next.tocMgL *= 1 - tocFrac;
	return {
		water: finish(next),
		summary: `${molecule.name}. Adsorption ${Math.round(pestFrac * 100)} %. Un charbon saturé ou une autre molécule changerait le résultat.`
	};
}

function membrane(water: Water, settings: TrainSettings): { water: Water; summary: string } {
	const next = finish(cloneWater(water));
	const molecule = MOLECULES[settings.moleculeId];
	const needed = settings.membrane === 'uf' ? 1.5 : settings.membrane === 'nf' ? 6 : 10;
	const pressure = settings.membranePressure >= needed ? 1 : 0.15;
	const recoveryPenalty = settings.membraneRecovery > 92 ? 0.85 : 1;
	const cut = (fraction: number) => 1 - fraction * pressure * recoveryPenalty;
	if (settings.membrane === 'uf') {
		next.turbidityNtu *= cut(0.95);
		next.ironParticulateMgL *= cut(0.95);
		next.manganeseParticulateMgL *= cut(0.95);
		next.microbial *= cut(0.92);
	} else if (settings.membrane === 'nf') {
		next.turbidityNtu *= cut(0.92);
		next.microbial *= cut(0.9);
		next.hardnessF *= cut(0.5);
		next.calciumF *= cut(0.5);
		next.magnesiumF *= cut(0.5);
		next.nitrateMgL *= cut(0.48);
		next.pesticideUgL *= cut(molecule.nfRejection);
		next.tocMgL *= cut(0.28);
	} else {
		next.turbidityNtu *= cut(0.97);
		next.microbial *= cut(0.96);
		next.hardnessF *= cut(0.96);
		next.calciumF *= cut(0.96);
		next.magnesiumF *= cut(0.96);
		next.nitrateMgL *= cut(0.94);
		next.pesticideUgL *= cut(0.96);
		next.tocMgL *= cut(0.88);
		next.ironDissolvedMgL *= cut(0.9);
		next.manganeseDissolvedMgL *= cut(0.9);
	}
	const names = { uf: 'Ultrafiltration', nf: 'Nanofiltration', ro: 'Osmose inverse' };
	return {
		water: finish(next),
		summary: `${names[settings.membrane]} à ${settings.membranePressure} bar, récupération ${settings.membraneRecovery} %. L’ultrafiltration laisse passer le dissous. Le concentrât n’est pas une eau traitée.`
	};
}

function ozone(water: Water, settings: TrainSettings, ctx: Ctx): { water: Water; summary: string; reagent: ReagentUse } {
	const next = finish(cloneWater(water));
	const molecule = MOLECULES[settings.moleculeId];
	const ct = settings.ozoneDose * sat(settings.ozoneContactMin / 5) * (settings.ozoneTransfer / 100);
	const microCut = 0.95 * sat(ct / 0.7);
	next.microbial *= 1 - microCut;
	next.tocMgL *= 1 - 0.4 * sat(ct / 1.4);
	next.pesticideUgL *= 1 - molecule.ozoneability * 0.75 * sat(ct / 0.8);
	const feMoved = next.ironDissolvedMgL * 0.85 * sat(ct / 0.6);
	next.ironDissolvedMgL -= feMoved;
	next.ironParticulateMgL += feMoved;
	next.turbidityNtu += feMoved * 3;
	if (feMoved > 0.05) ctx.oxidized = true;
	const h2sRemoved = next.h2sMgL * 0.9 * sat(ct / 0.4);
	next.h2sMgL -= h2sRemoved;
	next.h2sOxidizedMgL += h2sRemoved;
	return {
		water: finish(next),
		summary: 'Ozone sans résiduel dans le réseau. La molécule de pesticide ne disparaît pas forcément.',
		reagent: { label: 'Ozone', detail: `${settings.ozoneDose} mg/L, transfert ${settings.ozoneTransfer} %` }
	};
}

function uv(water: Water, settings: TrainSettings): { water: Water; summary: string } {
	const next = finish(cloneWater(water));
	const delivered = settings.uvDose * (settings.uvFlow <= 30 ? 1 : clamp(30 / settings.uvFlow, 0.3, 1));
	const shield = 1 / (1 + Math.max(0, next.turbidityNtu - 0.8) * 1.1);
	const log = 2.4 * sat(delivered / 16) * shield;
	next.microbial *= 10 ** -log;
	return {
		water: finish(next),
		summary:
			shield < 0.6
				? 'La turbidité abrite une partie des micro-organismes. Pas de résiduel UV dans le réseau.'
				: 'Inactivation UV sans résiduel. Une eau claire laisse mieux passer le rayonnement.'
	};
}

function chlorine(water: Water, settings: TrainSettings): { water: Water; summary: string; reagent: ReagentUse } {
	const next = finish(cloneWater(water));
	const free = Math.max(0, (settings.chlorineDose - settings.chlorineDemand) * sat(settings.chlorineContactMin / 8));
	next.chlorineFreeMgL = free;
	const shield = 1 / (1 + Math.max(0, next.turbidityNtu - 1) * 0.55);
	const hocl = hoclFraction(next.ph, 15);
	const kill = sat((free * (0.25 + 0.75 * hocl) * settings.chlorineContactMin) / 8) * shield;
	next.microbial *= 1 - 0.98 * kill;
	return {
		water: finish(next),
		summary: `Chlore libre ${free.toFixed(2)} mg/L. Fraction HOCl ${Math.round(hocl * 100)} % à 15 °C. La turbidité ${shield < 0.7 ? 'limite' : 'laisse passer'} la désinfection.`,
		reagent: { label: 'Chlore désinfectant', detail: `dose ${settings.chlorineDose} mg/L, demande ${settings.chlorineDemand} mg/L` }
	};
}

export function stabilityOf(water: Water): { lsi: number; label: string } {
	const lsi = langelier({
		ph: water.ph,
		temperatureC: 15,
		calciumMgL: Math.max(water.calciumF, 0.2) * 4.008,
		alkalinityMgL: Math.max(water.alkalinityF, 0.2) * 10,
		tdsMgL: 220
	});
	const label =
		lsi < -0.3 ? 'plutôt agressive dans ce modèle' : lsi > 0.3 ? 'plutôt incrustante dans ce modèle' : 'proche de l’équilibre dans ce modèle';
	return { lsi, label };
}

const RUNNERS: Record<
	ModuleId,
	(water: Water, settings: TrainSettings, ctx: Ctx) => { water: Water; summary: string; reagent?: ReagentUse }
> = {
	screen: (water) => screen(water),
	aeration: (water, settings) => aeration(water, settings),
	neutralization: (water, settings) => neutralization(water, settings),
	oxidation: (water, settings, ctx) => oxidation(water, settings, ctx),
	coagulation: (water, settings, ctx) => coagulation(water, settings, ctx),
	settling: (water, settings, ctx) => settling(water, settings, ctx),
	filtration: (water, settings, ctx) => filtration(water, settings, ctx),
	remineralization: (water, settings) => remineralization(water, settings),
	softening: (water, settings) => softening(water, settings),
	nitrate: (water, settings) => nitrate(water, settings),
	carbon: (water, settings) => carbon(water, settings),
	membrane: (water, settings) => membrane(water, settings),
	ozone: (water, settings, ctx) => ozone(water, settings, ctx),
	uv: (water, settings) => uv(water, settings),
	chlorine: (water, settings) => chlorine(water, settings)
};

export function removalFraction(before: number, after: number): number {
	if (before <= 1e-9) return 0;
	return clamp((before - after) / before, -1, 1);
}

export function simulate(raw: Water, input: TrainSettings): Simulation {
	const { settings, issues } = sanitize(input);
	const cleaned = cleanWater(raw);
	issues.push(...cleaned.issues);
	const before = cloneWater(cleaned.water);
	let water = cloneWater(before);
	const ctx: Ctx = { floc: 0.08, oxidized: false };
	const steps: StepEffect[] = [];
	const reagents: ReagentUse[] = [];
	const profile: Simulation['profile'] = [{ id: 'raw', title: 'Eau brute', water: cloneWater(water) }];
	for (const id of MODULE_ORDER) {
		if (!settings.enabled[id]) {
			steps.push({ id, title: MODULES[id].title, enabled: false, summary: 'Étape en court-circuit.' });
			continue;
		}
		const ran = RUNNERS[id](water, settings, ctx);
		water = ran.water;
		if (ran.reagent) reagents.push(ran.reagent);
		steps.push({ id, title: MODULES[id].title, enabled: true, summary: ran.summary });
		profile.push({ id, title: MODULES[id].short, water: cloneWater(water) });
	}
	steps.push({
		id: 'control',
		title: 'Contrôle final',
		enabled: true,
		summary: 'Mesure de sortie. Cette étape ne transforme pas l’eau et ne conclut pas à la potabilité.'
	});
	profile.push({ id: 'control', title: 'Sortie', water: cloneWater(water) });
	const stab = stabilityOf(water);
	const reagentIndex = reagents.reduce((sum, item) => {
		const match = item.detail.match(/[\d]+(?:[.,]\d+)?/);
		return sum + (match ? Number(match[0].replace(',', '.')) : 0);
	}, 0);
	return {
		before,
		after: water,
		steps,
		profile,
		reagents,
		reagentIndex,
		issues,
		volumeM3: RUN_VOLUME_M3,
		lsi: stab.lsi,
		stability: stab.label
	};
}

export function moleculeOf(id: MoleculeId) {
	return MOLECULES[id];
}
