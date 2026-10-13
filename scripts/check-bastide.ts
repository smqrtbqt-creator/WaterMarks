import { facts, factById, factNumber, lessons, scenarioById } from '../src/lib/bastide/catalog';
import {
	applyCarbon,
	applyCoagulation,
	applyOzone,
	applySand,
	applyScreen,
	applySettling,
	applyUv,
	evaluate,
	networkChlorine,
	NOMINAL_CAPACITY_M3,
	optimalFerricMgL,
	reagentScore,
	step,
	TANK_COUNT,
	TANK_UNIT_M3,
	waterIsPhysical
} from '../src/lib/bastide/model';
import type { Accumulators, Settings, Water } from '../src/lib/bastide/types';
import { STAGES } from '../src/lib/bastide/types';

function assert(condition: unknown, message: string) {
	if (!condition) throw new Error(message);
}

function water(patch: Partial<Water> = {}): Water {
	return {
		flowM3h: 1000,
		turbidityNtu: 20,
		ph: 7,
		temperatureC: 12,
		ssMgL: 10,
		organic: 20,
		microbial: 40,
		chlorineMgL: 0,
		taste: 20,
		color: 15,
		debris: 20,
		floc: 0,
		confidence: 0.5,
		calciumMgL: 15,
		alkalinityMgL: 30,
		tdsMgL: 140,
		...patch
	};
}

function stageTurb(scenarioId: string, settings: Settings, acc: Accumulators, id: string) {
	const found = evaluate(scenarioById(scenarioId), settings, acc).stages.find((item) => item.id === id);
	if (!found) throw new Error(id);
	return found;
}

assert(TANK_UNIT_M3 === 625, 'cuve unitaire');
assert(TANK_COUNT === 2, 'nombre de cuves');
assert(NOMINAL_CAPACITY_M3 === 1250, 'capacité totale calculée');
assert(factNumber('tank-unit-m3') === 625, 'donnée de cuve');
assert(factNumber('tank-total-m3') === 1250, 'donnée de capacité totale');
assert(factNumber('production-m3-day') / 24 === factNumber('production-mean-m3h'), 'moyenne horaire');
assert(factById('tank-unit-m3').category === 'official', 'cuve officielle');
assert(factById('production-mean-m3h').category === 'educational_assumption', 'débit moyen hypothèse');
assert(factById('chlorine-band-low').category === 'educational_assumption', 'chlore pédagogique');
assert(factById('chlorine-band-high').category === 'educational_assumption', 'plafond chlore pédagogique');
assert(factById('turb-limit-nfu').category === 'regulatory_reference', 'limite turbidité');
assert(factById('ph-min').category === 'regulatory_reference', 'pH mini');
assert(factNumber('ph-practice') === 8.2, 'pratique 8,2');
assert(
	!facts.some((fact) => fact.category === 'official' && fact.unit === 'mg/L'),
	'aucun dosage officiel en mg/L'
);
assert(factById('doses-unknown').value === 'Non fournis', 'dosages inconnus');

for (const stage of STAGES) {
	assert(scenarioById('claire').missions.length > 0, 'missions');
	const lesson = lessons[stage.id];
	assert(lesson?.objective && lesson.limits, `fiche ${stage.id}`);
}

const screened = applyScreen(water({ turbidityNtu: 80, debris: 80, ssMgL: 40, microbial: 50 }), 100);
assert(screened.debris < 12, `débris ${screened.debris}`);
assert(screened.turbidityNtu > 76, `fines encore là ${screened.turbidityNtu}`);
assert(screened.turbidityNtu < 80, 'léger effet sur les fines');
assert(screened.microbial === 50, 'le dégrillage ne désinfecte pas');
assert(screened.debris / 80 < screened.turbidityNtu / 80, 'les gros débris partent plus que la turbidité');

const optimal = optimalFerricMgL(40);
const base = water({ turbidityNtu: 40, ph: 7, ssMgL: 25, microbial: 40 });
const lowDose = applyCoagulation(base, 2, 4, 0.3);
const midDose = applyCoagulation(base, optimal, 4, 0.3);
const highDose = applyCoagulation(base, optimal * 3, 4, 0.3);
assert(midDose.turbidityNtu < lowDose.turbidityNtu, `dose basse ${lowDose.turbidityNtu} vs ${midDose.turbidityNtu}`);
assert(midDose.turbidityNtu < highDose.turbidityNtu, `surdosage ${highDose.turbidityNtu} vs ${midDose.turbidityNtu}`);
assert(midDose.microbial > base.microbial * 0.95, 'la coagulation ne désinfecte pas');

