import assert from 'node:assert/strict';
import '../data/claim.js';
import '../data/sources.js';
import '../data/plots.js';
import '../logic/calc.js';
import '../logic/hypothesis.js';
import '../logic/sources.js';
import '../logic/conclusion.js';

const { calc, hypothesis, claim, sourcesLogic, catalog, plots, conclusion } = globalThis.InfoAgri;

const plotReview = calc.reviewPlot({
  volume: '-20',
  waterA: '100',
  waterB: '88,9',
  efficiency: '-11,1',
  drop30: '700',
}, plots.plot);

assert.strictEqual(plotReview.volumeOk, true);
assert.strictEqual(plotReview.waterAOk, true);
assert.strictEqual(plotReview.waterBOk, true);
assert.strictEqual(plotReview.efficiencyOk, true);
assert.strictEqual(plotReview.drop30Ok, true);
assert.ok(Math.abs(calc.percentChange(1000, 800) + 20) < 0.001);
assert.ok(Math.abs(calc.perUnit(800, 9) - (800 / 9)) < 0.001);
assert.strictEqual(calc.reviewPlot({ volume: '-30', waterA: '100', waterB: '88,9', efficiency: '-20', drop30: '800' }, plots.plot).volumeOk, false);

const answers = {};
claim.questions.forEach((question) => {
  answers[question.id] = question.expected.slice();
});
assert.strictEqual(hypothesis.missionReady(claim.questions, answers), true);
assert.strictEqual(hypothesis.reviewQuestion(claim.questions[0], ['prix']).ok, false);

const arvalis = plots.facts.find((fact) => fact.id === 'arvalis');
const sdes = plots.facts.find((fact) => fact.id === 'sdes');
const affirmation = plots.facts.find((fact) => fact.id === 'affirmation');
assert.strictEqual(calc.compareFacts(arvalis, sdes).comparable, false);
assert.strictEqual(calc.compareFacts(sdes, affirmation).comparable, false);

const quick = {};
const fiches = {};
catalog.sources.forEach((source) => {
  quick[source.id] = source.quick.expected;
  fiches[source.id] = {};
  source.fiche.forEach((field) => {
    fiches[source.id][field.id] = field.expected;
  });
});
assert.strictEqual(sourcesLogic.familiesReady(catalog.sources, { quick, fiches }).ready, true);
catalog.sources.forEach((source) => {
  if (source.family === 'temoignage' && source.id !== 'adele') fiches[source.id] = {};
});
assert.strictEqual(sourcesLogic.familiesReady(catalog.sources, { quick, fiches }).ready, true);
const agresteFiche = fiches.agreste;
fiches.agreste = {};
assert.strictEqual(sourcesLogic.familiesReady(catalog.sources, { quick, fiches }).statsDone, false);
fiches.agreste = agresteFiche;
quick.arvalis = 'nom';
assert.strictEqual(sourcesLogic.familiesReady(catalog.sources, { quick, fiches }).ready, false);

const goodEnd = conclusion.review({
  choice: 'insuffisant',
  ticks: ['essai', 'autre-indicateur', 'absence'],
  text: 'L’essai de Pusignan ne montre pas les 30 %, et les hectares nationaux ne mesurent pas la même chose. Ce manque de preuve ne dit pas que la pratique n’économise jamais d’eau.',
});
assert.strictEqual(goodEnd.ok, true);
assert.strictEqual(conclusion.review({
  choice: 'contredite',
  ticks: ['essai', 'absence', 'simulation'],
  text: 'L’essai ne montre pas les 30 %, donc la pratique n’économise jamais d’eau, dans aucune ferme.',
}).ok, false);
assert.strictEqual(conclusion.review({ choice: 'etayee', ticks: ['essai', 'absence', 'simulation'], text: 'Les 30 % sont prouvés par le nom des sites officiels du dossier.' }).ok, false);

assert.strictEqual(catalog.sources.length, 10);
assert.ok(catalog.sources.every((source) => source.url.startsWith('https://')));
assert.strictEqual(catalog.sources.find((source) => source.id === 'villedieu').status, 'maintenance');
assert.strictEqual(catalog.sources.find((source) => source.id === 'memento').status, 'erreur');

console.log('check-info: ok');
