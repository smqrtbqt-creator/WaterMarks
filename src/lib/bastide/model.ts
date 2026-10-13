import { clamp, doseEfficiency, phEfficiency, remineralize } from '../sim/chemistry';
import { factNumber } from './catalog';
import { STAGES, type Accumulators, type Evaluation, type MissionResult, type Scenario, type Settings, type StageId, type StageResult, type Status, type Water } from './types';

/**
 * Moteur pédagogique de la filière de La Bastide.
 * Il est déterministe et indépendant de l’interface.
 * Ce n’est pas un outil de dimensionnement ni de conduite industrielle.
 * Les doses ne sont pas des consignes du site.
 */

const tankUnitM3 = factNumber('tank-unit-m3');
const tankCount = factNumber('tank-count');
const nominalM3h = factNumber('production-mean-m3h');
const ferricDoseK = factNumber('ferric-dose-k');
const ferricPhCenter = factNumber('ferric-ph-center');
const ferricPhHalfWidth = factNumber('ferric-ph-half-width');
const limePhPerMg = factNumber('lime-ph-per-mg');
const ferricPhDropPerMg = factNumber('ferric-ph-drop-per-mg');
const polyamineUseful = factNumber('polyamine-useful-mg-l');
const sodaPhPerMg = factNumber('soda-ph-per-mg');
const chlorineDecay = factNumber('chlorine-decay-per-hour');
const chlorineLow = factNumber('chlorine-band-low');
const chlorineHigh = factNumber('chlorine-band-high');
const turbLimit = factNumber('turb-limit-nfu');
const phMin = factNumber('ph-min');
const phMax = factNumber('ph-max');
const microbialGoal = factNumber('microbial-goal');
const tasteGoal = factNumber('taste-goal');
const sparingMax = factNumber('sparing-dose-max');
const storageRatioMin = factNumber('storage-ratio-min');

export const TANK_UNIT_M3 = tankUnitM3;
export const TANK_COUNT = tankCount;
export const NOMINAL_CAPACITY_M3 = tankUnitM3 * tankCount;

const titles = Object.fromEntries(STAGES.map((stage) => [stage.id, stage.title])) as Record<StageId, string>;

function mix(left: number, right: number, shareRight: number): number {
	return left * (1 - shareRight) + right * shareRight;
}

function bound(water: Water): Water {
	return {
		flowM3h: clamp(water.flowM3h, 0, 5000),
		turbidityNtu: clamp(water.turbidityNtu, 0, 5000),
		ph: clamp(water.ph, 0, 14),
		temperatureC: clamp(water.temperatureC, 0, 40),
		ssMgL: clamp(water.ssMgL, 0, 5000),
		organic: clamp(water.organic, 0, 100),
		microbial: clamp(water.microbial, 0, 100),
		chlorineMgL: clamp(water.chlorineMgL, 0, 10),
		taste: clamp(water.taste, 0, 100),
		color: clamp(water.color, 0, 100),
		debris: clamp(water.debris, 0, 100),
		floc: clamp(water.floc, 0, 1),
		confidence: clamp(water.confidence, 0.15, 0.8),
		calciumMgL: clamp(water.calciumMgL, 0, 500),
		alkalinityMgL: clamp(water.alkalinityMgL, 1, 500),
		tdsMgL: clamp(water.tdsMgL, 10, 2000)
	};
}

