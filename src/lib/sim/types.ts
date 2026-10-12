export type UnitId =
	| 'intake'
	| 'coagulation'
	| 'settling'
	| 'filtration'
	| 'remineralization'
	| 'disinfection'
	| 'storage';

export type CoagulantId = 'alum' | 'ferric' | 'pac';

export type Settings = {
	intakeFlowM3h: number;
	coagulant: CoagulantId;
	coagulantDoseMgL: number;
	phBeforeCoagulation: number;
	polymerDoseMgL: number;
	settlingFlowM3h: number;
	filtrationFlowM3h: number;
	limeDoseMgL: number;
	co2DoseMgL: number;
	chlorineDoseMgL: number;
	demandOverrideM3h: number;
};

export type Accumulators = {
	sludgePercent: number;
	purgeRemainingH: number;
	headlossBar: number;
	backwashRemainingH: number;
	reservoirM3: number;
	hours: number;
	holdHours: number;
};

export type RawModifiers = {
	flood: boolean;
	degraded: boolean;
};

export type GoalOp = '<=' | '>=' | 'between';

export type Metric =
	| 'deliveredTurbidity'
	| 'settledTurbidity'
	| 'filteredTurbidity'
	| 'coagTurbidity'
	| 'coagEfficiency'
	| 'chlorine'
	| 'reservoirRatio'
	| 'ph'
	| 'lsi'
	| 'headloss'
	| 'production'
	| 'flocIndex';

export type Goal = {
	id: string;
	label: string;
	metric: Metric;
	op: GoalOp;
	value?: number;
	min?: number;
	max?: number;
};

export type DemandStep = {
	afterHours: number;
	m3h: number;
};

export type Scenario = {
	id: string;
	kicker: string;
	title: string;
	summary: string;
	intent: string;
	focusUnit: UnitId | null;
	allowDemandControl: boolean;
	holdMinutes: number;
	raw: {
		turbidityNtu: number;
		ph: number;
		temperatureC: number;
		alkalinityMgL: number;
		calciumMgL: number;
		availableFlowM3h: number;
	};
	flood: { turbidityFactor: number; flowFactor: number };
	degrade: { turbidityAdd: number; phDrop: number };
	demand: { baseM3h: number; steps?: DemandStep[] };
	initialSettings: Settings;
	initialAccumulators: Accumulators;
	goals: Goal[];
};

export type PlantParams = {
	name: string;
	river: string;
	designFlowM3h: number;
	settlerDesignFlowM3h: number;
	filterDesignFlowM3h: number;
	filterHardMaxM3h: number;
	contactVolumeM3: number;
	reservoirCapacityM3: number;
	temperatureNote: string;
	tdsMgL: number;
	targetCt: number;
	backwashHours: number;
	backwashVolumeM3: number;
	purgeHours: number;
};

export type AlarmLevel = 'info' | 'warn' | 'critical';

export type Alarm = {
	id: string;
	unit: UnitId;
	level: AlarmLevel;
	message: string;
};

export type CoagDetail = {
	turbidityNtu: number;
	efficiency: number;
	flocIndex: number;
	flocLabel: string;
	phIn: number;
	phOut: number;
	alkalinityMgL: number;
};

export type Evaluation = {
	rawTurbidityNtu: number;
	rawPh: number;
	availableRawFlowM3h: number;
	productionM3h: number;
	demandM3h: number;
	bottleneck: string | null;
	stages: Record<
		UnitId,
		{
			turbidityNtu: number;
			ph: number;
			flowM3h: number;
		}
	>;
	coag: CoagDetail;
	settling: {
		turbidityNtu: number;
		capture: number;
		hydraulic: number;
		sludgePercent: number;
	};
	filter: {
		turbidityNtu: number;
		headlossBar: number;
		capacityM3h: number;
		backwashing: boolean;
	};
	remin: {
		ph: number;
		lsi: number;
		calciumMgL: number;
		alkalinityMgL: number;
		balance: 'agressive' | 'équilibre' | 'entartrante';
	};
	disinfection: {
		turbidityNtu: number;
		ph: number;
		residualMgL: number;
		contactMin: number;
		hocl: number;
		ct: number;
		demandMgL: number;
	};
	storage: {
		volumeM3: number;
		capacityM3: number;
		ratio: number;
		deficitM3h: number;
	};
	alarms: Alarm[];
	insights: string[];
	goals: { id: string; label: string; ok: boolean; reading: string }[];
	allGoalsMet: boolean;
	succeeded: boolean;
};

export type Trial = {
	id: number;
	label: string;
	hours: number;
	deliveredTurbidity: number;
	coagTurbidity: number;
	coagEfficiency: number;
	settledTurbidity: number;
	filteredTurbidity: number;
	ph: number;
	lsi: number;
	chlorine: number;
	reservoirRatio: number;
	productionM3h: number;
	settings: Settings;
};

export type Sample = {
	hours: number;
	reservoirRatio: number;
	productionM3h: number;
	demandM3h: number;
	turbidityNtu: number;
};
