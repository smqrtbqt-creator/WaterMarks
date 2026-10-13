import { evaluate, hoclFraction, kineticFactor, numbersAreFinite, pKa, readSettings, residualCurve } from '../src/lib/disinfection/engine';
import { evaluateGoals, scenarioById } from '../src/lib/disinfection/scenarios';
import { UNITS } from '../src/lib/disinfection/types';
import type { SafetyFlags, Settings } from '../src/lib/disinfection/types';

function assert(condition: unknown, message: string) {
	if (!condition) throw new Error(message);
}

const quiet: SafetyFlags = { evacuate: false, isolate: false, alert: false, approach: false, waterOnLeak: false };

assert(typeof UNITS.freeMgL === 'string' && UNITS.contactMin === 'min', 'unités');
assert(pKa(5) > pKa(25), `pKa plus haut à froid ${pKa(5)} vs ${pKa(25)}`);
assert(Math.abs(pKa(25) - 7.54) < 0.05, `pKa 25 °C ${pKa(25)}`);

const warm = hoclFraction(7.5, 25);
const cold = hoclFraction(7.5, 5);
assert(cold > warm, `plus de HOCl à froid ${cold} vs ${warm}`);
assert(Math.abs(hoclFraction(7, 20) + (1 - hoclFraction(7, 20)) - 1) < 1e-9, 'HOCl + OCl = 1');
assert(hoclFraction(6.5, 20) > 0.8, `HOCl à pH 6,5 ${hoclFraction(6.5, 20)}`);
assert(hoclFraction(8.8, 20) < 0.2, `HOCl à pH 8,8 ${hoclFraction(8.8, 20)}`);
assert(kineticFactor(25) > kineticFactor(5), 'cinétique plus rapide à chaud');

const base = scenarioById('nominal').settings;
const lowPh = evaluate({ ...base, ph: 6.8 });
const highPh = evaluate({ ...base, ph: 8.8 });
assert(Math.abs(lowPh.balance.freeMgL - highPh.balance.freeMgL) < 1e-9, 'le pH ne change pas le résiduel si la demande est la même');
assert(lowPh.balance.hoclFraction > highPh.balance.hoclFraction, 'HOCl baisse quand le pH monte');
assert(lowPh.organisms[0].remaining < highPh.organisms[0].remaining, 'les bactéries répondent au HOCl, pas seulement à la dose');
assert(highPh.explanations.some((line) => line.includes('HOCl')), 'explication de pH');

const demand = evaluate({ ...base, doseMgL: 0.4, demandMgL: 1.5, contactMin: 40, combinedPotentialMgL: 0 });
assert(demand.balance.consumedMgL > demand.balance.freeMgL, `demande ${demand.balance.consumedMgL} libre ${demand.balance.freeMgL}`);
assert(Math.abs(demand.balance.injectedMgL - (demand.balance.consumedMgL + demand.balance.totalMgL)) < 1e-9, 'bilan de masse');
const combined = evaluate({ ...base, doseMgL: 1.2, demandMgL: 0.2, contactMin: 40, combinedPotentialMgL: 0.35 });
assert(Math.abs(combined.balance.totalMgL - (combined.balance.freeMgL + combined.balance.combinedMgL)) < 1e-9, 'total = libre + combiné');
assert(combined.balance.combinedMgL > 0.2, `combiné ${combined.balance.combinedMgL}`);
assert(combined.balance.freeMgL < combined.balance.totalMgL, 'le combiné n’est pas du libre');

const shortContact = evaluate({ ...base, contactMin: 2, demandMgL: 0.05, combinedPotentialMgL: 0 });
const longContact = evaluate({ ...base, contactMin: 40, demandMgL: 0.05, combinedPotentialMgL: 0 });
assert(longContact.organisms[0].log10Reduction > shortContact.organisms[0].log10Reduction, 'le temps de contact compte');
assert(longContact.explanations.some((line) => line.includes('temps de contact')) || shortContact.explanations.some((line) => line.includes('temps de contact')), 'explication du temps');

const cryptoOnly = evaluate({
	...scenarioById('crypto').settings,
	doseMgL: 5,
	contactMin: 90,
	ph: 6.6,
	temperatureC: 25,
	turbidityNtu: 0.2,
	filtrationAid: 0,
	uvAid: false,
	ozoneAid: false,
	membraneAid: false
});
assert(cryptoOnly.organisms[3].remaining > 50, `chlore seul sur Cryptosporidium ${cryptoOnly.organisms[3].remaining}`);
const cryptoUv = evaluate({ ...cryptoOnly.settings, uvAid: true });
assert(cryptoUv.organisms[3].remaining < cryptoOnly.organisms[3].remaining / 2, `UV ${cryptoUv.organisms[3].remaining}`);

const lost = evaluate({ ...base, probeMode: 'lost' });
assert(lost.probeMgL === null, 'signal perdu');
assert(lost.alerts.some((alert) => alert.id === 'probe-lost'), 'alerte signal');
assert(lost.dpdMgL === lost.balance.freeMgL, 'le DPD reste la référence');

const invalid = readSettings({ ph: Number.NaN, doseMgL: -3, contactMin: 400 });
assert(invalid.issues.length >= 2, 'entrées invalides signalées');
const invalidEval = evaluate({ ph: Number.NaN, doseMgL: -3 });
assert(numbersAreFinite(invalidEval), 'sorties bornées malgré l’entrée invalide');