export function sanitizeSettings(settings: Settings): Settings {
	return {
		vienneSharePct: clamp(settings.vienneSharePct ?? 0, 0, 100),
		intakeFlowM3h: clamp(settings.intakeFlowM3h ?? 0, 0, 4000),
		rawTurbidityAddNtu: clamp(settings.rawTurbidityAddNtu ?? 0, 0, 200),
		rawTempOffsetC: clamp(settings.rawTempOffsetC ?? 0, -12, 12),
		rawPhOffset: clamp(settings.rawPhOffset ?? 0, -2, 2),
		rawOrganicAdd: clamp(settings.rawOrganicAdd ?? 0, 0, 80),
		screenOpenPct: clamp(settings.screenOpenPct ?? 0, 0, 100),
		ferricMgL: clamp(settings.ferricMgL ?? 0, 0, 80),
		limeCoagMgL: clamp(settings.limeCoagMgL ?? 0, 0, 80),
		polyamineMgL: clamp(settings.polyamineMgL ?? 0, 0, 4),
		settlingHours: clamp(settings.settlingHours ?? 0, 0.1, 8),
		plantFlowM3h: clamp(settings.plantFlowM3h ?? 0, 0, 4000),
		sandFlowM3h: clamp(settings.sandFlowM3h ?? 0, 0, 4000),
		ozoneMgL: clamp(settings.ozoneMgL ?? 0, 0, 8),
		ozoneContactMin: clamp(settings.ozoneContactMin ?? 0, 0, 40),
		uvIntensityPct: clamp(settings.uvIntensityPct ?? 0, 0, 100),
		lampPct: clamp(settings.lampPct ?? 0, 0, 100),
		reminLimeMgL: clamp(settings.reminLimeMgL ?? 0, 0, 160),
		reminCo2MgL: clamp(settings.reminCo2MgL ?? 0, 0, 160),
		sodaMgL: clamp(settings.sodaMgL ?? 0, 0, 60),
		chlorineMgL: clamp(settings.chlorineMgL ?? 0, 0, 5),
		demandM3h: clamp(settings.demandM3h ?? 0, 0, 4000),
		tanksOnline: settings.tanksOnline === 1 ? 1 : 2,
		preOzone: Boolean(settings.preOzone),
		pacMgL: clamp(settings.pacMgL ?? 0, 0, 60)
	};
}

export function optimalFerricMgL(turbidityNtu: number): number {
	return ferricDoseK * Math.sqrt(Math.max(turbidityNtu, 0.4));
}

export function reagentScore(settings: Settings): number {
	const safe = sanitizeSettings(settings);
	return (
		safe.ferricMgL +
		safe.limeCoagMgL * 0.4 +
		safe.polyamineMgL * 8 +
		safe.ozoneMgL * 6 +
		safe.pacMgL * 1.5 +
		safe.reminLimeMgL * 0.3 +
		safe.reminCo2MgL * 0.2 +
		safe.sodaMgL * 0.4 +
		safe.chlorineMgL * 4
	);
}

export function blendRaw(scenario: Scenario, settings: Settings): Water {
	const safe = sanitizeSettings(settings);
	const share = safe.vienneSharePct / 100;
	const left = scenario.ambazac;
	const right = scenario.vienne;
	const flow = Math.min(safe.intakeFlowM3h, safe.plantFlowM3h, safe.sandFlowM3h);
	return bound({
		flowM3h: flow,
		turbidityNtu: mix(left.turbidityNtu, right.turbidityNtu, share) + safe.rawTurbidityAddNtu,
		ph: mix(left.ph, right.ph, share) + safe.rawPhOffset,
		temperatureC: mix(left.temperatureC, right.temperatureC, share) + safe.rawTempOffsetC,
		ssMgL: mix(left.ssMgL, right.ssMgL, share) + safe.rawTurbidityAddNtu * 0.45,
		organic: mix(left.organic, right.organic, share) + safe.rawOrganicAdd,
		microbial: mix(left.microbial, right.microbial, share),
		taste: mix(left.taste, right.taste, share) + safe.rawOrganicAdd * 0.35,
		color: mix(left.color, right.color, share) + safe.rawOrganicAdd * 0.25,
		debris: mix(left.debris, right.debris, share),
		chlorineMgL: 0,
		floc: 0,
		confidence: 0.58,
		calciumMgL: mix(left.calciumMgL, right.calciumMgL, share),
		alkalinityMgL: mix(left.alkalinityMgL, right.alkalinityMgL, share),
		tdsMgL: mix(left.tdsMgL, right.tdsMgL, share)
	});
}

export function applyScreen(water: Water, screenOpenPct: number): Water {
	const open = clamp(screenOpenPct, 0, 100) / 100;
	return bound({
		...water,
		debris: water.debris * (1 - 0.9 * open),
		turbidityNtu: water.turbidityNtu * (1 - 0.035 * open),
		ssMgL: water.ssMgL * (1 - 0.14 * open),
		confidence: water.confidence - 0.01
	});
}

