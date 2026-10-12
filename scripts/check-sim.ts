import data from '../src/lib/data/plant.json';
import { coagulate, langelier, remineralize } from '../src/lib/sim/chemistry';
import { evaluate, stepAccumulators } from '../src/lib/sim/engine';
import type { PlantParams, Scenario } from '../src/lib/sim/types';

const plant = data.plant as PlantParams;
const scenarios = data.scenarios as Scenario[];

function assert(condition: unknown, message: string) {
	if (!condition) throw new Error(message);
}

const demo = coagulate({
	turbidityNtu: 80,
	phIn: 7,
	alkalinityMgL: 80,
	coagulant: 'alum',
	doseMgL: 30,
	polymerMgL: 0
});
assert(Math.abs(demo.efficiency - 0.9) < 0.011, `efficacité démo ${demo.efficiency}`);
assert(Math.abs(demo.turbidityNtu - 8) < 0.2, `turbidité démo ${demo.turbidityNtu}`);

const under = coagulate({
	turbidityNtu: 80,
	phIn: 7,
	alkalinityMgL: 80,
	coagulant: 'alum',
	doseMgL: 8,
	polymerMgL: 0
});
const over = coagulate({
	turbidityNtu: 80,
	phIn: 7,
	alkalinityMgL: 80,
	coagulant: 'alum',
	doseMgL: 70,
	polymerMgL: 0
});
assert(under.turbidityNtu > 40, `sous-dosage encore trop clair ${under.turbidityNtu}`);
assert(over.turbidityNtu > 30, `surdosage encore trop clair ${over.turbidityNtu}`);
assert(under.turbidityNtu > demo.turbidityNtu && over.turbidityNtu > demo.turbidityNtu, 'cloche');

const crue = scenarios.find((s) => s.id === 'crue')!;
const crueBad = evaluate(plant, crue, crue.initialSettings, crue.initialAccumulators, {
	flood: false,
	degraded: false
});
assert(!crueBad.allGoalsMet, 'la crue ne doit pas être déjà réussie');
assert(crueBad.stages.filtration.turbidityNtu > 1, `crue filtrée ${crueBad.stages.filtration.turbidityNtu}`);

const tuned = {
	...crue.initialSettings,
	coagulantDoseMgL: 42,
	phBeforeCoagulation: 7,
	polymerDoseMgL: 0.1,
	chlorineDoseMgL: 0.45,
	intakeFlowM3h: 170,
	settlingFlowM3h: 180,
	filtrationFlowM3h: 180
};
const crueOk = evaluate(plant, crue, tuned, crue.initialAccumulators, { flood: false, degraded: false });
assert(crueOk.goals.find((g) => g.id === 'turb')?.ok, `crue corrigée turb ${crueOk.stages.storage.turbidityNtu}`);
assert(crueOk.coag.efficiency > 0.75, `efficacité crue ${crueOk.coag.efficiency}`);

const dosage = scenarios.find((s) => s.id === 'dosage')!;
const dosageBad = evaluate(plant, dosage, dosage.initialSettings, dosage.initialAccumulators, {
	flood: false,
	degraded: false
});
assert((dosageBad.goals.find((g) => g.id === 'settle')?.ok ?? true) === false, 'décantation déjà bonne');

const fixedDose = {
	...dosage.initialSettings,
	coagulantDoseMgL: 24,
	phBeforeCoagulation: 7,
	polymerDoseMgL: 0.1
};
const dosageOk = evaluate(plant, dosage, fixedDose, dosage.initialAccumulators, {
	flood: false,
	degraded: false
});
assert(dosageOk.goals.every((g) => g.ok), `dosage corrigé ${dosageOk.goals.map((g) => g.reading).join(' | ')}`);

const filtre = scenarios.find((s) => s.id === 'filtre')!;
const filtreBad = evaluate(plant, filtre, filtre.initialSettings, filtre.initialAccumulators, {
	flood: false,
	degraded: false
});
assert(filtreBad.filter.capacityM3h < 120, `capacité filtre ${filtreBad.filter.capacityM3h}`);
assert(!filtreBad.allGoalsMet, 'filtre déjà résolu');

const equilibre = scenarios.find((s) => s.id === 'equilibre')!;
const eq0 = evaluate(plant, equilibre, equilibre.initialSettings, equilibre.initialAccumulators, {
	flood: false,
	degraded: false
});
console.log('équilibre initial', {
	ph: eq0.remin.ph,
	lsi: eq0.remin.lsi,
	ca: eq0.remin.calciumMgL,
	alk: eq0.remin.alkalinityMgL,
	turb: eq0.stages.storage.turbidityNtu,
	goals: eq0.goals.map((g) => [g.id, g.ok, g.reading])
});
assert(eq0.remin.lsi < -0.4, `LSI initial pas assez bas ${eq0.remin.lsi}`);
assert(!eq0.goals.find((g) => g.id === 'lsi')?.ok, 'LSI déjà dans la cible');

