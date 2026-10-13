/**
 * Types du laboratoire de traitement.
 * Les unités sont affichées telles quelles. Les plages de réglage sont pédagogiques :
 * elles ne sont pas des consignes d’usine.
 */

export type ModuleId =
	| 'screen'
	| 'aeration'
	| 'neutralization'
	| 'oxidation'
	| 'coagulation'
	| 'settling'
	| 'filtration'
	| 'remineralization'
	| 'softening'
	| 'nitrate'
	| 'carbon'
	| 'membrane'
	| 'ozone'
	| 'uv'
	| 'chlorine';

export type ProblemId =
	| 'microbial'
	| 'turbidity'
	| 'iron'
	| 'manganese'
	| 'nitrate'
	| 'acid'
	| 'hardness'
	| 'h2s'
	| 'organic'
	| 'pesticide';

export type MoleculeId = 'cas' | 'faible';

export type MeasureStatus = 'measured' | 'simulated' | 'missing';

export type Water = {
	ph: number;
	turbidityNtu: number;
	ironDissolvedMgL: number;
	ironParticulateMgL: number;
	manganeseDissolvedMgL: number;
	manganeseParticulateMgL: number;
	nitrateMgL: number;
	hardnessF: number;
	calciumF: number;
	magnesiumF: number;
	alkalinityF: number;
	h2sMgL: number;
	h2sStrippedMgL: number;
	h2sOxidizedMgL: number;
	tocMgL: number;
	/** Indicateur pédagogique de 0 à 100. Ce n’est pas un dénombrement en UFC. */
	microbial: number;
	pesticideUgL: number;
	chlorineFreeMgL: number;
};

export type TrainSettings = {
	enabled: Record<ModuleId, boolean>;
	airIntensity: number;
	airContactMin: number;
	airFlow: number;
	neutralReagent: 'lime' | 'soda' | 'calcite';
	neutralDose: number;
	neutralTargetPh: number;
	oxidant: 'chlorine' | 'permanganate' | 'ozone';
	oxidantDose: number;
	oxidantContactMin: number;
	coagulant: 'alum' | 'ferric';
	coagulantDose: number;
	coagMix: number;
	coagContactMin: number;
	settlingMin: number;
	filterMedia: 'sand' | 'manganese' | 'dual' | 'bio';
	filterRate: number;
	filterState: number;
	reminMedia: 'calcite' | 'lime-co2';
	reminContactMin: number;
	reminLime: number;
	reminCo2: number;
	softenerCapacity: number;
	nitrateTech: 'biological' | 'resin';
	nitrateRate: number;
	nitrateCapacity: number;
	carbonType: 'gac' | 'pac';
	carbonContactMin: number;
	carbonSaturation: number;
	moleculeId: MoleculeId;
	membrane: 'uf' | 'nf' | 'ro';
	membranePressure: number;
	membraneRecovery: number;
	ozoneDose: number;
	ozoneContactMin: number;
	ozoneTransfer: number;
	uvDose: number;
	uvFlow: number;
	chlorineDose: number;
	chlorineDemand: number;
	chlorineContactMin: number;
	sourceInvestigated: boolean;
};

export type AnalysisRow = {
	id: string;
	label: string;
	unit: string;
	status: MeasureStatus;
	value: number | null;
	digits: number;
};

export type StudyCase = {
	id: string;
	kicker: string;
	title: string;
	origin: string;
	symptoms: string;
	water: Water;
	rows: AnalysisRow[];
	goals: string[];
	unknowns: string[];
	problems: ProblemId[];
	hints: [string, string, string];
	moleculeId: MoleculeId;
	focus: string[];
};

export const MODULE_ORDER: ModuleId[] = [
	'screen',
	'aeration',
	'neutralization',
	'oxidation',
	'coagulation',
	'settling',
	'filtration',
	'remineralization',
	'softening',
	'nitrate',
	'carbon',
	'membrane',
	'ozone',
	'uv',
	'chlorine'
];

export const PROBLEMS: { id: ProblemId; label: string }[] = [
	{ id: 'microbial', label: 'Contamination microbiologique' },
	{ id: 'turbidity', label: 'Turbidité excessive' },
	{ id: 'iron', label: 'Présence de fer' },
	{ id: 'manganese', label: 'Présence de manganèse' },
	{ id: 'nitrate', label: 'Teneur excessive en nitrates' },
	{ id: 'acid', label: 'Eau trop acide' },
	{ id: 'hardness', label: 'Eau trop dure' },
	{ id: 'h2s', label: 'Présence de H₂S' },
	{ id: 'organic', label: 'Matières organiques excessives' },
	{ id: 'pesticide', label: 'Présence de pesticides' }
];