export function applyEmergency(water: Water, preOzone: boolean, pacMgL: number): Water {
	let next = { ...water };
	if (preOzone) {
		next = {
			...next,
			organic: next.organic * 0.78,
			microbial: next.microbial * 0.7,
			taste: next.taste * 0.9,
			color: next.color * 0.88,
			confidence: next.confidence - 0.02
		};
	}
	const pac = Math.max(0, pacMgL);
	if (pac > 0) {
		const effect = 1 - Math.exp(-pac / 14);
		next = {
			...next,
			organic: next.organic * (1 - 0.7 * effect),
			taste: next.taste * (1 - 0.6 * effect),
			color: next.color * (1 - 0.5 * effect),
			ssMgL: next.ssMgL + pac * 0.28,
			turbidityNtu: next.turbidityNtu + pac * 0.05,
			confidence: next.confidence - 0.02
		};
	}
	return bound(next);
}

export function applyCoagulation(
	water: Water,
	ferricMgL: number,
	limeCoagMgL: number,
	polyamineMgL: number
): Water {
	const optimal = optimalFerricMgL(water.turbidityNtu);
	const ratio = ferricMgL / Math.max(optimal, 0.2);
	const doseEff = doseEfficiency(ratio);
	const ph = clamp(water.ph + limeCoagMgL * limePhPerMg - ferricMgL * ferricPhDropPerMg, 4.5, 10.5);
	const phEff = phEfficiency(ph, ferricPhCenter, ferricPhHalfWidth);
	const poly = polyamineMgL / Math.max(polyamineUseful, 0.05);
	let polyHelp = 0.78 + 0.22 * clamp(poly, 0, 1);
	if (poly > 1.8) polyHelp *= 0.82;
	if (doseEff < 0.2) polyHelp = 0.78 + (polyHelp - 0.78) * 0.35;
	const removal = Math.min(0.93, 0.9 * doseEff * phEff * polyHelp);
	const floc = clamp(doseEff * phEff, 0, 1);
	return bound({
		...water,
		ph,
		turbidityNtu: water.turbidityNtu * (1 - removal),
		ssMgL: water.ssMgL * (1 - removal * 0.92),
		organic: water.organic * (1 - 0.08 * removal),
		alkalinityMgL: Math.max(5, water.alkalinityMgL - ferricMgL * 0.55 + limeCoagMgL * 0.7),
		floc,
		confidence: water.confidence - 0.015
	});
}

export function applySettling(water: Water, settlingHours: number): Water {
	const hydraulic = water.flowM3h / nominalM3h;
	const effectiveHours = settlingHours / Math.max(hydraulic, 0.35);
	const residenceScore = clamp(effectiveHours / 1.5, 0, 1);
	const flocScore = Math.pow(clamp(water.floc, 0, 1), 0.8);
	const overload = Math.max(0, hydraulic - 1.1);
	const cold = clamp((12 - water.temperatureC) / 20, 0, 0.4);
	const capture = clamp(
		0.95 * flocScore * (0.25 + 0.75 * residenceScore) * Math.exp(-1.4 * overload) * (1 - 0.3 * cold),
		0,
		0.96
	);
	return bound({
		...water,
		turbidityNtu: water.turbidityNtu * (1 - capture),
		ssMgL: water.ssMgL * (1 - capture * 0.95),
		confidence: water.confidence - 0.01
	});
}

export function applySand(water: Water, sandState: number): Water {
	const clog = clamp(sandState, 0, 100) / 100;
	const rate = water.flowM3h / nominalM3h;
	const foul = clamp((clog - 0.25) / 0.55, 0, 1);
	const fast = clamp((rate - 1) / 0.7, 0, 1);
	const removal = clamp(0.985 - foul * 0.62 - fast * 0.4, 0.2, 0.99);
	const bleed = foul * 1.7 + fast * 0.35;
	return bound({
		...water,
		turbidityNtu: water.turbidityNtu * (1 - removal) + bleed,
		ssMgL: water.ssMgL * (1 - removal) + bleed * 0.8,
		microbial: water.microbial * 0.94,
		confidence: water.confidence - 0.01
	});
}

