import type { CoagulantId } from './types';

/**
 * Modèles illustratifs pour un atelier pédagogique.
 * Ils ne reproduisent pas une loi de procédé et ne servent pas au dimensionnement.
 */

export type CoagulantSpec = {
	id: CoagulantId;
	name: string;
	formula: string;
	note: string;
	/** Dose illustrative (mg/L) ≈ doseK × √(turbidité NTU), au sommet de la courbe. */
	doseK: number;
	phCenter: number;
	phHalfWidth: number;
	/** Consommation d'alcalinité illustrative, mg/L CaCO₃ par mg/L de coagulant. */
	alkPerMg: number;
};

export const COAGULANTS: Record<CoagulantId, CoagulantSpec> = {
	alum: {
		id: 'alum',
		name: "Sulfate d’alumine",
		formula: 'Al₂(SO₄)₃',
		note: 'Dans ce modèle, la courbe est centrée près de pH 7 et la dose croît avec la turbidité.',
		doseK: 30 / Math.sqrt(80),
		phCenter: 7,
		phHalfWidth: 0.95,
		alkPerMg: 0.48
	},
	ferric: {
		id: 'ferric',
		name: 'Chlorure ferrique',
		formula: 'FeCl₃',
		note: 'Fenêtre de pH plus basse et consommation d’alcalinité marquée.',
		doseK: 2.45,
		phCenter: 6.15,
		phHalfWidth: 0.72,
		alkPerMg: 0.62
	},
	pac: {
		id: 'pac',
		name: 'Polychlorure d’aluminium',
		formula: 'PAC',
		note: 'Fenêtre de pH plus large et effet plus faible sur l’alcalinité.',
		doseK: 1.35,
		phCenter: 7.25,
		phHalfWidth: 1.3,
		alkPerMg: 0.2
	}
};

export function doseEfficiency(ratio: number): number {
	if (ratio <= 0) return 0;
	if (ratio <= 1) return Math.pow(ratio, 1.15);
	const over = ratio - 1;
	return Math.max(0.04, Math.exp(-(over * over) / 0.28));
}

export function phEfficiency(ph: number, center: number, halfWidth: number): number {
	const z = (ph - center) / halfWidth;
	return Math.exp(-0.5 * z * z);
}

export type CoagResult = {
	turbidityNtu: number;
	efficiency: number;
	flocIndex: number;
	flocLabel: string;
	phOut: number;
	phIn: number;
	alkalinityMgL: number;
	doseRatio: number;
};

export function coagulate(input: {
	turbidityNtu: number;
	phIn: number;
	alkalinityMgL: number;
	coagulant: CoagulantId;
	doseMgL: number;
	polymerMgL: number;
}): CoagResult {
	const spec = COAGULANTS[input.coagulant];
	const optimal = spec.doseK * Math.sqrt(Math.max(input.turbidityNtu, 1));
	const ratio = optimal <= 0 ? 0 : input.doseMgL / optimal;
	const doseEff = doseEfficiency(ratio);
	const phEff = phEfficiency(input.phIn, spec.phCenter, spec.phHalfWidth);
	const poly = Math.min(Math.max(input.polymerMgL, 0) / 0.3, 1);
	const polyHelp = doseEff > 0.25 ? 1 + 0.1 * poly : 1 + 0.04 * poly * doseEff;
	const efficiency = Math.min(0.97, 0.9 * doseEff * phEff * polyHelp);
	const turbidityNtu = Math.max(0.15, input.turbidityNtu * (1 - efficiency));
	const flocIndex = Math.min(1, doseEff * phEff * (polyHelp / 1.1));

	const alkConsumed = input.doseMgL * spec.alkPerMg;
	const alkalinityMgL = Math.max(6, input.alkalinityMgL - alkConsumed);
	const buffer = Math.max(22, input.alkalinityMgL);
	const phOut = clamp(input.phIn - (alkConsumed / buffer) * 1.35, 4.8, 10);

	return {
		turbidityNtu,
		efficiency,
		flocIndex,
		flocLabel: flocLabel(flocIndex, ratio, efficiency),
		phOut,
		phIn: input.phIn,
		alkalinityMgL,
		doseRatio: ratio
	};
}

