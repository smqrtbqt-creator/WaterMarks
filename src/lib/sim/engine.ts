import {
	coagulate,
	disinfect,
	filterCapacityM3h,
	filterWater,
	headlossRateBarPerHour,
	remineralize,
	settle,
	sludgeRatePercentPerHour
} from './chemistry';
import type {
	Accumulators,
	Alarm,
	Evaluation,
	Metric,
	PlantParams,
	RawModifiers,
	Scenario,
	Settings
} from './types';

const readingDigits: Partial<Record<Metric, number>> = {
	deliveredTurbidity: 2,
	settledTurbidity: 1,
	filteredTurbidity: 2,
	coagTurbidity: 1,
	coagEfficiency: 0,
	chlorine: 2,
	reservoirRatio: 0,
	ph: 2,
	lsi: 2,
	headloss: 2,
	production: 0,
	flocIndex: 2
};

export function demandAt(scenario: Scenario, hours: number, settings: Settings): number {
	if (scenario.allowDemandControl) return settings.demandOverrideM3h;
	let demand = scenario.demand.baseM3h;
	for (const step of scenario.demand.steps ?? []) {
		if (hours >= step.afterHours) demand = step.m3h;
	}
	return demand;
}

export function evaluate(
	plant: PlantParams,
	scenario: Scenario,
	settings: Settings,
	acc: Accumulators,
	modifiers: RawModifiers
): Evaluation {
	let rawTurbidity = scenario.raw.turbidityNtu;
	let rawPh = scenario.raw.ph;
	let available = scenario.raw.availableFlowM3h;
	if (modifiers.flood) {
		rawTurbidity *= scenario.flood.turbidityFactor;
		available *= scenario.flood.flowFactor;
		rawPh -= 0.12;
	}
	if (modifiers.degraded) {
		rawTurbidity += scenario.degrade.turbidityAdd;
		rawPh -= scenario.degrade.phDrop;
	}
	rawTurbidity = Math.min(360, rawTurbidity);
	rawPh = Math.min(9.4, Math.max(5.4, rawPh));

	const purging = acc.purgeRemainingH > 0;
	const backwashing = acc.backwashRemainingH > 0;
	const filterCapacity = filterCapacityM3h(acc.headlossBar, plant.filterHardMaxM3h, backwashing);

	const requested = Math.min(
		settings.intakeFlowM3h,
		settings.settlingFlowM3h,
		settings.filtrationFlowM3h
	);
	const production = Math.max(0, Math.min(requested, available, filterCapacity));

	let bottleneck: string | null = null;
	const limits: [string, number][] = [
		['la prise d’eau', Math.min(settings.intakeFlowM3h, available)],
		['le débit du décanteur', settings.settlingFlowM3h],
		['le débit de filtration', settings.filtrationFlowM3h],
		[backwashing ? 'le lavage en cours' : 'la perte de charge du filtre', filterCapacity]
	];
	const binding = limits.reduce((a, b) => (a[1] <= b[1] ? a : b));
	if (binding[1] + 0.5 < Math.max(settings.intakeFlowM3h, settings.settlingFlowM3h, settings.filtrationFlowM3h)) {
		bottleneck = `Le débit produit est limité par ${binding[0]}.`;
	}

	const flow = production;
	const coag = coagulate({
		turbidityNtu: rawTurbidity,
		phIn: settings.phBeforeCoagulation,
		alkalinityMgL: scenario.raw.alkalinityMgL + (settings.phBeforeCoagulation - scenario.raw.ph) * 14,
		coagulant: settings.coagulant,
		doseMgL: settings.coagulantDoseMgL,
		polymerMgL: settings.polymerDoseMgL
	});

	const settled = settle({
		turbidityNtu: coag.turbidityNtu,
		flowM3h: Math.max(flow, 0),
		designFlowM3h: plant.settlerDesignFlowM3h,
		flocIndex: coag.flocIndex,
		sludgePercent: acc.sludgePercent,
		purging
	});

	const filtered = filterWater({
		turbidityNtu: settled.turbidityNtu,
		flowM3h: Math.max(flow, 1),
		designFlowM3h: plant.filterDesignFlowM3h,
		headlossBar: acc.headlossBar
	});

	const remin = remineralize({
		phIn: coag.phOut,
		calciumMgL: scenario.raw.calciumMgL,
		alkalinityMgL: coag.alkalinityMgL,
		limeMgL: settings.limeDoseMgL,
		co2MgL: settings.co2DoseMgL,
		temperatureC: scenario.raw.temperatureC,
		tdsMgL: plant.tdsMgL
	});

	const chlorine = disinfect({
		turbidityNtu: filtered.turbidityNtu,
		ph: remin.ph,
		flowM3h: Math.max(flow, 1),
		doseMgL: settings.chlorineDoseMgL,
		contactVolumeM3: plant.contactVolumeM3,
		targetCt: plant.targetCt
	});

	const demand = demandAt(scenario, acc.hours, settings);
	const ratio = acc.reservoirM3 / plant.reservoirCapacityM3;
	const stagnant = flow < 8;

	const metrics: Record<Metric, number> = {
		deliveredTurbidity: stagnant ? 99 : filtered.turbidityNtu,
		settledTurbidity: settled.turbidityNtu,
		filteredTurbidity: filtered.turbidityNtu,
		coagTurbidity: coag.turbidityNtu,
		coagEfficiency: coag.efficiency * 100,
		chlorine: stagnant ? 0 : chlorine.residualMgL,
		reservoirRatio: ratio,
		ph: remin.ph,
		lsi: remin.lsi,
		headloss: acc.headlossBar,
		production: flow,
		flocIndex: coag.flocIndex
	};

	const goals = scenario.goals.map((goal) => {
		const current = metrics[goal.metric];
		const ok = compare(current, goal.op, goal.value, goal.min, goal.max) && !stagnant;
		return {
			id: goal.id,
			label: goal.label,
			ok: goal.metric === 'reservoirRatio' || goal.metric === 'headloss' ? compare(current, goal.op, goal.value, goal.min, goal.max) : ok,
			reading: formatMetric(goal.metric, current)
		};
	});
	const allGoalsMet = goals.every((goal) => goal.ok);
	const succeeded = allGoalsMet && acc.holdHours >= scenario.holdMinutes / 60;

	const alarms = buildAlarms({
		rawTurbidity,
		available,
		settings,
		flow,
		demand,
		coag,
		settled,
		filtered,
		remin,
		chlorine,
		acc,
		ratio,
		plant,
		backwashing,
		purging,
		stagnant,
		targetCt: plant.targetCt
	});

	const insights = buildInsights({
		coag,
		settled,
		filtered,
		remin,
		chlorine,
		flow,
		demand,
		ratio,
		rawTurbidity,
		plant
	});

	const stageFlow = stagnant ? 0 : flow;
	return {
		rawTurbidityNtu: rawTurbidity,
		rawPh,
		availableRawFlowM3h: available,
		productionM3h: flow,
		demandM3h: demand,
		bottleneck,
		stages: {
			intake: { turbidityNtu: rawTurbidity, ph: rawPh, flowM3h: Math.min(settings.intakeFlowM3h, available) },
			coagulation: { turbidityNtu: coag.turbidityNtu, ph: coag.phOut, flowM3h: stageFlow },
			settling: { turbidityNtu: settled.turbidityNtu, ph: coag.phOut, flowM3h: stageFlow },
			filtration: { turbidityNtu: filtered.turbidityNtu, ph: coag.phOut, flowM3h: stageFlow },
			remineralization: { turbidityNtu: filtered.turbidityNtu, ph: remin.ph, flowM3h: stageFlow },
			disinfection: { turbidityNtu: filtered.turbidityNtu, ph: remin.ph, flowM3h: stageFlow },
			storage: { turbidityNtu: filtered.turbidityNtu, ph: remin.ph, flowM3h: stageFlow }
		},
		coag,
		settling: {
			turbidityNtu: settled.turbidityNtu,
			capture: settled.capture,
			hydraulic: settled.hydraulic,
			sludgePercent: acc.sludgePercent
		},
		filter: {
			turbidityNtu: filtered.turbidityNtu,
			headlossBar: acc.headlossBar,
			capacityM3h: filterCapacity,
			backwashing
		},
		remin,
		disinfection: {
			turbidityNtu: filtered.turbidityNtu,
			ph: remin.ph,
			residualMgL: chlorine.residualMgL,
			contactMin: chlorine.contactMin,
			hocl: chlorine.hocl,
			ct: chlorine.ct,
			demandMgL: chlorine.demandMgL
		},
		storage: {
			volumeM3: acc.reservoirM3,
			capacityM3: plant.reservoirCapacityM3,
			ratio,
			deficitM3h: demand - flow
		},
		alarms,
		insights,
		goals,
		allGoalsMet,
		succeeded
	};
}