export function applyOzone(water: Water, ozoneMgL: number, contactMin: number): Water {
	const ct = Math.max(0, ozoneMgL) * Math.max(0, contactMin);
	const need = 7 + water.organic * 0.11 + water.microbial * 0.015;
	const kill = clamp(ct / Math.max(need, 1), 0, 1.4);
	const effect = 1 - Math.exp(-1.8 * kill);
	return bound({
		...water,
		microbial: water.microbial * (1 - 0.93 * effect),
		organic: water.organic * (1 - 0.32 * effect),
		taste: water.taste * (1 - 0.12 * effect),
		turbidityNtu: water.turbidityNtu * (1 - 0.01 * effect),
		confidence: water.confidence - 0.015
	});
}

export function applyCarbon(water: Water, carbonState: number): Water {
	const activity = 1 - clamp(carbonState, 0, 100) / 100;
	const tasteDrop = Math.min(water.taste * 0.82 * activity, 28 * activity);
	const colorDrop = Math.min(water.color * 0.78 * activity, 26 * activity);
	const organicDrop = Math.min(water.organic * 0.45 * activity, 22 * activity);
	return bound({
		...water,
		taste: water.taste - tasteDrop,
		color: water.color - colorDrop,
		organic: water.organic - organicDrop,
		turbidityNtu: water.turbidityNtu * (1 - 0.02 * activity),
		confidence: water.confidence - 0.01
	});
}

export function applyUv(water: Water, intensityPct: number, lampPct: number): Water {
	const shield = water.turbidityNtu <= 1 ? 0 : clamp((water.turbidityNtu - 1) / 8, 0, 0.92);
	const hydraulic = clamp(900 / Math.max(water.flowM3h, 80), 0.35, 1.3);
	const dose = (clamp(intensityPct, 0, 100) / 100) * (clamp(lampPct, 0, 100) / 100) * hydraulic;
	const effect = clamp(dose, 0, 1) * (1 - shield);
	return bound({
		...water,
		microbial: water.microbial * (1 - 0.97 * effect),
		confidence: water.confidence - (shield > 0.4 ? 0.03 : 0.01)
	});
}

export function applyRemineralization(water: Water, limeMgL: number, co2MgL: number): Water & { lsi: number } {
	const result = remineralize({
		phIn: water.ph,
		calciumMgL: water.calciumMgL,
		alkalinityMgL: water.alkalinityMgL,
		limeMgL,
		co2MgL,
		temperatureC: water.temperatureC,
		tdsMgL: water.tdsMgL
	});
	const next = bound({
		...water,
		ph: result.ph,
		calciumMgL: result.calciumMgL,
		alkalinityMgL: result.alkalinityMgL,
		confidence: water.confidence - 0.01
	});
	return { ...next, lsi: result.lsi };
}

export function applyFinish(water: Water, sodaMgL: number, chlorineMgL: number): Water {
	const ph = clamp(water.ph + sodaMgL * sodaPhPerMg, 4.5, 10.8);
	const demand = 0.05 + water.turbidityNtu * 0.025 + water.organic * 0.0025 + water.microbial * 0.0008;
	const residual = Math.max(0, chlorineMgL - demand);
	const kill = clamp(residual / 0.35, 0, 1) * 0.35;
	return bound({
		...water,
		ph,
		chlorineMgL: residual,
		microbial: water.microbial * (1 - kill),
		confidence: water.confidence - 0.015
	});
}

export function networkChlorine(residualMgL: number, organic: number, tankM3: number, demandM3h: number): number {
	const residenceH = Math.max(0, tankM3) / Math.max(demandM3h, 40);
	const k = chlorineDecay + clamp(organic, 0, 100) * 0.0007;
	return Math.max(0, residualMgL) * Math.exp(-Math.min(k * residenceH, 6));
}

function statusOf(fail: boolean, watch: boolean): Status {
	if (fail) return 'fail';
	if (watch) return 'watch';
	return 'ok';
}