function flocLabel(flocIndex: number, doseRatio: number, efficiency: number): string {
	if (doseRatio > 1.45 && efficiency < 0.55) return 'Flocs fragiles, eau à nouveau trouble';
	if (flocIndex < 0.22) return 'Flocs très fins, eau laiteuse';
	if (flocIndex < 0.45) return 'Petits flocs, sédimentation lente';
	if (flocIndex < 0.7) return 'Flocs en cours de formation';
	if (flocIndex < 0.88) return 'Flocs bien formés';
	return 'Gros flocs';
}

export function settle(input: {
	turbidityNtu: number;
	flowM3h: number;
	designFlowM3h: number;
	flocIndex: number;
	sludgePercent: number;
	purging: boolean;
}): { turbidityNtu: number; capture: number; hydraulic: number } {
	const overload = Math.max(0, input.flowM3h / input.designFlowM3h - 1);
	const hydraulic = Math.exp(-2.55 * overload);
	const sludgeFactor =
		input.sludgePercent < 58 ? 1 : Math.max(0.22, 1 - (input.sludgePercent - 58) / 55);
	const purgeFactor = input.purging ? 0.55 : 1;
	const floc = Math.pow(Math.max(input.flocIndex, 0), 0.72);
	const capture = clamp(0.9 * floc * hydraulic * sludgeFactor * purgeFactor, 0, 0.93);
	const turbidityNtu = Math.max(0.08, input.turbidityNtu * (1 - capture));
	return { turbidityNtu, capture, hydraulic };
}

export function filterWater(input: {
	turbidityNtu: number;
	flowM3h: number;
	designFlowM3h: number;
	headlossBar: number;
}): { turbidityNtu: number } {
	const overload = Math.max(0, input.flowM3h / input.designFlowM3h - 1);
	const hydraulic = Math.max(0.35, 1 - 0.85 * overload);
	const foul = clamp((input.headlossBar - 1.15) / 0.75, 0, 1);
	const solids = clamp((input.turbidityNtu - 6) / 40, 0, 0.55);
	const removal = clamp(0.975 * hydraulic * (1 - 0.78 * foul) * (1 - solids), 0.12, 0.99);
	const bleed = foul * 1.8;
	return { turbidityNtu: Math.max(0.05, input.turbidityNtu * (1 - removal) + bleed) };
}

export function filterCapacityM3h(headlossBar: number, hardMax: number, backwashing: boolean): number {
	const t = clamp((headlossBar - 0.55) / 1.45, 0, 1);
	const running = hardMax * (1 - 0.88 * t);
	return backwashing ? running * 0.3 : running;
}

export function headlossRateBarPerHour(input: {
	turbidityNtu: number;
	flowM3h: number;
	designFlowM3h: number;
}): number {
	const solids = Math.max(0.35, input.turbidityNtu);
	const flux = Math.pow(Math.max(input.flowM3h, 1) / input.designFlowM3h, 1.65);
	return 0.022 * (solids / 2.2) * flux;
}

export function sludgeRatePercentPerHour(input: {
	capturedNtu: number;
	flowM3h: number;
	designFlowM3h: number;
}): number {
	return Math.max(0, input.capturedNtu) * (input.flowM3h / input.designFlowM3h) * 0.11;
}