const poorFloc = applySettling(water({ turbidityNtu: 30, floc: 0.05, flowM3h: 1000, temperatureC: 12 }), 2);
const richFloc = applySettling(water({ turbidityNtu: 30, floc: 0.9, flowM3h: 1000, temperatureC: 12 }), 2);
assert(richFloc.turbidityNtu < poorFloc.turbidityNtu * 0.5, `flocs ${richFloc.turbidityNtu} vs ${poorFloc.turbidityNtu}`);

const clearUv = applyUv(water({ turbidityNtu: 0.3, microbial: 40, flowM3h: 900 }), 100, 100);
const muddyUv = applyUv(water({ turbidityNtu: 15, microbial: 40, flowM3h: 900 }), 100, 100);
assert(muddyUv.microbial > clearUv.microbial + 15, `UV ${muddyUv.microbial} vs ${clearUv.microbial}`);
assert(muddyUv.turbidityNtu === 15, 'les UV ne clarifient pas');

const freshCarbon = applyCarbon(water({ taste: 80, color: 70, organic: 60 }), 0);
const saturatedCarbon = applyCarbon(water({ taste: 80, color: 70, organic: 60 }), 100);
assert(saturatedCarbon.taste === 80, 'charbon saturé');
assert(freshCarbon.taste < saturatedCarbon.taste - 20, `charbon frais ${freshCarbon.taste}`);

const weakOzone = applyOzone(water({ microbial: 60, organic: 30, turbidityNtu: 1 }), 0.2, 2);
const strongOzone = applyOzone(water({ microbial: 60, organic: 30, turbidityNtu: 1 }), 1.6, 10);
assert(strongOzone.microbial < weakOzone.microbial / 2, `ozone ${strongOzone.microbial} vs ${weakOzone.microbial}`);
assert(Math.abs(strongOzone.turbidityNtu - 1) < 0.05, 'l’ozone ne clarifie presque pas');

const sandIn = water({ turbidityNtu: 2, microbial: 50 });
const sandOut = applySand(sandIn, 5);
assert(sandOut.microbial > sandIn.microbial * 0.85, 'le sable ne désinfecte pas vraiment');

const longStay = networkChlorine(0.3, 20, 1200, 50);
const shortStay = networkChlorine(0.3, 20, 200, 800);
assert(longStay < shortStay * 0.7, `séjour ${longStay} vs ${shortStay}`);

const claire = scenarioById('claire');
const pluie = scenarioById('pluie');
const organique = scenarioById('organique');
const incident = scenarioById('incident');
assert(pluie.ambazac.turbidityNtu > claire.ambazac.turbidityNtu * 5, 'la pluie est plus trouble');
assert(incident.ambazac.organic > claire.ambazac.organic, 'l’incident est plus organique');

const claireNow = evaluate(claire, claire.initialSettings, claire.initialAccumulators);
const pluieNow = evaluate(pluie, pluie.initialSettings, pluie.initialAccumulators);
assert(JSON.stringify(claireNow) === JSON.stringify(evaluate(claire, claire.initialSettings, claire.initialAccumulators)), 'déterministe');
assert(pluieNow.outlet.turbidityNtu > claireNow.outlet.turbidityNtu, 'les scénarios divergent');
assert(pluieNow.outlet.turbidityNtu > 5, `pluie non résolue ${pluieNow.outlet.turbidityNtu}`);
assert(pluieNow.missions.find((mission) => mission.id === 'turb-limit')?.ok === false, 'mission pluie ouverte');
assert(stageTurb('claire', claire.initialSettings, claire.initialAccumulators, 'sand').after.turbidityNtu < 3, 'filtre déjà clair');
assert(claireNow.outlet.microbial > 15, `claire encore à désinfecter ${claireNow.outlet.microbial}`);
assert(claireNow.missions.find((mission) => mission.id === 'microbial')?.ok === false, 'mission désinfection ouverte');