const once = evaluate(base);
const twice = evaluate(base);
assert(JSON.stringify(once) === JSON.stringify(twice), 'déterministe');
assert(numbersAreFinite(once), 'nominal fini');

const curve = residualCurve(base, 7);
assert(curve[0].minute === 0 && curve.at(-1)?.minute === 60, 'courbe 0 à 60 min');
assert(curve.every((point) => point.injectedMgL === base.doseMgL), 'dose injectée constante');
assert(curve.at(-1)!.freeMgL <= curve.at(-1)!.injectedMgL, 'le résiduel ne dépasse pas l’injecté');

const nominalGoals = evaluateGoals('nominal', once, quiet);
assert(nominalGoals.every((goal) => goal.ok), nominalGoals.filter((goal) => !goal.ok).map((goal) => `${goal.id}:${goal.detail}`).join(' | '));

const phStart = evaluate(scenarioById('ph').settings);
assert(evaluateGoals('ph', phStart, quiet).some((goal) => !goal.ok), 'pH défavorable au départ');
const phTuned = evaluate({ ...scenarioById('ph').settings, ph: 7.2 });
assert(evaluateGoals('ph', phTuned, quiet).every((goal) => goal.ok), evaluateGoals('ph', phTuned, quiet).filter((g) => !g.ok).map((g) => g.detail).join(' | '));

const demandStart = evaluate(scenarioById('demande').settings);
assert(evaluateGoals('demande', demandStart, quiet).some((goal) => !goal.ok), 'demande non résolue');
const demandTuned = evaluate({ ...scenarioById('demande').settings, doseMgL: 2.1 });
assert(evaluateGoals('demande', demandTuned, quiet).every((goal) => goal.ok), evaluateGoals('demande', demandTuned, quiet).map((g) => `${g.id}:${g.ok}:${g.detail}`).join(' | '));

const turbStart = evaluate(scenarioById('turbidite').settings);
assert(evaluateGoals('turbidite', turbStart, quiet).some((goal) => !goal.ok), 'turbidité ouverte');
const turbTuned = evaluate({ ...scenarioById('turbidite').settings, filtrationAid: 100 });
assert(evaluateGoals('turbidite', turbTuned, quiet).every((goal) => goal.ok), evaluateGoals('turbidite', turbTuned, quiet).map((g) => `${g.id}:${g.ok}:${g.detail}`).join(' | '));

const cryptoStart = evaluate(scenarioById('crypto').settings);
assert(evaluateGoals('crypto', cryptoStart, quiet).some((goal) => !goal.ok), 'crypto ouvert');
assert(evaluateGoals('crypto', evaluate({ ...scenarioById('crypto').settings, doseMgL: 6 }), quiet).some((goal) => !goal.ok), 'plus de chlore ne suffit pas');
assert(evaluateGoals('crypto', evaluate({ ...scenarioById('crypto').settings, uvAid: true }), quiet).every((goal) => goal.ok), 'UV pédagogique');

const drift = evaluate(scenarioById('derive').settings);
assert(drift.probeMgL !== null && Math.abs(drift.probeMgL - drift.dpdMgL) > 0.2, 'écart de sonde');
assert(evaluateGoals('derive', drift, quiet).some((goal) => !goal.ok), 'dérive ouverte');
assert(evaluateGoals('derive', evaluate({ ...drift.settings, probeMode: 'calibrated', probeDriftMgL: 0 }), quiet).every((goal) => goal.ok), 'étalonnage');

const signal = evaluate(scenarioById('signal').settings);
assert(evaluateGoals('signal', signal, quiet).some((goal) => !goal.ok), 'signal perdu au départ');
assert(evaluateGoals('signal', evaluate({ ...signal.settings, useDpdAsReference: true }), quiet).every((goal) => goal.ok), 'DPD compensatoire');

const byStart = evaluate(scenarioById('sous-produits').settings);
assert(byStart.byproductRisk > 40, `sous-produits ${byStart.byproductRisk}`);
assert(evaluateGoals('sous-produits', byStart, quiet).some((goal) => !goal.ok), 'sous-produits ouverts');
const byTuned = evaluate({ ...scenarioById('sous-produits').settings, doseMgL: 1.1, organic: 18, contactMin: 30, ph: 7.3 });
assert(evaluateGoals('sous-produits', byTuned, quiet).every((goal) => goal.ok), evaluateGoals('sous-produits', byTuned, quiet).map((g) => `${g.id}:${g.ok}:${g.detail}`).join(' | '));

assert(evaluateGoals('securite', once, quiet).some((goal) => !goal.ok), 'fuite non traitée');
assert(
	evaluateGoals('securite', once, { evacuate: true, isolate: true, alert: true, approach: true, waterOnLeak: false }).some((goal) => !goal.ok),
	'intervenir sur la fuite échoue'
);
assert(
	evaluateGoals('securite', once, { evacuate: true, isolate: true, alert: true, approach: false, waterOnLeak: false }).every((goal) => goal.ok),
	'évacuer et alerter'
);

const membrane = evaluate({ ...base, membraneAid: true });
assert(membrane.balance.freeMgL === once.balance.freeMgL, 'la membrane ne crée pas de chlore');
assert(membrane.settings.organic === once.settings.organic, 'la membrane pédagogique ne retire pas toute la matière organique dissoute');

console.log('desinfection ok');