export function remineralize(input: {
	phIn: number;
	calciumMgL: number;
	alkalinityMgL: number;
	limeMgL: number;
	co2MgL: number;
	temperatureC: number;
	tdsMgL: number;
}): {
	ph: number;
	calciumMgL: number;
	alkalinityMgL: number;
	lsi: number;
	balance: 'agressive' | 'équilibre' | 'entartrante';
} {
	const limeMmol = Math.max(0, input.limeMgL) / 74.09;
	const co2Mmol = Math.max(0, input.co2MgL) / 44.01;
	const balanced = Math.min(limeMmol, co2Mmol / 2);
	const excessLime = Math.max(0, limeMmol - co2Mmol / 2);
	const excessCo2 = Math.max(0, co2Mmol - 2 * limeMmol);

	const calciumMgL = input.calciumMgL + limeMmol * 40.08;
	const alkGain = balanced * 100 + excessLime * 100;
	const alkalinityMgL = Math.max(5, input.alkalinityMgL + alkGain);

	const buffer = 1 + input.alkalinityMgL / 70;
	const ph = clamp(
		input.phIn + (excessLime * 16 - excessCo2 * 5.2 + balanced * 0.35) / buffer,
		5.1,
		10.4
	);
	const lsi = langelier({
		ph,
		temperatureC: input.temperatureC,
		calciumMgL,
		alkalinityMgL,
		tdsMgL: input.tdsMgL
	});
	const balance = lsi < -0.25 ? 'agressive' : lsi > 0.35 ? 'entartrante' : 'équilibre';
	return { ph, calciumMgL, alkalinityMgL, lsi, balance };
}

/** Indice de Langelier simplifié, à température et TDS du scénario. */
export function langelier(input: {
	ph: number;
	temperatureC: number;
	calciumMgL: number;
	alkalinityMgL: number;
	tdsMgL: number;
}): number {
	const calciumAsCaCO3 = Math.max(input.calciumMgL, 0.4) * (100 / 40.08);
	const A = (Math.log10(Math.max(input.tdsMgL, 20)) - 1) / 10;
	const B = -13.12 * Math.log10(input.temperatureC + 273) + 34.55;
	const C = Math.log10(calciumAsCaCO3) - 0.4;
	const D = Math.log10(Math.max(input.alkalinityMgL, 1));
	const pHs = 9.3 + A + B - C - D;
	return input.ph - pHs;
}

export function disinfect(input: {
	turbidityNtu: number;
	ph: number;
	flowM3h: number;
	doseMgL: number;
	contactVolumeM3: number;
	targetCt: number;
}): {
	residualMgL: number;
	contactMin: number;
	hocl: number;
	ct: number;
	demandMgL: number;
	sufficient: boolean;
} {
	const demandMgL = 0.1 + input.turbidityNtu * 0.04 + Math.max(0, 7.2 - input.ph) * 0.03;
	const residualMgL = Math.max(0, input.doseMgL - demandMgL);
	const contactMin = (input.contactVolumeM3 / Math.max(input.flowM3h, 12)) * 60;
	const hocl = 1 / (1 + 10 ** (input.ph - 7.53));
	const activity = 0.32 + 0.68 * hocl;
	const ct = residualMgL * contactMin * activity;
	const turbidityShield = input.turbidityNtu > 1.2;
	const sufficient = !turbidityShield && residualMgL >= 0.12 && ct >= input.targetCt;
	return { residualMgL, contactMin, hocl, ct, demandMgL, sufficient };
}

export function turbidityColor(ntu: number): string {
	const t = clamp(Math.log(1 + ntu) / Math.log(1 + 180), 0, 1);
	const clear = [126, 206, 214];
	const mid = [176, 164, 112];
	const mud = [128, 78, 46];
	const [a, b, k] = t < 0.42 ? [clear, mid, t / 0.42] : [mid, mud, (t - 0.42) / 0.58];
	const r = Math.round(a[0] + (b[0] - a[0]) * k);
	const g = Math.round(a[1] + (b[1] - a[1]) * k);
	const bl = Math.round(a[2] + (b[2] - a[2]) * k);
	return `rgb(${r} ${g} ${bl})`;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