function stage(id: StageId, before: Water, after: Water, status: Status, note: string): StageResult {
	return { id, title: titles[id], before, after, status, note };
}

function missionDetail(id: string, evaluation: Omit<Evaluation, 'missions'>): { ok: boolean; detail: string } {
	const out = evaluation.outlet;
	if (id === 'turb-limit') {
		const ok = out.turbidityNtu <= turbLimit;
		return {
			ok,
			detail: `Turbidité simulée ${out.turbidityNtu.toFixed(2)} NTU. Limite citée : ${turbLimit.toFixed(1)} NFU au point de mise en distribution, dans le champ de l’arrêté. Comparaison pédagogique, pas un contrôle de La Bastide. Référence de 0,50 NFU rappelée à titre indicatif.`
		};
	}
	if (id === 'ph-band') {
		const ok = out.ph >= phMin && out.ph <= phMax;
		return {
			ok,
			detail: `pH simulé ${out.ph.toFixed(2)}. Référence citée : ${phMin.toFixed(1)} à ${phMax.toFixed(1)}. La pratique de 8,2 à la soude n’est pas la condition de réussite.`
		};
	}
	if (id === 'chlorine-band') {
		const value = evaluation.networkChlorineMgL;
		const ok = value >= chlorineLow && value <= chlorineHigh;
		return {
			ok,
			detail: `Chlore après séjour ${value.toFixed(2)} mg/L. Bande pédagogique ${chlorineLow.toFixed(2)} à ${chlorineHigh.toFixed(2)} mg/L, pas une limite réglementaire. À la chloration : ${evaluation.chlorineAtDosingMgL.toFixed(2)} mg/L.`
		};
	}
	if (id === 'microbial') {
		const ok = out.microbial <= microbialGoal;
		return {
			ok,
			detail: `Risque simulé ${out.microbial.toFixed(1)} / 100. Objectif pédagogique : ${microbialGoal}. Ce n’est pas un dénombrement.`
		};
	}
	if (id === 'storage') {
		const ok = evaluation.tankRatio >= storageRatioMin;
		return {
			ok,
			detail: `Remplissage ${(evaluation.tankRatio * 100).toFixed(0)} % de ${evaluation.tankCapacityM3.toFixed(0)} m³ en service. Plancher pédagogique : ${(storageRatioMin * 100).toFixed(0)} %.`
		};
	}
	if (id === 'taste') {
		const ok = out.taste <= tasteGoal;
		return {
			ok,
			detail: `Indice de goût ${out.taste.toFixed(0)} / 100. Objectif pédagogique : ${tasteGoal}. Le charbon seul plafonne sur une pollution forte.`
		};
	}
	if (id === 'sparing') {
		const ok = evaluation.reagentScore <= sparingMax;
		return {
			ok,
			detail: `Indice pédagogique de réactifs ${evaluation.reagentScore.toFixed(0)} (plafond ${sparingMax}). Ce n’est ni un coût, ni un bilan de La Bastide.`
		};
	}
	throw new Error(`Mission inconnue : ${id}`);
}

