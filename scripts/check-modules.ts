import assert from 'node:assert/strict';
import { MONSTERS, canBeat, canFace, damageOf, emptySave, hpOf, levelOf, sanitizeSave, solve, strike, tempoOf } from '../src/lib/game/flaque.ts';
import { CALCITE_KS, IRON_K, gibbsReading, qrCalcite, qrDenitrification, qrIron } from '../src/lib/modules/gibbs.ts';
import { headM, levelAfter, powerKw, pumpFlowM3h } from '../src/lib/modules/pump.ts';
import { PLACES, sample } from '../src/lib/modules/watershed.ts';

assert.equal(pumpFlowM3h(0), 0);
assert.equal(powerKw(0, 20), 0);
assert.ok(headM(20, 120) > headM(20, 20));
assert.ok(levelAfter(50, 100, 40, 1) > 50);
assert.ok(levelAfter(50, 20, 80, 1) < 50);
assert.equal(levelAfter(10, 0, 500, 5), 0);

const field = PLACES.find((place) => place.id === 'champ');
assert.ok(field);
const dry = sample(field, 'sec');
const rain = sample(field, 'pluie');
const spread = sample(field, 'epandage');
assert.ok(rain.turbidity > dry.turbidity);
assert.ok(rain.nitrate < dry.nitrate);
assert.ok(spread.nitrate > dry.nitrate);

const balanced = gibbsReading(2, 2, 25);
assert.ok(Math.abs(balanced.deltaGkj) < 1e-9);
assert.equal(balanced.sense, 'equilibre');
const forward = gibbsReading(0.1, 10, 12);
assert.ok(forward.deltaGkj < 0);
assert.equal(forward.sense, 'direct');
const back = gibbsReading(10, 0.1, 12);
assert.ok(back.deltaGkj > 0);
assert.equal(back.sense, 'inverse');

const qDenit = qrDenitrification(1e-3, 0.8, 2e-3, 4e-4);
assert.ok(qDenit > 0 && Number.isFinite(qDenit));
const dissolved = qrCalcite(1e-4, 1e-6);
assert.ok(dissolved < CALCITE_KS);
const scaling = qrCalcite(1e-3, 1e-4);
assert.ok(scaling > CALCITE_KS);

const denitUi = (no3: number, hco3: number, n2: number, co2Mbar: number) =>
	qrDenitrification(no3 / 1000, n2, hco3 / 1000, co2Mbar / 1000);
assert.equal(gibbsReading(denitUi(0.5, 2, 0.8, 1), 1, 15).sense, 'direct');
assert.equal(gibbsReading(denitUi(0.5, 3.2, 0.8, 1), 1, 15).sense, 'equilibre');
assert.equal(gibbsReading(denitUi(0.5, 4, 0.8, 1), 1, 15).sense, 'inverse');
assert.equal(gibbsReading(denitUi(0.3, 2, 0.8, 1), 1, 15).sense, 'inverse');

const calciteUi = (ca: number, co3: number) => qrCalcite(ca / 40080, co3 / 60000);
assert.equal(gibbsReading(calciteUi(40, 0.15), CALCITE_KS, 15).sense, 'direct');
assert.equal(gibbsReading(calciteUi(40, 0.2), CALCITE_KS, 15).sense, 'equilibre');
assert.equal(gibbsReading(calciteUi(40, 0.4), CALCITE_KS, 15).sense, 'inverse');

const ironUi = (fe2: number, fe3: number, o2: number, ph: number) => qrIron(fe2 / 1e6, fe3 / 1e6, o2, ph);
assert.equal(gibbsReading(ironUi(5, 1, 0.21, 7), IRON_K, 15).sense, 'direct');
assert.equal(gibbsReading(ironUi(5, 2, 0.21, 7), IRON_K, 15).sense, 'inverse');
assert.equal(gibbsReading(ironUi(5, 1, 0.21, 6.6), IRON_K, 15).sense, 'direct');
assert.equal(gibbsReading(ironUi(5, 1, 0.21, 7.4), IRON_K, 15).sense, 'inverse');

let save = emptySave();
assert.equal(levelOf(save), 1);
assert.equal(damageOf(save), 0.2);
const canard = MONSTERS[0];
const nitrate = MONSTERS[1];
const turbine = MONSTERS[2];
const kraken = MONSTERS[3];
assert.equal(canBeat(save, canard), false);
assert.equal(canFace(save, canard), false);
assert.equal(canFace(save, kraken), false);
const once = solve(save, 'bache');
assert.equal(once.fresh, true);
assert.equal(solve(once.save, 'bache').fresh, false);
save = once.save;
assert.equal(levelOf(save), 2);
assert.equal(canFace(save, canard), true);
assert.equal(canBeat(save, canard), true);
assert.equal(canFace(save, nitrate), false);
assert.equal(canFace(save, kraken), false);
assert.ok(strike(save, canard, 80, 90).green > strike(save, canard, 500, 90).green);
assert.ok(strike(save, canard, 80, 90).red < strike(save, canard, 500, 90).red);
assert.equal(tempoOf(80), 2);
for (const id of ['hstat', 'ruisseau', 'bascule'] as const) save = solve(save, id).save;
assert.equal(levelOf(save), 5);
assert.equal(canFace(save, turbine), true);
assert.equal(canBeat(save, turbine), true);
assert.equal(canFace(save, kraken), false);
assert.equal(canBeat(save, kraken), false);
let strongestFour = emptySave();
for (const id of ['hstat', 'ruisseau', 'bascule', 'riviere'] as const) strongestFour = solve(strongestFour, id).save;
assert.equal(canBeat(strongestFour, kraken), false);
assert.equal(canFace(strongestFour, kraken), false);
save = solve(save, 'riviere').save;
assert.equal(levelOf(save), 6);
assert.equal(canBeat(save, kraken), true);
assert.equal(canFace(save, kraken), true);
const kept = sanitizeSave(JSON.parse(JSON.stringify(save)));
assert.deepEqual(kept.solved, save.solved);
assert.equal(hpOf(kept), hpOf(save));
assert.equal(damageOf(kept), damageOf(save));
assert.equal(canFace(kept, kraken), true);

console.log('check-modules: ok');
