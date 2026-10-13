import { CASES, caseById } from '../src/lib/simulator/cases';
import { h2sAccounted, ironTotal, manganeseTotal, simulate } from '../src/lib/simulator/engine';
import { defaultSettings } from '../src/lib/simulator/treatments';
import { MODULE_ORDER, type ModuleId, type TrainSettings } from '../src/lib/simulator/types';
import { judge } from '../src/lib/simulator/validation';

function assert(condition: unknown, message: string) {
	if (!condition) throw new Error(message);
}

function train(ids: ModuleId[], patch: Partial<TrainSettings> = {}): TrainSettings {
	const settings = defaultSettings();
	Object.assign(settings, patch);
	for (const id of MODULE_ORDER) settings.enabled[id] = ids.includes(id);
	return settings;
}

assert(CASES.length === 10, `dix cas, reçu ${CASES.length}`);
const ids = new Set(CASES.map((item) => item.id));
assert(ids.size === 10, 'identifiants de cas uniques');

for (const study of CASES) {
	assert(study.rows.some((row) => row.status === 'measured' && row.unit !== undefined), `${study.id} a des mesures`);
	assert(study.rows.some((row) => row.status === 'missing'), `${study.id} a une donnée manquante`);
	assert(study.hints.length === 3, `${study.id} a trois niveaux d’aide`);
	assert(study.problems.length >= 1, `${study.id} a un diagnostic`);
	const again = simulate(study.water, defaultSettings(study.moleculeId));
	const twice = simulate(study.water, defaultSettings(study.moleculeId));
	assert(JSON.stringify(again.after) === JSON.stringify(twice.after), `${study.id} reproductible`);
	for (const value of Object.values(again.after)) {
		assert(typeof value === 'number' && Number.isFinite(value) && value >= 0, `${study.id} valeur incohérente ${value}`);
	}
}

const fer = caseById('fer');
const ferFilterOnly = simulate(fer.water, train(['filtration'], { filterState: 0 }));
assert(ferFilterOnly.after.ironDissolvedMgL > 1.5, `le filtre laisse le fer dissous ${ferFilterOnly.after.ironDissolvedMgL}`);
assert(Math.abs(ironTotal(ferFilterOnly.after) - 2) < 0.05, 'bilan fer sans oxydation');

const ferLow = simulate(fer.water, train(['oxidation'], { oxidant: 'chlorine', oxidantDose: 1.5, oxidantContactMin: 15 }));
const ferHigh = simulate(fer.water, train(['oxidation'], { oxidant: 'chlorine', oxidantDose: 3, oxidantContactMin: 15 }));
const lowRemoval = 1 - ferLow.after.ironDissolvedMgL / 2;
const highRemoval = 1 - ferHigh.after.ironDissolvedMgL / 2;
assert(highRemoval > lowRemoval, 'une dose plus forte oxyde davantage');
assert(highRemoval < lowRemoval * 1.5, `doubler la dose ne double pas le rendement ${lowRemoval} -> ${highRemoval}`);
assert(Math.abs(ironTotal(ferLow.after) - ironTotal(fer.water)) < 1e-6, 'oxydation : bilan de fer');

const ferOk = simulate(
	fer.water,
	train(['oxidation', 'filtration'], { oxidant: 'chlorine', oxidantDose: 2.5, oxidantContactMin: 20, filterState: 0, filterRate: 6 })
);
const ferJudge = judge(fer, ferOk, train(['oxidation', 'filtration'], { oxidant: 'chlorine', oxidantDose: 2.5, oxidantContactMin: 20, filterState: 0, filterRate: 6 }));
assert(ironTotal(ferOk.after) <= 0.2, `fer total ${ironTotal(ferOk.after)}`);
assert(ferOk.after.turbidityNtu <= 1, `turbidité après fer ${ferOk.after.turbidityNtu}`);
assert(ferJudge.status === 'atteint', ferJudge.title);
assert(ferJudge.lines.some((line) => line.includes('potable')), 'la limite de conclusion est écrite');
assert(!ferJudge.title.toLowerCase().includes('potable'), 'le statut ne déclare pas l’eau potable');

