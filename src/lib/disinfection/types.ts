export type OrganismId = 'bacteria' | 'virus' | 'giardia' | 'crypto';

export type ProbeMode = 'calibrated' | 'drift' | 'inconsistent' | 'lost';

export type DataCategory = 'official' | 'educational_assumption' | 'regulatory_reference';

export type Settings = {
	doseMgL: number;
	ph: number;
	contactMin: number;
	temperatureC: number;
	demandMgL: number;
	combinedPotentialMgL: number;
	turbidityNtu: number;
	organic: number;
	bacteria: number;
	virus: number;
	giardia: number;
	crypto: number;
	filtrationAid: number;
	uvAid: boolean;
	ozoneAid: boolean;
	membraneAid: boolean;
	probeMode: ProbeMode;
	probeDriftMgL: number;
	useDpdAsReference: boolean;
};

export type ChlorineBalance = {
	injectedMgL: number;
	consumedMgL: number;
	combinedMgL: number;
	freeMgL: number;
	totalMgL: number;
	hoclFraction: number;
	oclFraction: number;
	pKa: number;
};

export type OrganismResult = {
	id: OrganismId;
	initial: number;
	remaining: number;
	log10Reduction: number;
	chlorineLimited: boolean;
};

export type AlertLevel = 'info' | 'watch' | 'fail';

export type Alert = {
	id: string;
	level: AlertLevel;
	title: string;
	text: string;
};

export type Evaluation = {
	settings: Settings;
	issues: string[];
	balance: ChlorineBalance;
	effectiveTurbidityNtu: number;
	kineticFactor: number;
	turbidityFactor: number;
	effectiveCt: number;
	organisms: OrganismResult[];
	byproductRisk: number;
	probeMgL: number | null;
	dpdMgL: number;
	probeReliable: boolean;
	exerciseOk: boolean;
	alerts: Alert[];
	explanations: string[];
};

export type Goal = {
	id: string;
	label: string;
	basis: 'educational_assumption' | 'regulatory_reference';
	ok: boolean;
	detail: string;
};

export type SafetyFlags = {
	evacuate: boolean;
	isolate: boolean;
	alert: boolean;
	approach: boolean;
	waterOnLeak: boolean;
};

export const UNITS = {
	doseMgL: 'mg/L',
	ph: 'unité pH',
	contactMin: 'min',
	temperatureC: '°C',
	demandMgL: 'mg/L',
	combinedPotentialMgL: 'mg/L',
	turbidityNtu: 'NTU',
	organic: 'indice 0–100',
	freeMgL: 'mg/L',
	combinedMgL: 'mg/L',
	totalMgL: 'mg/L',
	hoclFraction: 'fraction',
	byproductRisk: 'indice 0–100',
	effectiveCt: 'mg·min/L'
} as const;
