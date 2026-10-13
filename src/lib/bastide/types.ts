export const STAGES = [
	{ id: 'intake', index: '01', title: 'Captage', duty: 'Eau brute' },
	{ id: 'screen', index: '02', title: 'Dégrillage', duty: 'Gros débris' },
	{ id: 'coagulation', index: '03', title: 'Coagulation', duty: 'Formation des flocs' },
	{ id: 'settling', index: '04', title: 'Décantation', duty: 'Dépôt des flocs' },
	{ id: 'sand', index: '05', title: 'Filtration', duty: 'Sable' },
	{ id: 'ozone', index: '06', title: 'Ozonation', duty: 'Ozone' },
	{ id: 'carbon', index: '07', title: 'Charbon actif', duty: 'Goût et odeur' },
	{ id: 'uv', index: '08', title: 'Désinfection UV', duty: 'Rayonnement' },
	{ id: 'remineralization', index: '09', title: 'Reminéralisation', duty: 'Chaux et CO₂' },
	{ id: 'finish', index: '10', title: 'Finition', duty: 'Soude et chlore' },
	{ id: 'storage', index: '11', title: 'Château d’eau', duty: 'Stockage' }
] as const;

export type StageId = (typeof STAGES)[number]['id'];

export type DataCategory = 'official' | 'educational_assumption' | 'regulatory_reference';

export type Fact = {
	id: string;
	value: number | string;
	unit: string | null;
	category: DataCategory;
	description: string;
	source: string;
	context: string;
};

export type SourceWater = {
	turbidityNtu: number;
	ph: number;
	temperatureC: number;
	ssMgL: number;
	organic: number;
	microbial: number;
	taste: number;
	color: number;
	debris: number;
	calciumMgL: number;
	alkalinityMgL: number;
	tdsMgL: number;
};

export type Settings = {
	vienneSharePct: number;
	intakeFlowM3h: number;
	rawTurbidityAddNtu: number;
	rawTempOffsetC: number;
	rawPhOffset: number;
	rawOrganicAdd: number;
	screenOpenPct: number;
	ferricMgL: number;
	limeCoagMgL: number;
	polyamineMgL: number;
	settlingHours: number;
	plantFlowM3h: number;
	sandFlowM3h: number;
	ozoneMgL: number;
	ozoneContactMin: number;
	uvIntensityPct: number;
	lampPct: number;
	reminLimeMgL: number;
	reminCo2MgL: number;
	sodaMgL: number;
	chlorineMgL: number;
	demandM3h: number;
	tanksOnline: number;
	preOzone: boolean;
	pacMgL: number;
};

export type Accumulators = {
	hours: number;
	tankM3: number;
	sandState: number;
	carbonState: number;
};

export type MissionSpec = {
	id: string;
	label: string;
	basis: 'regulatory_reference' | 'educational_assumption';
	hint: string;
};

export type Scenario = {
	id: string;
	kicker: string;
	title: string;
	summary: string;
	focus: StageId;
	ambazac: SourceWater;
	vienne: SourceWater;
	initialSettings: Settings;
	initialAccumulators: Accumulators;
	missions: MissionSpec[];
};

export type Lesson = {
	objective: string;
	phenomenon: string;
	parameters: string;
	low: string;
	adapted: string;
	high: string;
	indicators: string;
	limits: string;
};

export type Water = {
	flowM3h: number;
	turbidityNtu: number;
	ph: number;
	temperatureC: number;
	ssMgL: number;
	organic: number;
	microbial: number;
	chlorineMgL: number;
	taste: number;
	color: number;
	debris: number;
	floc: number;
	confidence: number;
	calciumMgL: number;
	alkalinityMgL: number;
	tdsMgL: number;
};

export type Status = 'ok' | 'watch' | 'fail';

export type StageResult = {
	id: StageId;
	title: string;
	before: Water;
	after: Water;
	status: Status;
	note: string;
};

export type MissionResult = MissionSpec & {
	ok: boolean;
	detail: string;
};

export type Evaluation = {
	stages: StageResult[];
	productionM3h: number;
	demandM3h: number;
	tankM3: number;
	tankCapacityM3: number;
	tankUnitM3: number;
	tankRatio: number;
	networkChlorineMgL: number;
	chlorineAtDosingMgL: number;
	reagentScore: number;
	reagentGh: number;
	hydraulicLoad: number;
	optimalFerricMgL: number;
	missions: MissionResult[];
	outlet: Water;
};

export type Trial = {
	id: number;
	label: string;
	scenarioTitle: string;
	settings: Settings;
	acc: Accumulators;
	turbidityNtu: number;
	ph: number;
	chlorineMgL: number;
	microbial: number;
	reagentScore: number;
	reagentGh: number;
	failures: string[];
};