const turb = caseById('turbidite');
const turbBad = simulate(
	turb.water,
	train(['coagulation', 'filtration'], { coagulant: 'alum', coagulantDose: 1, coagContactMin: 15, coagMix: 80, filterState: 0 })
);
assert(turbBad.after.turbidityNtu > 2, `mauvais dosage encore trouble ${turbBad.after.turbidityNtu}`);
const turbOk = simulate(
	turb.water,
	train(['coagulation', 'settling', 'filtration'], {
		coagulant: 'alum',
		coagulantDose: 10,
		coagContactMin: 15,
		coagMix: 80,
		settlingMin: 30,
		filterState: 0
	})
);
assert(turbOk.after.turbidityNtu <= 1, `turbidité traitée ${turbOk.after.turbidityNtu}`);
assert(judge(turb, turbOk, train(['coagulation', 'filtration'])).status === 'atteint', 'cas turbidité');

const nitrates = caseById('nitrates');
const soft = simulate(nitrates.water, train(['softening'], { softenerCapacity: 100 }));
assert(Math.abs(soft.after.nitrateMgL - 78) < 1e-6, 'l’adoucisseur ne retire pas les nitrates');
const resin = simulate(nitrates.water, train(['nitrate'], { nitrateTech: 'resin', nitrateCapacity: 90, nitrateRate: 70 }));
assert(resin.after.nitrateMgL <= 50, `résine ${resin.after.nitrateMgL}`);
assert(resin.after.microbial <= 5, 'la résine ne dégrade pas l’indicateur');
const emptyResin = simulate(nitrates.water, train(['nitrate'], { nitrateTech: 'resin', nitrateCapacity: 0, nitrateRate: 70 }));
assert(emptyResin.after.nitrateMgL > 70, 'résine épuisée');
const bio = simulate(nitrates.water, train(['nitrate'], { nitrateTech: 'biological', nitrateRate: 80, nitrateCapacity: 80 }));
assert(bio.after.nitrateMgL <= 50, `biologie ${bio.after.nitrateMgL}`);
assert(bio.after.microbial > nitrates.water.microbial + 3, 'la biologie augmente l’indicateur');
assert(judge(nitrates, bio, train(['nitrate'], { nitrateTech: 'biological' })).status === 'partiel', 'nitrates sans désinfection');

const microbes = caseById('microbes');
const uvDirty = simulate(microbes.water, train(['uv'], { uvDose: 40, uvFlow: 20, sourceInvestigated: true }));
assert(uvDirty.after.microbial > 8, `UV sur eau trouble ${uvDirty.after.microbial}`);
const uvClear = simulate(
	microbes.water,
	train(['coagulation', 'filtration', 'uv'], {
		coagulant: 'alum',
		coagulantDose: 8,
		coagContactMin: 16,
		coagMix: 80,
		filterState: 0,
		uvDose: 40,
		uvFlow: 20,
		sourceInvestigated: true
	})
);
assert(uvClear.after.microbial <= 8, `UV après clarification ${uvClear.after.microbial}`);
assert(uvClear.after.turbidityNtu <= 1, `clarification microbes ${uvClear.after.turbidityNtu}`);

const hard = caseById('durete');
const exhausted = simulate(hard.water, train(['softening'], { softenerCapacity: 0 }));
assert(Math.abs(exhausted.after.hardnessF - 35) < 1e-6, 'capacité nulle');
const softened = simulate(hard.water, train(['softening'], { softenerCapacity: 100 }));
assert(softened.after.hardnessF <= 20, `dureté ${softened.after.hardnessF}`);
assert(softened.after.calciumF < 22 && softened.after.magnesiumF < 13, 'Ca et Mg baissent');

const acid = caseById('acide');
const soda = simulate(acid.water, train(['neutralization'], { neutralReagent: 'soda', neutralDose: 40, neutralTargetPh: 7.6 }));
const sodaJudge = judge(acid, soda, train(['neutralization'], { neutralReagent: 'soda', neutralDose: 40, neutralTargetPh: 7.6 }));
assert(soda.after.ph >= 6.5 && soda.after.ph <= 9, `soude pH ${soda.after.ph}`);
assert(soda.after.calciumF < 8, 'la soude n’apporte pas le calcium');
assert(sodaJudge.status === 'partiel', sodaJudge.title);
const lime = simulate(acid.water, train(['neutralization'], { neutralReagent: 'lime', neutralDose: 40, neutralTargetPh: 7.4 }));
assert(judge(acid, lime, train(['neutralization'], { neutralReagent: 'lime' })).status === 'atteint', `chaux pH ${lime.after.ph} Ca ${lime.after.calciumF} alk ${lime.after.alkalinityF}`);