for (const scenario of [claire, pluie, organique, incident]) {
	const result = evaluate(scenario, scenario.initialSettings, scenario.initialAccumulators);
	assert(result.tankUnitM3 * 2 === 1250, 'calcul 625 × 2');
	for (const item of result.stages) {
		assert(waterIsPhysical(item.before) && waterIsPhysical(item.after), `bornes ${scenario.id} ${item.id}`);
		assert(item.after.ph >= 0 && item.after.ph <= 14, 'pH');
		assert(item.after.turbidityNtu >= 0, 'turbidité');
		assert(item.after.chlorineMgL >= 0, 'chlore');
		assert(item.after.microbial >= 0 && item.after.microbial <= 100, 'risque');
	}
	for (let index = 0; index < result.stages.length - 1; index += 1) {
		assert(
			JSON.stringify(result.stages[index].after) === JSON.stringify(result.stages[index + 1].before),
			`chaîne ${scenario.id} ${result.stages[index].id}`
		);
	}
	assert(result.tankM3 <= result.tankCapacityM3, 'volume dans la capacité');
}

const oneTank = evaluate(claire, { ...claire.initialSettings, tanksOnline: 1 }, { ...claire.initialAccumulators, tankM3: 1000 });
assert(oneTank.tankCapacityM3 === 625, `une cuve ${oneTank.tankCapacityM3}`);
assert(oneTank.tankM3 === 625, 'volume limité à la cuve en service');
const twoTanks = evaluate(claire, { ...claire.initialSettings, tanksOnline: 2 }, claire.initialAccumulators);
assert(twoTanks.tankCapacityM3 === 1250, 'deux cuves');

const tunedClaire: Settings = {
	...claire.initialSettings,
	ferricMgL: 8,
	limeCoagMgL: 6,
	polyamineMgL: 0.3,
	ozoneMgL: 1.5,
	ozoneContactMin: 10,
	uvIntensityPct: 90,
	lampPct: 100,
	chlorineMgL: 0.45,
	sodaMgL: 8
};
const tunedClaireResult = evaluate(claire, tunedClaire, claire.initialAccumulators);
assert(tunedClaireResult.outlet.turbidityNtu <= 1, `claire traitée ${tunedClaireResult.outlet.turbidityNtu}`);
assert(tunedClaireResult.outlet.microbial <= 8, `risque claire ${tunedClaireResult.outlet.microbial}`);
assert(tunedClaireResult.outlet.ph >= 6.5 && tunedClaireResult.outlet.ph <= 9, `pH claire ${tunedClaireResult.outlet.ph}`);
assert(
	tunedClaireResult.networkChlorineMgL >= 0.1 && tunedClaireResult.networkChlorineMgL <= 0.4,
	`chlore claire ${tunedClaireResult.networkChlorineMgL}`
);
assert(reagentScore(tunedClaire) <= factNumber('sparing-dose-max'), `sobriété ${reagentScore(tunedClaire)}`);
assert(tunedClaireResult.missions.every((mission) => mission.ok), tunedClaireResult.missions.filter((mission) => !mission.ok).map((mission) => mission.id).join(','));

const waste: Settings = { ...tunedClaire, ferricMgL: 55, ozoneMgL: 4, chlorineMgL: 2, pacMgL: 25 };
assert(reagentScore(waste) > factNumber('sparing-dose-max'), 'le gaspillage se voit');

const tunedRain: Settings = {
	...pluie.initialSettings,
	vienneSharePct: 25,
	intakeFlowM3h: 900,
	plantFlowM3h: 900,
	sandFlowM3h: 900,
	screenOpenPct: 90,
	ferricMgL: 24,
	limeCoagMgL: 18,
	polyamineMgL: 0.35,
	settlingHours: 2.2,
	ozoneMgL: 1.8,
	ozoneContactMin: 10,
	uvIntensityPct: 100,
	lampPct: 100,
	chlorineMgL: 0.7,
	sodaMgL: 10,
	demandM3h: 500,
	preOzone: false,
	pacMgL: 0
};
const tunedRainAcc: Accumulators = { ...pluie.initialAccumulators, sandState: 8, tankM3: 900 };
const tunedRainResult = evaluate(pluie, tunedRain, tunedRainAcc);
assert(tunedRainResult.outlet.turbidityNtu <= 1, `pluie traitée ${tunedRainResult.outlet.turbidityNtu}`);
assert(tunedRainResult.outlet.microbial <= 8, `risque pluie ${tunedRainResult.outlet.microbial}`);
assert(tunedRainResult.missions.every((mission) => mission.ok), tunedRainResult.missions.filter((mission) => !mission.ok).map((mission) => `${mission.id}:${mission.detail}`).join(' | '));