export function evaluate(scenario: Scenario, settings: Settings, acc: Accumulators): Evaluation {
	const safe = sanitizeSettings(settings);
	const sandState = clamp(acc.sandState ?? 0, 0, 100);
	const carbonState = clamp(acc.carbonState ?? 0, 0, 100);
	const capacity = tankUnitM3 * safe.tanksOnline;
	const volume = clamp(Math.min(acc.tankM3 ?? 0, capacity), 0, capacity);
	const raw = blendRaw(scenario, safe);
	const screened = applyScreen(raw, safe.screenOpenPct);
	const emergency = applyEmergency(screened, safe.preOzone, safe.pacMgL);
	const coagulated = applyCoagulation(emergency, safe.ferricMgL, safe.limeCoagMgL, safe.polyamineMgL);
	const settled = applySettling(coagulated, safe.settlingHours);
	const filtered = applySand(settled, sandState);
	const ozonated = applyOzone(filtered, safe.ozoneMgL, safe.ozoneContactMin);
	const polished = applyCarbon(ozonated, carbonState);
	const irradiated = applyUv(polished, safe.uvIntensityPct, safe.lampPct);
	const remin = applyRemineralization(irradiated, safe.reminLimeMgL, safe.reminCo2MgL);
	const finished = applyFinish(remin, safe.sodaMgL, safe.chlorineMgL);
	const network = networkChlorine(finished.chlorineMgL, finished.organic, volume, safe.demandM3h);
	const stored = bound({ ...finished, chlorineMgL: network });
	const hydraulic = finished.flowM3h / nominalM3h;
	const optimal = optimalFerricMgL(emergency.turbidityNtu);
	const coagRemoval =
		emergency.turbidityNtu <= 0.05 ? 1 : 1 - coagulated.turbidityNtu / emergency.turbidityNtu;
	const ozoneDrop =
		filtered.microbial <= 0.05 ? 1 : 1 - ozonated.microbial / filtered.microbial;
	const uvShield = polished.turbidityNtu <= 1 ? 0 : clamp((polished.turbidityNtu - 1) / 8, 0, 0.92);

	const stages: StageResult[] = [
		stage(
			'intake',
			raw,
			raw,
			statusOf(raw.flowM3h < 80, raw.turbidityNtu > 40),
			safe.intakeFlowM3h > raw.flowM3h + 1
				? `Débit traité ${raw.flowM3h.toFixed(0)} m³/h. Le captage est plus haut : l’excédent n’entre pas dans cette filière.`
				: `Eau mélangée, part de Vienne ${safe.vienneSharePct.toFixed(0)} %. Débit traité ${raw.flowM3h.toFixed(0)} m³/h.`
		),
		stage(
			'screen',
			raw,
			screened,
			statusOf(screened.debris > 40, screened.debris > 18),
			`Matières grossières ${screened.debris.toFixed(0)} / 100. La turbidité ne passe que de ${raw.turbidityNtu.toFixed(1)} à ${screened.turbidityNtu.toFixed(1)} NTU.`
		),
		stage(
			'coagulation',
			screened,
			coagulated,
			statusOf(coagRemoval < 0.35, coagRemoval < 0.6),
			`${
				safe.preOzone || safe.pacMgL > 0
					? `Urgence pédagogique : ${safe.preOzone ? 'pré-ozone' : ''}${safe.preOzone && safe.pacMgL > 0 ? ' et ' : ''}${safe.pacMgL > 0 ? `${safe.pacMgL.toFixed(0)} mg/L de charbon en poudre` : ''}. `
					: ''
			}Retrait de turbidité ${(coagRemoval * 100).toFixed(0)} % après cette étape. Repère illustratif ${optimal.toFixed(1)} mg/L de FeCl₃, pas une consigne de La Bastide. Flocs ${coagulated.floc.toFixed(2)}.`
		),
		stage(
			'settling',
			coagulated,
			settled,
			statusOf(settled.turbidityNtu > 8, settled.turbidityNtu > 3),
			`Turbidité décantée ${settled.turbidityNtu.toFixed(1)} NTU. Charge ${hydraulic.toFixed(2)} fois le débit moyen calculé de ${nominalM3h.toFixed(0)} m³/h.`
		),
		stage(
			'sand',
			settled,
			filtered,
			statusOf(filtered.turbidityNtu > 2, filtered.turbidityNtu > 0.8),
			`Turbidité filtrée ${filtered.turbidityNtu.toFixed(2)} NTU. État du filtre ${sandState.toFixed(0)} / 100. Le lavage n’a pas de fréquence réelle dans ce modèle.`
		),
		stage(
			'ozone',
			filtered,
			ozonated,
			statusOf(filtered.microbial > 20 && ozoneDrop < 0.4, filtered.microbial > 12 && ozoneDrop < 0.7),
			`Risque ${filtered.microbial.toFixed(0)} → ${ozonated.microbial.toFixed(0)}. La turbidité reste ${ozonated.turbidityNtu.toFixed(2)} NTU.`
		),
		stage(
			'carbon',
			ozonated,
			polished,
			statusOf(polished.taste > 45, polished.taste > tasteGoal),
			`Goût ${ozonated.taste.toFixed(0)} → ${polished.taste.toFixed(0)}. Saturation du charbon ${carbonState.toFixed(0)} / 100.`
		),
		stage(
			'uv',
			polished,
			irradiated,
			statusOf(
				polished.microbial > 10 && irradiated.microbial > 15,
				uvShield > 0.45 || (polished.microbial > 8 && irradiated.microbial > 8)
			),
			uvShield > 0.3
				? `Eau encore trouble (${polished.turbidityNtu.toFixed(1)} NTU) : les UV sont freinés. Risque ${irradiated.microbial.toFixed(1)}.`
				: `Risque ${polished.microbial.toFixed(1)} → ${irradiated.microbial.toFixed(1)}. Les UV ne changent pas la turbidité.`
		),
		stage(
			'remineralization',
			irradiated,
			remin,
			statusOf(remin.ph < 5.8 || remin.ph > 9.4, remin.ph < phMin || remin.ph > phMax),
			`pH ${irradiated.ph.toFixed(2)} → ${remin.ph.toFixed(2)}. Calcium ${remin.calciumMgL.toFixed(0)} mg/L. Indice de Langelier pédagogique ${remin.lsi.toFixed(2)}.`
		),
		stage(
			'finish',
			remin,
			finished,
			statusOf(
				finished.ph < phMin || finished.ph > phMax,
				finished.chlorineMgL < 0.05 || finished.chlorineMgL > 0.8
			),
			`pH ${finished.ph.toFixed(2)}. Chlore à la chloration ${finished.chlorineMgL.toFixed(2)} mg/L. Repère cité du rapport : 8,2, sans être une cible imposée.`
		),
		stage(
			'storage',
			finished,
			stored,
			statusOf(volume / capacity < 0.15, network < chlorineLow || volume / capacity < storageRatioMin),
			`Volume ${volume.toFixed(0)} m³ sur ${capacity.toFixed(0)} m³. Chlore après séjour ${network.toFixed(2)} mg/L. Deux cuves de ${tankUnitM3.toFixed(0)} m³ font ${NOMINAL_CAPACITY_M3.toFixed(0)} m³.`
		)
	];

	const score = reagentScore(safe);
	const partial = {
		stages,
		productionM3h: finished.flowM3h,
		demandM3h: safe.demandM3h,
		tankM3: volume,
		tankCapacityM3: capacity,
		tankUnitM3,
		tankRatio: volume / capacity,
		networkChlorineMgL: network,
		chlorineAtDosingMgL: finished.chlorineMgL,
		reagentScore: score,
		reagentGh: score * finished.flowM3h,
		hydraulicLoad: hydraulic,
		optimalFerricMgL: optimal,
		outlet: stored
	};
	const missions: MissionResult[] = scenario.missions.map((mission) => {
		const result = missionDetail(mission.id, partial);
		return { ...mission, ...result };
	});
	return { ...partial, missions };
}

export function step(evaluation: Evaluation, acc: Accumulators, dtHours: number): Accumulators {
	const dt = Math.max(0, dtHours);
	const tank = clamp(acc.tankM3 + (evaluation.productionM3h - evaluation.demandM3h) * dt, 0, evaluation.tankCapacityM3);
	const sandIn = evaluation.stages.find((item) => item.id === 'sand')?.before.turbidityNtu ?? 1;
	const organic = evaluation.stages.find((item) => item.id === 'carbon')?.before.organic ?? 20;
	const sand = acc.sandState + evaluation.productionM3h * dt * 0.0035 * (1 + sandIn / 50);
	const carbon = acc.carbonState + evaluation.productionM3h * dt * 0.0012 * (organic / 50);
	return {
		hours: acc.hours + dt,
		tankM3: tank,
		sandState: clamp(sand, 0, 100),
		carbonState: clamp(carbon, 0, 100)
	};
}

export function waterIsPhysical(water: Water): boolean {
	const fields = Object.values(water);
	return fields.every((value) => typeof value === 'number' && Number.isFinite(value));
}
