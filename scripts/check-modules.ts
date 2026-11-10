import assert from 'node:assert/strict';
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

console.log('check-modules: ok');