const mn = caseById('manganese');
const mnChlorine = simulate(
	mn.water,
	train(['oxidation', 'filtration'], { oxidant: 'chlorine', oxidantDose: 2, oxidantContactMin: 25, filterState: 0 })
);
assert(manganeseTotal(mnChlorine.after) > 0.1, `chlore à pH 7 ${manganeseTotal(mnChlorine.after)}`);
const mnOk = simulate(
	mn.water,
	train(['oxidation', 'filtration'], { oxidant: 'permanganate', oxidantDose: 1.2, oxidantContactMin: 20, filterState: 0, filterMedia: 'manganese' })
);
assert(manganeseTotal(mnOk.after) <= 0.05, `permanganate ${manganeseTotal(mnOk.after)}`);

const h2s = caseById('h2s');
const stripped = simulate(h2s.water, train(['aeration'], { airIntensity: 90, airContactMin: 20, airFlow: 120 }));
assert(Math.abs(h2sAccounted(stripped.after) - 0.08) < 1e-6, `bilan H2S aération ${h2sAccounted(stripped.after)}`);
assert(stripped.after.h2sStrippedMgL > 0.05, 'transfert vers l’air');
assert(stripped.after.h2sOxidizedMgL === 0, 'l’aération ne détruit pas le H2S');
assert(stripped.after.h2sMgL <= 0.01, `H2S eau ${stripped.after.h2sMgL}`);
const oxidized = simulate(h2s.water, train(['oxidation'], { oxidant: 'chlorine', oxidantDose: 1, oxidantContactMin: 15 }));
assert(Math.abs(h2sAccounted(oxidized.after) - 0.08) < 1e-6, 'bilan H2S oxydation');
assert(oxidized.after.h2sStrippedMgL === 0, 'pas de transfert gazeux');
assert(oxidized.after.h2sOxidizedMgL > 0.05, 'destruction chimique');
assert(judge(h2s, stripped, train(['aeration'])).gasAlert, 'alerte H2S');

const organic = caseById('organique');
const bioOnly = simulate(organic.water, train(['filtration'], { filterMedia: 'bio', filterState: 0 }));
assert(bioOnly.after.tocMgL > 5 && bioOnly.after.tocMgL < 12, `bio ${bioOnly.after.tocMgL}`);
const carbon = simulate(organic.water, train(['carbon'], { carbonType: 'gac', carbonContactMin: 22, carbonSaturation: 0 }));
assert(carbon.after.tocMgL <= 5, `charbon ${carbon.after.tocMgL}`);
const spent = simulate(organic.water, train(['carbon'], { carbonType: 'gac', carbonContactMin: 22, carbonSaturation: 90 }));
assert(spent.after.tocMgL > 9, `charbon saturé ${spent.after.tocMgL}`);

const pest = caseById('pesticides');
const gac = simulate(pest.water, train(['carbon'], { carbonType: 'gac', carbonContactMin: 22, carbonSaturation: 0, moleculeId: 'cas' }));
assert(gac.after.pesticideUgL <= 0.1, `molécule du cas ${gac.after.pesticideUgL}`);
const weak = simulate(pest.water, train(['carbon'], { carbonType: 'gac', carbonContactMin: 22, carbonSaturation: 0, moleculeId: 'faible' }));
assert(weak.after.pesticideUgL > 0.15, `molécule peu adsorbable ${weak.after.pesticideUgL}`);
const uf = simulate(pest.water, train(['membrane'], { membrane: 'uf', membranePressure: 4, moleculeId: 'cas' }));
assert(Math.abs(uf.after.pesticideUgL - 0.25) < 1e-6, 'l’ultrafiltration ne retire pas le pesticide');

const dirty = defaultSettings();
dirty.oxidantDose = Number.NaN;
dirty.coagulantDose = -20;
dirty.neutralReagent = 'inconnu' as TrainSettings['neutralReagent'];
const safe = simulate(fer.water, dirty);
assert(safe.issues.length > 0, 'données invalides signalées');
assert(safe.after.ironDissolvedMgL >= 0 && Number.isFinite(safe.after.ph), 'pas de NaN en sortie');

const restart = simulate(fer.water, defaultSettings());
assert(JSON.stringify(restart.after) === JSON.stringify(simulate(fer.water, defaultSettings()).after), 'recommencer restaure le même calcul');

console.log('simulateur ok');
