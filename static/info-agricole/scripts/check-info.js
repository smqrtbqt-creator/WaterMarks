import assert from 'node:assert/strict';
import '../data/claim.js';
import '../data/sources.js';
import '../data/plots.js';
import '../logic/calc.js';
import '../logic/hypothesis.js';
import '../logic/sources.js';
import '../logic/conclusion.js';

import '../data/graph.js';
import '../logic/graph.js';
import '../ui/map.js';

const { calc, hypothesis, claim, sourcesLogic, catalog, plots, conclusion, graph, map } = globalThis.InfoAgri;

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

const seeded = graph.seed(claim.statement, catalog.sources);
assert.strictEqual(seeded.nodes.filter((node) => node.type === 'source').length, 10);
assert.strictEqual(seeded.relations.length, 0);
assert.ok(seeded.nodes.every((node) => node.type !== 'source' || node.author === ''));
assert.strictEqual(graph.orphanRelations(seeded).length, 0);

const created = graph.addNode(seeded, { id: 'preuve-1', type: 'preuve', x: 10, y: 20, title: 'Essai de Pusignan', reference: '' });
assert.strictEqual(created.ok, true);
const edited = graph.updateNode(created.graph, 'preuve-1', { reference: 'ARVALIS, 2 août 2018' });
assert.strictEqual(graph.nodeById(edited.graph, 'preuve-1').reference, 'ARVALIS, 2 août 2018');
const linked = graph.addRelation(edited.graph, { id: 'rel-1', from: 'preuve-1', to: 'aff-eau', type: 'etaye', justification: 'Même volume, rendement semblable.' });
assert.strictEqual(linked.ok, true);
const invalid = graph.addRelation(linked.graph, { from: 'src-agreste', to: 'aff-eau', type: 'etaye' });
assert.strictEqual(invalid.ok, false);
const removed = graph.removeRelation(linked.graph, 'rel-1');
assert.strictEqual(removed.graph.relations.length, 0);
const gone = graph.removeNode(linked.graph, 'preuve-1');
assert.strictEqual(graph.orphanRelations(gone.graph).length, 0);
assert.strictEqual(gone.graph.relations.length, 0);

const roundTrip = graph.importInvestigation(graph.exportInvestigation(seeded));
assert.strictEqual(roundTrip.ok, true);
assert.strictEqual(roundTrip.graph.nodes.length, seeded.nodes.length);
assert.strictEqual(graph.importInvestigation({ format: 1 }).ok, false);
assert.strictEqual(graph.importInvestigation({ format: 99, nodes: [], relations: [], conclusion: { status: 'a-verifier', text: '', uncertainties: '' } }).ok, false);
const duplicate = graph.exportInvestigation(seeded);
duplicate.nodes.push(Object.assign({}, duplicate.nodes[0]));
assert.strictEqual(graph.importInvestigation(duplicate).ok, false);
const dangling = graph.exportInvestigation(seeded);
dangling.relations.push({ id: 'orpheline', from: 'absent', to: 'aff-eau', type: 'porte-sur', justification: '', independence: '' });
assert.strictEqual(graph.importInvestigation(dangling).ok, false);

const named = graph.updateNode(seeded, 'src-agreste', { documentId: 'communique-a', author: 'Agreste', date: '2024' });
const namedToo = graph.updateNode(named.graph, 'src-memento', { documentId: 'communique-a', author: 'Agreste', date: '2025' });
const firstConfirm = graph.addRelation(namedToo.graph, { id: 'c2', from: 'src-memento', to: 'aff-eau', type: 'confirme', independence: 'independante' });
const secondConfirm = graph.addRelation(firstConfirm.graph, { id: 'c3', from: 'src-agreste', to: 'aff-eau', type: 'confirme', independence: 'independante' });
assert.strictEqual(secondConfirm.ok, true);
assert.ok(graph.alerts(secondConfirm.graph).some((item) => item.text.includes('même identifiant de document')));
const unknown = graph.addRelation(seeded, { id: 'c1', from: 'src-wikipedia', to: 'aff-eau', type: 'confirme', independence: 'inconnue' });
assert.ok(graph.alerts(unknown.graph).some((item) => item.id === 'independance-c1'));
assert.ok(graph.alerts(seeded).some((item) => item.text.includes('pas encore de preuve')));
assert.ok(graph.alerts(seeded).some((item) => item.text.includes('Non vérifié ne veut pas dire faux')));

const nudged = graph.nudge(seeded, 'aff-eau', 'ArrowRight');
assert.strictEqual(graph.nodeById(nudged, 'aff-eau').x, graph.nodeById(seeded, 'aff-eau').x + 16);
const markup = map.mapMarkup(seeded, { x: 0, y: 0, scale: 1 }, 'aff-eau', '');
assert.ok(markup.includes('tabindex="0"'));
assert.ok(markup.includes('Suppr'));
assert.ok(markup.includes('aria-label'));

console.log('check-info: ok');