function compare(current: number, op: '<=' | '>=' | 'between', value?: number, min?: number, max?: number): boolean {
	if (op === '<=') return current <= (value ?? 0);
	if (op === '>=') return current >= (value ?? 0);
	return current >= (min ?? 0) && current <= (max ?? 0);
}

function formatMetric(metric: Metric, current: number): string {
	const digits = readingDigits[metric] ?? 1;
	const text = current.toLocaleString('fr-FR', {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
	switch (metric) {
		case 'coagEfficiency':
			return `${text} %`;
		case 'reservoirRatio':
			return `${Math.round(current * 100)} %`;
		case 'chlorine':
			return `${text} mg/L`;
		case 'headloss':
			return `${text} bar`;
		case 'production':
			return `${text} m³/h`;
		case 'ph':
		case 'lsi':
		case 'flocIndex':
			return text;
		default:
			return `${text} NTU`;
	}
}

function buildAlarms(input: {
	rawTurbidity: number;
	available: number;
	settings: Settings;
	flow: number;
	demand: number;
	coag: { efficiency: number; phOut: number };
	settled: { turbidityNtu: number; hydraulic: number };
	filtered: { turbidityNtu: number };
	remin: { ph: number; lsi: number };
	chlorine: { residualMgL: number; ct: number; sufficient: boolean };
	acc: Accumulators;
	ratio: number;
	plant: PlantParams;
	backwashing: boolean;
	purging: boolean;
	stagnant: boolean;
	targetCt: number;
}): Alarm[] {
	const alarms: Alarm[] = [];
	const push = (alarm: Alarm) => alarms.push(alarm);

	if (input.rawTurbidity >= 80) {
		push({ id: 'raw-turb', unit: 'intake', level: 'warn', message: 'Eau brute très turbide.' });
	}
	if (input.settings.intakeFlowM3h > input.available + 1) {
		push({
			id: 'raw-cap',
			unit: 'intake',
			level: 'warn',
			message: 'Le débit demandé dépasse la ressource disponible.'
		});
	}
	if (input.coag.efficiency < 0.45) {
		push({
			id: 'coag-weak',
			unit: 'coagulation',
			level: 'warn',
			message: 'La coagulation simulée reste peu efficace.'
		});
	}
	if (input.settled.turbidityNtu > 8) {
		push({
			id: 'settle-turb',
			unit: 'settling',
			level: 'warn',
			message: 'Turbidité élevée en sortie de décantation.'
		});
	}
	if (input.settled.hydraulic < 0.72) {
		push({
			id: 'settle-flow',
			unit: 'settling',
			level: 'warn',
			message: 'Charge hydraulique forte dans le décanteur.'
		});
	}
	if (input.acc.sludgePercent >= 70) {
		push({
			id: 'sludge',
			unit: 'settling',
			level: 'critical',
			message: 'Accumulation de boues critique.'
		});
	} else if (input.acc.sludgePercent >= 55) {
		push({ id: 'sludge-w', unit: 'settling', level: 'warn', message: 'Les boues s’accumulent dans le décanteur.' });
	}
	if (input.acc.headlossBar >= 1.55) {
		push({
			id: 'headloss',
			unit: 'filtration',
			level: 'critical',
			message: 'Perte de charge élevée : le filtre est colmaté.'
		});
	} else if (input.acc.headlossBar >= 1.05) {
		push({ id: 'headloss-w', unit: 'filtration', level: 'warn', message: 'La perte de charge augmente.' });
	}
	if (input.filtered.turbidityNtu > 1) {
		push({
			id: 'filt-turb',
			unit: 'filtration',
			level: input.filtered.turbidityNtu > 4 ? 'critical' : 'warn',
			message: 'La turbidité filtrée dépasse 1 NTU.'
		});
	}
	if (input.remin.ph < 6.5 || input.remin.ph > 8.6) {
		push({ id: 'ph', unit: 'remineralization', level: 'warn', message: 'pH hors plage usuelle de distribution.' });
	}
	if (input.remin.lsi < -0.45) {
		push({
			id: 'lsi-low',
			unit: 'remineralization',
			level: 'warn',
			message: 'Eau agressive selon l’indice de saturation simplifié.'
		});
	} else if (input.remin.lsi > 0.5) {
		push({
			id: 'lsi-high',
			unit: 'remineralization',
			level: 'warn',
			message: 'Tendance à l’entartrage selon l’indice simplifié.'
		});
	}
	if (!input.stagnant && input.chlorine.residualMgL < 0.1) {
		push({
			id: 'cl-low',
			unit: 'disinfection',
			level: 'critical',
			message: 'Chlore résiduel insuffisant.'
		});
	} else if (!input.stagnant && input.chlorine.residualMgL > 0.6) {
		push({ id: 'cl-high', unit: 'disinfection', level: 'warn', message: 'Chlore résiduel élevé.' });
	}
	if (!input.stagnant && input.chlorine.ct < input.targetCt) {
		push({
			id: 'ct',
			unit: 'disinfection',
			level: 'critical',
			message: 'Le CT simulé est inférieur à la cible pédagogique.'
		});
	}
	if (input.ratio <= 0.02 && input.demand > input.flow) {
		push({
			id: 'rupture',
			unit: 'storage',
			level: 'critical',
			message: 'Rupture d’alimentation : le réservoir est vide.'
		});
	} else if (input.ratio < 0.22) {
		push({ id: 'level', unit: 'storage', level: 'warn', message: 'Niveau de réservoir bas.' });
	}
	if (input.acc.reservoirM3 >= input.plant.reservoirCapacityM3 - 1 && input.flow > input.demand) {
		push({ id: 'overflow', unit: 'storage', level: 'info', message: 'Le réservoir est plein : la surverse déborde.' });
	}
	if (input.backwashing) {
		push({ id: 'wash', unit: 'filtration', level: 'info', message: 'Lavage du filtre en cours.' });
	}
	if (input.purging) {
		push({ id: 'purge', unit: 'settling', level: 'info', message: 'Purge des boues en cours.' });
	}
	return alarms;
}

function buildInsights(input: {
	coag: { flocIndex: number; efficiency: number; phOut: number };
	settled: { turbidityNtu: number; hydraulic: number; capture: number };
	filtered: { turbidityNtu: number };
	remin: { ph: number; lsi: number };
	chlorine: { residualMgL: number; ct: number; contactMin: number; hocl: number };
	flow: number;
	demand: number;
	ratio: number;
	rawTurbidity: number;
	plant: PlantParams;
}): string[] {
	const lines: string[] = [];
	if (input.coag.flocIndex < 0.45) {
		lines.push('Les flocs observés restent fins : peu de particules s’agrègent.');
	}
	if (input.coag.efficiency < 0.5) {
		lines.push('Entre l’eau brute et la sortie de coagulation, la turbidité baisse peu.');
	}
	if (input.settled.turbidityNtu > 5 && input.coag.flocIndex < 0.55) {
		lines.push('La décantation reçoit une eau dont les particules sédimentent mal.');
	}
	if (input.settled.hydraulic < 0.75) {
		lines.push('Au débit actuel, l’eau traverse le décanteur plus vite que dans le régime prévu.');
	}
	if (input.settled.turbidityNtu > 8) {
		lines.push('Le filtre est alimenté par une eau encore chargée : la perte de charge montera plus vite.');
	}
	if (input.filtered.turbidityNtu > 1 && input.settled.turbidityNtu > 4) {
		lines.push('La filtration ne rattrape pas, à elle seule, une eau mal décantée.');
	}
	if (input.remin.ph >= 6.8 && input.remin.ph <= 8.5 && input.remin.lsi < -0.35) {
		lines.push('Le pH peut sembler acceptable alors que l’indice de saturation reste négatif.');
	}
	if (input.chlorine.residualMgL >= 0.15 && input.chlorine.ct < input.plant.targetCt && input.chlorine.hocl < 0.35) {
		lines.push('Un résiduel est mesuré, mais le pH élevé laisse peu de chlore sous forme active.');
	}
	if (input.chlorine.contactMin < 18 && input.flow > input.plant.designFlowM3h) {
		lines.push('Le temps de contact dans le bassin de désinfection se raccourcit quand le débit augmente.');
	}
	if (input.flow + 2 < input.demand) {
		lines.push('La production est inférieure à la demande : le volume du réservoir diminue.');
	}
	if (input.ratio < 0.3 && input.flow + 2 < input.demand) {
		lines.push('Si l’écart dure, le stockage ne couvrira plus la pointe.');
	}
	return lines.slice(0, 4);
}

export function stepAccumulators(
	plant: PlantParams,
	evaluation: Evaluation,
	acc: Accumulators,
	dtHours: number
): Accumulators {
	const next: Accumulators = { ...acc, hours: acc.hours + dtHours };
	const flow = evaluation.productionM3h;

	if (next.purgeRemainingH > 0) {
		next.purgeRemainingH = Math.max(0, next.purgeRemainingH - dtHours);
		next.sludgePercent = Math.max(8, next.sludgePercent - dtHours * (80 / plant.purgeHours));
	} else {
		const captured = Math.max(0, evaluation.coag.turbidityNtu - evaluation.settling.turbidityNtu);
		const rate = sludgeRatePercentPerHour({
			capturedNtu: captured,
			flowM3h: flow,
			designFlowM3h: plant.settlerDesignFlowM3h
		});
		next.sludgePercent = Math.min(100, next.sludgePercent + rate * dtHours);
	}

	if (next.backwashRemainingH > 0) {
		next.backwashRemainingH = Math.max(0, next.backwashRemainingH - dtHours);
		const washFlow = plant.backwashVolumeM3 / plant.backwashHours;
		next.reservoirM3 -= washFlow * dtHours;
		if (next.backwashRemainingH === 0) next.headlossBar = 0.14;
	} else if (flow > 5) {
		const rate = headlossRateBarPerHour({
			turbidityNtu: evaluation.settling.turbidityNtu,
			flowM3h: flow,
			designFlowM3h: plant.filterDesignFlowM3h
		});
		next.headlossBar = Math.min(2.4, next.headlossBar + rate * dtHours);
	}

	next.reservoirM3 += (flow - evaluation.demandM3h) * dtHours;
	next.reservoirM3 = Math.min(plant.reservoirCapacityM3, Math.max(0, next.reservoirM3));

	next.holdHours = evaluation.allGoalsMet ? next.holdHours + dtHours : 0;
	return next;
}

export function blankAcc(reservoirM3: number): Accumulators {
	return {
		sludgePercent: 12,
		purgeRemainingH: 0,
		headlossBar: 0.2,
		backwashRemainingH: 0,
		reservoirM3,
		hours: 0,
		holdHours: 0
	};
}