let found = false;
const hits: string[] = [];
for (let lime = 0; lime <= 140; lime += 2) {
	for (let co2 = 0; co2 <= 140; co2 += 2) {
		const trial = evaluate(
			plant,
			equilibre,
			{ ...equilibre.initialSettings, limeDoseMgL: lime, co2DoseMgL: co2 },
			equilibre.initialAccumulators,
			{ flood: false, degraded: false }
		);
		if (trial.allGoalsMet) {
			found = true;
			if (hits.length < 8) {
				hits.push(
					`chaux ${lime} CO2 ${co2} → pH ${trial.remin.ph.toFixed(2)} LSI ${trial.remin.lsi.toFixed(2)} Ca ${trial.remin.calciumMgL.toFixed(1)} alc ${trial.remin.alkalinityMgL.toFixed(0)}`
				);
			}
		}
	}
}
console.log(hits.join('\n') || 'aucune solution reminéralisation');
assert(found, 'aucune paire chaux/CO₂ ne satisfait le scénario équilibre');

const lsiCheck = langelier({
	ph: 7.8,
	temperatureC: 16,
	calciumMgL: 40,
	alkalinityMgL: 80,
	tdsMgL: 200
});
console.log('LSI témoin pH 7.8 Ca 40 alk 80', lsiCheck.toFixed(2));

const remin = remineralize({
	phIn: 7.2,
	calciumMgL: 8,
	alkalinityMgL: 16,
	limeMgL: 40,
	co2MgL: 30,
	temperatureC: 16,
	tdsMgL: 200
});
console.log('remin 40/30', remin);

const pointe = scenarios.find((s) => s.id === 'pointe')!;
const at = (flow: number) =>
	evaluate(
		plant,
		pointe,
		{
			...pointe.initialSettings,
			intakeFlowM3h: flow,
			settlingFlowM3h: flow,
			filtrationFlowM3h: flow
		},
		pointe.initialAccumulators,
		{ flood: false, degraded: false }
	);

for (const flow of [175, 200, 220, 260, 300]) {
	const rushed = at(flow);
	console.log(
		`pointe ${flow} m3/h`,
		`turb ${rushed.stages.storage.turbidityNtu.toFixed(2)}`,
		`Cl ${rushed.disinfection.residualMgL.toFixed(2)}`,
		`CT ${rushed.disinfection.ct.toFixed(2)}`,
		`contact ${rushed.disinfection.contactMin.toFixed(1)} min`,
		rushed.goals.map((g) => `${g.id}:${g.ok ? 'ok' : 'non'}`).join(' ')
	);
}
assert(at(175).goals.find((g) => g.id === 'turb')?.ok, 'la pointe doit démarrer avec une eau correcte');
assert(at(200).goals.find((g) => g.id === 'turb')?.ok, '200 m³/h doit garder la turbidité');
assert(at(300).goals.find((g) => g.id === 'turb')?.ok === false, '300 m³/h doit dégrader la turbidité');

function simulate(flow: number | null, minutes: number) {
	let acc = { ...pointe.initialAccumulators };
	const settings = {
		...pointe.initialSettings,
		...(flow == null
			? {}
			: { intakeFlowM3h: flow, settlingFlowM3h: flow, filtrationFlowM3h: flow })
	};
	let won = false;
	for (let i = 0; i < minutes; i++) {
		const ev = evaluate(plant, pointe, settings, acc, { flood: false, degraded: false });
		if (ev.succeeded) won = true;
		acc = stepAccumulators(plant, ev, acc, 1 / 60);
	}
	const end = evaluate(plant, pointe, settings, acc, { flood: false, degraded: false });
	console.log(
		`pointe ${minutes} min à ${flow ?? 'réglage initial'} → réservoir ${(end.storage.ratio * 100).toFixed(0)} % réussi ${won} objectifs ${end.allGoalsMet}`
	);
	return { won, end };
}

const idle = simulate(null, 40);
assert(!idle.won, 'ne rien faire ne doit pas suffire face à la pointe');
const steady = simulate(200, 40);
assert(steady.won, 'tenir 200 m³/h devrait permettre de passer la pointe');

console.log('simulation pédagogique OK');
console.log(
	`démo coagulation : ${demo.turbidityNtu.toFixed(1)} NTU, ${(demo.efficiency * 100).toFixed(0)} %`
);