const poorRain = evaluate(
	pluie,
	{ ...tunedRain, ferricMgL: 0, limeCoagMgL: 0, polyamineMgL: 0 },
	tunedRainAcc
);
assert(
	stageTurb('pluie', tunedRain, tunedRainAcc, 'settling').after.turbidityNtu <
		poorRain.stages.find((item) => item.id === 'settling')!.after.turbidityNtu,
	'de mauvais flocs décantent mal'
);

const organicNow = evaluate(organique, organique.initialSettings, organique.initialAccumulators);
const organicFresh = evaluate(organique, organique.initialSettings, { ...organique.initialAccumulators, carbonState: 0 });
assert(organicNow.outlet.taste > organicFresh.outlet.taste + 10, `charbon du scénario ${organicNow.outlet.taste} vs ${organicFresh.outlet.taste}`);
assert(organicNow.missions.find((mission) => mission.id === 'taste')?.ok === false, 'goût encore présent');

const incidentNow = evaluate(incident, incident.initialSettings, incident.initialAccumulators);
const incidentUvOnly = evaluate(incident, { ...incident.initialSettings, uvIntensityPct: 100, lampPct: 100, ozoneMgL: 1.8, ozoneContactMin: 12 }, incident.initialAccumulators);
const incidentCarbonOnly = evaluate(
	incident,
	{ ...incident.initialSettings, preOzone: true, pacMgL: 30 },
	{ ...incident.initialAccumulators, carbonState: 5 }
);
const incidentTuned = evaluate(
	incident,
	{
		...incident.initialSettings,
		preOzone: true,
		pacMgL: 28,
		ozoneMgL: 1.8,
		ozoneContactMin: 12,
		uvIntensityPct: 100,
		lampPct: 100,
		chlorineMgL: 0.7,
		sodaMgL: 8,
		ferricMgL: 16,
		limeCoagMgL: 12
	},
	{ ...incident.initialAccumulators, carbonState: 5, sandState: 10, tankM3: 900 }
);
assert(incidentNow.missions.find((mission) => mission.id === 'taste')?.ok === false, 'incident goût ouvert');
assert(incidentNow.missions.find((mission) => mission.id === 'microbial')?.ok === false, 'incident microbe ouvert');
assert(incidentUvOnly.outlet.microbial <= 8, `UV ${incidentUvOnly.outlet.microbial}`);
assert(incidentUvOnly.outlet.taste > 30, `le goût reste ${incidentUvOnly.outlet.taste}`);
assert(incidentCarbonOnly.outlet.taste <= 30, `goût avec poudre ${incidentCarbonOnly.outlet.taste}`);
assert(incidentTuned.outlet.turbidityNtu <= 1, `incident turbidité ${incidentTuned.outlet.turbidityNtu}`);
assert(incidentTuned.missions.every((mission) => mission.ok), incidentTuned.missions.filter((mission) => !mission.ok).map((mission) => `${mission.id} ${mission.detail}`).join(' | '));

const filling = step(claireNow, { ...claire.initialAccumulators, tankM3: 400 }, 1);
assert(filling.tankM3 > 400, 'la production remplit');
assert(filling.tankM3 <= 1250, 'pas au-delà de 1 250');
const emptying = step(
	evaluate(claire, { ...claire.initialSettings, intakeFlowM3h: 100, plantFlowM3h: 100, sandFlowM3h: 100, demandM3h: 800 }, claire.initialAccumulators),
	{ hours: 0, tankM3: 50, sandState: 10, carbonState: 10 },
	2
);
assert(emptying.tankM3 === 0, `cuve vide ${emptying.tankM3}`);

console.log('bastide ok');
