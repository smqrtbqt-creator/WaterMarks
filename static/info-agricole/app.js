(function () {
  const data = window.InfoAgri;
  const claim = data.claim;
  const catalog = data.catalog;
  const plots = data.plots;
  const calc = data.calc;
  const hypothesis = data.hypothesis;
  const sourcesLogic = data.sourcesLogic;
  const conclusion = data.conclusion;
  const chart = data.chart;
  const graph = data.graph;
  const map = data.map;
  const app = document.querySelector('#app');
  const storageKey = 'info-agricole-lab-v1';
  let past = [];
  let future = [];
  let drag = null;

  const missions = [
    ['A', 'Hypothèse'],
    ['B', 'Sources'],
    ['C', 'Données'],
    ['D', 'Preuves'],
    ['E', 'Conclusion'],
    ['F', 'Carte'],
  ];

  const empty = () => ({
    mission: 'A',
    teacher: false,
    hints: {},
    openFiche: '',
    answersA: {},
    quick: {},
    fiches: {},
    calc: { volume: '', waterA: '', waterB: '', efficiency: '', drop30: '', interpretation: '' },
    pairs: {},
    rule: '',
    final: { choice: '', ticks: [], text: '' },
    graph: null,
    view: { x: 40, y: 40, scale: 1 },
    selected: '',
    query: '',
    relationError: '',
    importError: '',
  });

  let state = load();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!saved || typeof saved !== 'object') {
        const fresh = empty();
        fresh.graph = graph.seed(claim.statement, catalog.sources);
        return fresh;
      }
      const base = Object.assign(empty(), saved, {
        calc: Object.assign(empty().calc, saved.calc || {}),
        final: Object.assign(empty().final, saved.final || {}),
        view: Object.assign(empty().view, saved.view || {}),
      });
      base.graph = restoreGraph(saved.graph);
      return base;
    } catch (error) {
      const fresh = empty();
      fresh.graph = graph.seed(claim.statement, catalog.sources);
      return fresh;
    }
  }

  function restoreGraph(raw) {
    if (!raw) return graph.seed(claim.statement, catalog.sources);
    const result = graph.importInvestigation(raw);
    return result.ok ? result.graph : graph.seed(claim.statement, catalog.sources);
  }

  function remember() {
    past.push(graph.exportInvestigation(state.graph));
    if (past.length > 40) past.shift();
    future = [];
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      /* La séance continue même si le navigateur refuse l'enregistrement. */
    }
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function readyA() {
    return hypothesis.missionReady(claim.questions, state.answersA);
  }

  function readyB() {
    return sourcesLogic.familiesReady(catalog.sources, state).ready;
  }

  function plotReview() {
    return calc.reviewPlot(state.calc, plots.plot);
  }

  function readyC() {
    const review = plotReview();
    return review.volumeOk && review.waterAOk && review.waterBOk && review.efficiencyOk && review.drop30Ok && state.calc.interpretation === 'pas-30';
  }

  function readyD() {
    return plots.pairs.every((pair) => state.pairs[pair.id] === pair.expected) && state.rule === 'non';
  }

  function readyE() {
    return conclusion.review(state.final).ok;
  }

  function readyOf(id) {
    return { A: readyA, B: readyB, C: readyC, D: readyD, E: readyE, F: readyF }[id]();
  }

  function readyF() {
    return !!(state.graph && String(state.graph.conclusion.text || '').trim().length >= 20);
  }

  function fmt(value, digits) {
    return value.toFixed(digits).replace('.', ',').replace('-', '−');
  }

  app.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    const nodeEl = event.target.closest('[data-node]');
    if (nodeEl && !target) {
      state.selected = nodeEl.dataset.node;
      render();
      return;
    }
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'go') state.mission = target.dataset.mission;
    if (action === 'hint') state.hints[target.dataset.hint] = (state.hints[target.dataset.hint] || 0) + 1;
    if (action === 'teacher') state.teacher = !state.teacher;
    if (action === 'reset') {
      localStorage.removeItem(storageKey);
      state = empty();
      state.graph = graph.seed(claim.statement, catalog.sources);
      past = [];
      future = [];
    }
    if (action === 'export') download(studentText(), 'synthese-eleve.txt');
    if (action === 'export-teacher') download(teacherText(), 'lecture-enseignant.txt');
    if (action === 'open-fiche') state.openFiche = target.dataset.source;
    if (action === 'check') state.mission = state.mission;
    if (action === 'undo' && past.length) {
      future.push(graph.exportInvestigation(state.graph));
      state.graph = past.pop();
    }
    if (action === 'redo' && future.length) {
      past.push(graph.exportInvestigation(state.graph));
      state.graph = future.pop();
    }
    if (action === 'zoom-in') state.view.scale = Math.min(2, +(state.view.scale + 0.1).toFixed(2));
    if (action === 'zoom-out') state.view.scale = Math.max(0.35, +(state.view.scale - 0.1).toFixed(2));
    if (action === 'fit') state.view = graph.fitView(state.graph, 960, 640);
    if (action === 'add-node') {
      const id = 'n-' + Math.random().toString(36).slice(2, 10);
      const created = graph.addNode(state.graph, { id, type: target.dataset.type, x: 140, y: 120, title: 'Nouveau : ' + target.dataset.type });
      if (created.ok) {
        remember();
        state.graph = created.graph;
        state.selected = id;
      }
    }
    if (action === 'delete-node' && state.selected) {
      remember();
      state.graph = graph.removeNode(state.graph, state.selected).graph;
      state.selected = '';
    }
    if (action === 'delete-relation') {
      remember();
      state.graph = graph.removeRelation(state.graph, target.dataset.relation).graph;
    }
    if (action === 'add-relation') {
      const created = graph.addRelation(state.graph, {
        from: valueOf('#rel-from'),
        to: valueOf('#rel-to'),
        type: valueOf('#rel-type'),
        justification: valueOf('#rel-why'),
        independence: valueOf('#rel-indep') || 'inconnue',
      });
      state.relationError = created.ok ? '' : created.errors.join(' ');
      if (created.ok) {
        remember();
        state.graph = created.graph;
      }
    }
    if (action === 'add-extras') {
      remember();
      state.graph = graph.addSourceNodes(state.graph, catalog.extras);
    }
    if (action === 'export-json') download(JSON.stringify(graph.exportInvestigation(state.graph), null, 2), 'investigation.json', 'application/json');
    if (action === 'print') window.print();
    render();
  });

  app.addEventListener('change', (event) => {
    const input = event.target;
    if (input.dataset.question) {
      const selected = [...app.querySelectorAll('[data-question="' + input.dataset.question + '"]:checked')].map((node) => node.value);
      state.answersA[input.dataset.question] = selected;
    }
    if (input.dataset.quick) state.quick[input.dataset.quick] = input.value;
    if (input.dataset.fiche && input.dataset.field) {
      state.fiches[input.dataset.fiche] = Object.assign({}, state.fiches[input.dataset.fiche], { [input.dataset.field]: input.value });
    }
    if (input.dataset.pair) state.pairs[input.dataset.pair] = input.value;
    if (input.name === 'rule') state.rule = input.value;
    if (input.name === 'conclusion') state.final.choice = input.value;
    if (input.dataset.tick) {
      const ticks = new Set(state.final.ticks);
      if (input.checked) ticks.add(input.dataset.tick);
      else ticks.delete(input.dataset.tick);
      state.final.ticks = [...ticks];
    }
    if (input.name === 'interpretation') state.calc.interpretation = input.value;
    if (input.dataset.nodeField) {
      state.graph = graph.updateNode(state.graph, input.dataset.nodeId, fieldPatch(input)).graph;
    }
    if (input.name === 'invest-status') state.graph.conclusion.status = input.value;
    if (input.dataset.import != null) readImport(input.files && input.files[0]);
    render();
  });

  app.addEventListener('input', (event) => {
    const input = event.target;
    if (input.dataset.calc) {
      state.calc[input.dataset.calc] = input.value;
      save();
    }
    if (input.hasAttribute('data-final-text')) {
      state.final.text = input.value;
      save();
    }
    if (input.dataset.nodeField) {
      state.graph = graph.updateNode(state.graph, input.dataset.nodeId, fieldPatch(input)).graph;
      save();
      refreshAlerts();
    }
    if (input.hasAttribute('data-graph-query')) {
      state.query = input.value;
      save();
      const host = app.querySelector('.graph-host');
      if (host) host.innerHTML = map.mapMarkup(state.graph, state.view, state.selected, state.query);
    }
    if (input.dataset.invest) {
      state.graph.conclusion[input.dataset.invest] = input.value;
      save();
    }
  });

  function valueOf(selector) {
    const el = app.querySelector(selector);
    return el ? el.value : '';
  }

  function fieldPatch(input) {
    return { [input.dataset.nodeField]: input.value };
  }

  function alertsHtml() {
    const list = graph.alerts(state.graph);
    if (!list.length) return '<p>Aucune alerte pour le moment. Cela ne veut pas dire que l’affirmation est vraie.</p>';
    return '<ul>' + list.map((item) => '<li>' + esc(item.text) + '</li>').join('') + '</ul>';
  }

  function refreshAlerts() {
    const box = app.querySelector('#alerts');
    if (box) box.innerHTML = alertsHtml();
  }

  function readImport(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data = null;
      try {
        data = JSON.parse(String(reader.result || ''));
      } catch (error) {
        state.importError = 'Ce fichier n’est pas du JSON.';
        render();
        return;
      }
      const result = graph.importInvestigation(data);
      if (!result.ok) {
        state.importError = result.errors.join(' ');
        render();
        return;
      }
      remember();
      state.graph = result.graph;
      state.importError = '';
      state.selected = '';
      render();
    };
    reader.readAsText(file);
  }

  function render() {
    save();
    const b = sourcesLogic.familiesReady(catalog.sources, state);
    app.innerHTML = [
      header(),
      stepper(),
      state.mission === 'A' ? missionA() : '',
      state.mission === 'B' ? missionB(b) : '',
      state.mission === 'C' ? missionC() : '',
      state.mission === 'D' ? missionD() : '',
      state.mission === 'E' ? missionE() : '',
      state.mission === 'F' ? missionF() : '',
      state.teacher ? teacherPanel() : '',
      footer(),
    ].join('');
  }

  function header() {
    return (
      '<header class="top">' +
      '<p class="kicker">Enseignement TIM · Seconde professionnelle agricole · CCE</p>' +
      '<h1>Laboratoire de vérification de l’information agricole</h1>' +
      '<p class="audience">On n’y classe pas les sites du plus fiable au moins fiable. On examine une information précise : sa date, sa méthode, ses preuves, et une autre source indépendante.</p>' +
      '<div class="toolbar">' +
      '<div class="row"><span class="chip">Liens vérifiés le ' + esc(claim.checkedOn) + '</span><span class="chip">Sans compte, sans envoi</span></div>' +
      '<div class="row no-print">' +
      '<button class="btn" type="button" data-action="teacher">' + (state.teacher ? 'Masquer la lecture enseignant' : 'Mode enseignant') + '</button>' +
      '<button class="btn ghost" type="button" data-action="reset">Effacer cette séance</button>' +
      '</div></div></header>'
    );
  }

  function stepper() {
    return '<nav class="stepper" aria-label="Progression">' + missions.map(([id, label]) => {
      const className = ['step', state.mission === id ? 'current' : '', readyOf(id) ? 'done' : ''].filter(Boolean).join(' ');
      return '<button class="' + className + '" type="button" data-action="go" data-mission="' + id + '">' + id + '. ' + label + (readyOf(id) ? ' · fait' : '') + '</button>';
    }).join('') + '</nav>';
  }

  function missionA() {
    const blocks = claim.questions.map((question) => {
      const selected = state.answersA[question.id] || [];
      const review = selected.length ? hypothesis.reviewQuestion(question, selected) : null;
      const hintLevel = state.hints[question.id] || 0;
      const options = question.options.map((option) => {
        const checked = selected.includes(option.id) ? ' checked' : '';
        const type = question.multiple ? 'checkbox' : 'radio';
        return '<label class="choice"><input type="' + type + '" name="' + esc(question.id) + '" value="' + esc(option.id) + '" data-question="' + esc(question.id) + '"' + checked + '> <span>' + esc(option.label) + '</span></label>';
      }).join('');
      const hint = hintLevel > 0 ? '<p class="feedback warn"><strong>Indice.</strong> ' + esc(question.hint) + (hintLevel > 1 ? ' ' + esc(question.hint2) : '') + '</p>' : '';
      const feedback = review ? '<div class="feedback ' + (review.ok ? 'ok' : 'warn') + '"><strong>' + (review.ok ? 'Lecture utile.' : 'À reprendre.') + '</strong> ' + esc(review.explain) + '</div>' : '';
      return '<section class="card"><h2>' + esc(question.prompt) + '</h2>' + options + '<button class="btn ghost" type="button" data-action="hint" data-hint="' + esc(question.id) + '">Indice</button>' + hint + feedback + '</section>';
    }).join('');
    return (
      '<section>' +
      '<article class="quote"><p>« ' + esc(claim.statement) + ' »</p></article>' +
      '<p>Cette phrase est une affirmation rapportée en classe. Ce n’est pas un résultat d’essai. ARVALIS écrit, dans un article à ouvrir ensuite, que le goutte-à-goutte est souvent présenté comme plus économe que l’aspersion, de l’ordre de 20 à 30 % « selon les publications ». Votre travail commence par dire ce que la phrase mesure vraiment.</p>' +
      blocks +
      nav('A') +
      '</section>'
    );
  }

  function missionB(progress) {
    const cards = catalog.sources.map((source) => sourceCard(source)).join('');
    const extras = catalog.extras.map((extra) => (
      '<article class="card"><h3>' + esc(extra.title) + '</h3><p>' + esc(extra.note) + '</p><p><a href="' + esc(extra.url) + '" target="_blank" rel="noopener noreferrer">Ouvrir la page</a></p></article>'
    )).join('');
    return (
      '<section>' +
      '<section class="card"><h2>Examiner une information, pas un nom de site</h2>' +
      '<p>Pour chaque source, répondez à la question sur l’information précise. Une fiche complète est demandée pour Agreste, pour l’article ARVALIS, et pour un seul témoignage au choix.</p>' +
      '<p class="small">Sources : ' + (progress.quickDone ? 'lecture des dix pages faite' : 'les dix questions courtes sont encore ouvertes') +
      '. Fiche statistique : ' + (progress.statsDone ? 'faite' : 'à faire') +
      '. Fiche technique : ' + (progress.techDone ? 'faite' : 'à faire') +
      '. Fiche d’un témoignage : ' + (progress.testimonyDone ? 'faite' : 'à faire') + '.</p></section>' +
      cards +
      '<section class="card"><h2>Deux sources ouvertes pour confronter, en plus des dix</h2><div class="grid">' + extras + '</div></section>' +
      nav('B') +
      '</section>'
    );
  }

  function sourceCard(source) {
    const chipClass = source.status === 'ouvert' ? 'ok' : 'bad';
    const links = '<p><a href="' + esc(source.url) + '" target="_blank" rel="noopener noreferrer">Lien du TP</a></p>' +
      (source.also || []).map((link) => '<p><a href="' + esc(link.href) + '" target="_blank" rel="noopener noreferrer">' + esc(link.label) + '</a></p>').join('');
    const quick = source.quick.options.map((option) => {
      const checked = state.quick[source.id] === option.id ? ' checked' : '';
      return '<label class="choice"><input type="radio" name="quick-' + esc(source.id) + '" value="' + esc(option.id) + '" data-quick="' + esc(source.id) + '"' + checked + '> <span>' + esc(option.label) + '</span></label>';
    }).join('');
    const quickReview = state.quick[source.id] ? sourcesLogic.reviewQuick(source, state.quick[source.id]) : null;
    const quickFeedback = quickReview ? '<div class="feedback ' + (quickReview.ok ? 'ok' : 'warn') + '">' + esc(quickReview.explain) + '</div>' : '';
    const testimony = source.family === 'temoignage' && source.fiche.length;
    const ficheOpen = source.fiche.length && state.quick[source.id] && (!testimony || state.openFiche === source.id);
    const fiche = ficheOpen ? ficheBlock(source) : '';
    const opener = testimony && state.quick[source.id]
      ? '<button class="btn" type="button" data-action="open-fiche" data-source="' + esc(source.id) + '">' + (state.openFiche === source.id ? 'Fiche ouverte' : 'Faire la fiche de ce témoignage') + '</button>'
      : '';
    const required = testimony ? '<p class="small">Fiche de témoignage : une seule suffit parmi Adèle, la Villedieu, Agriculteur d’aujourd’hui, Pourdebon et Les Voix Agricoles.</p>' : '';
    return (
      '<article class="card"><p><span class="chip">' + esc(source.kind) + '</span> <span class="chip ' + chipClass + '">' + esc(source.statusLabel) + '</span></p>' +
      '<h2>' + esc(source.title) + '</h2>' + links +
      '<p><strong>Information précise relevée le 15 octobre 2026.</strong> ' + esc(source.precise) + '</p>' +
      quick + quickFeedback + required + opener + fiche + '</article>'
    );
  }

  function ficheBlock(source) {
    const answers = state.fiches[source.id] || {};
    const review = Object.keys(answers).length ? sourcesLogic.reviewFiche(source, answers) : null;
    const fields = source.fiche.map((field) => {
      const options = field.options.map((option) => {
        const checked = answers[field.id] === option.id ? ' checked' : '';
        return '<label class="choice"><input type="radio" name="' + esc(source.id + '-' + field.id) + '" value="' + esc(option.id) + '" data-fiche="' + esc(source.id) + '" data-field="' + esc(field.id) + '"' + checked + '> <span>' + esc(option.label) + '</span></label>';
      }).join('');
      const fieldReview = review && answers[field.id] ? review.fields[field.id] : null;
      const hintLevel = state.hints[source.id + '-' + field.id] || 0;
      const hint = hintLevel ? '<p class="feedback warn"><strong>Indice.</strong> ' + esc(field.hint) + '</p>' : '';
      const feedback = fieldReview ? '<div class="feedback ' + (fieldReview.ok ? 'ok' : 'warn') + '">' + esc(fieldReview.explain) + '</div>' : '';
      return '<h3>' + esc(field.prompt) + '</h3>' + options + '<button class="btn ghost" type="button" data-action="hint" data-hint="' + esc(source.id + '-' + field.id) + '">Indice</button>' + hint + feedback;
    }).join('');
    return '<div>' + fields + '</div>';
  }

  function missionC() {
    const plot = plots.plot;
    const review = plotReview();
    const showChart = review.volumeOk || state.hints.chart;
    const showEfficiency = review.waterAOk && review.waterBOk;
    const fields = [
      ['volume', 'Variation du volume, de A vers B, en %', review.volumeOk, 'Posez (800 − 1 000) / 1 000, puis passez en pourcentage.'],
      ['waterA', 'Eau de la parcelle A, en m³/t', review.waterAOk, 'Divisez les m³ de A par les tonnes de A.'],
      ['waterB', 'Eau de la parcelle B, en m³/t', review.waterBOk, '800 divisé par 9 ne tombe pas juste. 88,9 suffit.'],
      ['efficiency', 'Variation de l’eau par tonne, de A vers B, en %', review.efficiencyOk, 'Comparez les deux résultats en m³/t, pas les deux volumes bruts.'],
      ['drop30', 'Quel volume en m³ ferait vraiment −30 % par rapport aux 1 000 m³ ?', review.drop30Ok, 'Enlevez 30 % de 1 000. Le résultat n’est pas 800.'],
    ];
    const inputs = fields.map(([key, label, ok, hint]) => {
      const hintLevel = state.hints['calc-' + key] || 0;
      return '<label class="field">' + esc(label) + '<input type="text" inputmode="decimal" data-calc="' + key + '" value="' + esc(state.calc[key]) + '"></label>' +
        '<button class="btn ghost" type="button" data-action="hint" data-hint="calc-' + key + '">Indice</button>' +
        (hintLevel ? '<p class="feedback warn">' + esc(hint) + '</p>' : '') +
        (state.calc[key] && ok ? '<p class="feedback ok">Calcul recevable.</p>' : '') +
        (state.calc[key] && !ok && state.hints['calc-check'] ? '<p class="feedback warn">Ce nombre ne correspond pas encore. Reprenez la formule, sans changer les données.</p>' : '');
    }).join('');
    const numbersOk = review.volumeOk && review.waterAOk && review.waterBOk && review.efficiencyOk && review.drop30Ok;
    const interpretation = !numbersOk ? '' : '<h3>Que permet de conclure ce jeu simulé ?</h3>' + [
      ['pas-30', 'Le volume baisse de 20 %, pas de 30 %. L’eau par tonne baisse d’environ 11 %, et la récolte passe de 10 à 9 tonnes. Moins d’eau au total ne dit pas, à lui seul, que l’efficacité s’est améliorée de 30 %.'],
      ['oui', 'B utilise 800 m³ au lieu de 1 000, donc la phrase des 30 % est démontrée.'],
      ['pire', 'B produit moins, donc le goutte-à-goutte est une mauvaise pratique dans toutes les fermes.'],
    ].map(([id, label]) => {
      const checked = state.calc.interpretation === id ? ' checked' : '';
      return '<label class="choice"><input type="radio" name="interpretation" value="' + id + '"' + checked + '> <span>' + esc(label) + '</span></label>';
    }).join('');
    const interpretFeedback = numbersOk && state.calc.interpretation
      ? '<div class="feedback ' + (state.calc.interpretation === 'pas-30' ? 'ok' : 'warn') + '">' +
        (state.calc.interpretation === 'pas-30'
          ? 'La lecture tient. Le jeu reste simulé : il apprend le calcul, il ne remplace pas l’essai de Pusignan.'
          : 'Une baisse de volume peut venir d’une production plus faible. Et 800 m³, ce n’est pas 30 % de moins que 1 000. Le jeu ne décrit pas non plus toutes les fermes.') +
        '</div>'
      : '';
    return (
      '<section>' +
      '<section class="banner"><strong>Données simulées.</strong> Ces deux parcelles ont été inventées pour s’entraîner. Ce ne sont pas les mesures de Pusignan, ni une statistique Agreste.</section>' +
      '<section class="card"><h2>Tableau des mesures</h2>' +
      '<table><thead><tr><th>Parcelle</th><th>Pratique</th><th>Eau apportée</th><th>Production</th></tr></thead><tbody>' +
      '<tr><td>A</td><td>' + esc(plot.A.practice) + '</td><td>1 000 m³</td><td>10 tonnes</td></tr>' +
      '<tr><td>B</td><td>' + esc(plot.B.practice) + '</td><td>800 m³</td><td>9 tonnes</td></tr>' +
      '</tbody></table>' + inputs +
      '<button class="btn primary" type="button" data-action="hint" data-hint="calc-check">Vérifier les calculs</button>' +
      interpretation + interpretFeedback + '</section>' +
      (showChart ? '<section class="card chart"><h2>Graphique comparatif</h2>' + chart.comparisonChart(plot, showEfficiency) + '</section>' : '<p class="small">Le graphique des volumes s’affiche quand la variation en pourcentage est juste.</p>') +
      nav('C') +
      '</section>'
    );
  }

  function missionD() {
    const byId = Object.fromEntries(plots.facts.map((fact) => [fact.id, fact]));
    const rows = plots.facts.map((fact) => (
      '<tr><td>' + esc(fact.label) + '</td><td>' + esc(fact.period) + '</td><td>' + esc(fact.territory) + '</td><td>' + esc(fact.method) + '</td><td>' + esc(fact.indicator) + '</td><td>' + esc(fact.value) + '</td></tr>'
    )).join('');
    const questions = plots.pairs.map((pair) => {
      const comparison = calc.compareFacts(byId[pair.left], byId[pair.right]);
      const chosen = state.pairs[pair.id] || '';
      const radios = ['non', 'oui'].map((id) => {
        const label = id === 'non' ? 'Non' : 'Oui';
        return '<label class="choice"><input type="radio" name="pair-' + esc(pair.id) + '" value="' + id + '" data-pair="' + esc(pair.id) + '"' + (chosen === id ? ' checked' : '') + '> <span>' + label + '</span></label>';
      }).join('');
      const feedback = chosen
        ? '<div class="feedback ' + (chosen === pair.expected ? 'ok' : 'warn') + '">' + esc(pair.explain) +
          '<br>Écarts relevés : ' + (comparison.mismatches.length ? esc(comparison.mismatches.join(', ')) : 'aucun sur la période, le territoire, la méthode et l’indicateur') + '.</div>'
        : '';
      return '<section class="card"><h2>' + esc(pair.prompt) + '</h2>' + radios + feedback + '</section>';
    }).join('');
    const ruleFeedback = state.rule
      ? '<div class="feedback ' + (state.rule === 'non' ? 'ok' : 'warn') + '">Deux nombres différents ne se contredisent que s’ils décrivent la même chose. Un hectare national et un m³ par tonne simulé ne se battent pas en duel.</div>'
      : '';
    return (
      '<section><section class="card"><h2>Mettre les informations côte à côte</h2>' +
      '<p>Les cases ci-dessous décrivent ce que chaque pièce permet vraiment de comparer. Elles ne disent pas encore qui a raison.</p>' +
      '<table><thead><tr><th>Pièce</th><th>Période</th><th>Territoire</th><th>Méthode</th><th>Indicateur</th><th>Ce qui est écrit</th></tr></thead><tbody>' + rows + '</tbody></table></section>' +
      questions +
      '<section class="card"><h2>Deux chiffres différents sont-ils automatiquement contradictoires ?</h2>' +
      '<label class="choice"><input type="radio" name="rule" value="non"' + (state.rule === 'non' ? ' checked' : '') + '> <span>Non. Il faut la même période, le même territoire, la même méthode et le même indicateur.</span></label>' +
      '<label class="choice"><input type="radio" name="rule" value="oui"' + (state.rule === 'oui' ? ' checked' : '') + '> <span>Oui. Si les nombres diffèrent, l’un des deux est faux.</span></label>' +
      ruleFeedback + '</section>' + nav('D') + '</section>'
    );
  }

  function missionE() {
    const review = state.final.choice ? conclusion.review(state.final) : null;
    const choices = [
      ['etayee', 'L’affirmation est étayée par les preuves disponibles.'],
      ['contredite', 'L’affirmation est contredite par les preuves disponibles.'],
      ['insuffisant', 'Les preuves sont insuffisantes pour conclure.'],
    ].map(([id, label]) => (
      '<label class="choice"><input type="radio" name="conclusion" value="' + id + '"' + (state.final.choice === id ? ' checked' : '') + '> <span>' + esc(label) + '</span></label>'
    )).join('');
    const ticks = [
      ['essai', 'L’article du 2 août 2018 ne montre pas une économie de 30 % sur l’essai de Pusignan.'],
      ['autre-indicateur', 'Les statistiques nationales parlent de surfaces ou de m³ par hectare, pas de cette pratique.'],
      ['blogs', 'Les témoignages lus ne mesurent pas ce pourcentage.'],
      ['simulation', 'Le jeu de parcelles est simulé : le volume baisse de 20 %, pas de 30 %.'],
      ['absence', 'Ne pas trouver la preuve des 30 % dans ce dossier ne prouve pas que la pratique n’économise jamais d’eau.'],
    ].map(([id, label]) => (
      '<label class="choice"><input type="checkbox" data-tick="' + id + '"' + (state.final.ticks.includes(id) ? ' checked' : '') + '> <span>' + esc(label) + '</span></label>'
    )).join('');
    const feedback = review ? '<div class="feedback ' + (review.ok ? 'ok' : 'warn') + '">' + esc(review.reading) + (review.ok ? '' : ' Pour fermer la mission, gardez l’issue « preuves insuffisantes », cochez l’essai et la différence entre absence de preuve et preuve d’absence, ajoutez au moins un troisième élément concret, et écrivez une justification d’au moins quelques lignes.') + '</div>' : '';
    const synthesis = review && review.ok ? synthesisBlock() : '';
    return (
      '<section><section class="card"><h2>Choisir une conclusion et la justifier</h2>' +
      '<p>La bonne case ne suffit pas. Elle doit s’appuyer sur des pièces du dossier.</p>' +
      choices + '<h3>Éléments concrets utilisés</h3>' + ticks +
      '<label class="field">Justification<textarea data-final-text>' + esc(state.final.text) + '</textarea></label>' +
      '<button class="btn primary" type="button" data-action="check">Relire la conclusion</button>' +
      feedback + '</section>' + synthesis + nav('E') + '</section>'
    );
  }

  function synthesisBlock() {
    const criteria = [
      ['Identification de la source', readyB()],
      ['Analyse de la date et de la méthode', readyB()],
      ['Distinction entre opinion, donnée et preuve', readyB()],
      ['Comparaison des sources', readyD()],
      ['Interprétation des résultats', readyC()],
      ['Qualité de la conclusion argumentée', readyE()],
    ];
    return (
      '<section class="card" id="synthese"><h2>Synthèse</h2><ul>' +
      criteria.map(([label, done]) => '<li>' + esc(label) + ' : ' + (done ? 'travaillé' : 'encore ouvert') + '</li>').join('') +
      '</ul><pre>' + esc(studentText()) + '</pre>' +
      '<div class="row no-print"><button class="btn primary" type="button" data-action="export">Télécharger la synthèse élève</button>' +
      '<button class="btn" type="button" data-action="export-teacher">Télécharger la lecture enseignant</button></div></section>'
    );
  }

  function missionF() {
    const selected = graph.nodeById(state.graph, state.selected);
    const types = data.graphSchema.nodeTypes.map((item) => (
      '<button class="btn" type="button" data-action="add-node" data-type="' + esc(item.id) + '">Ajouter : ' + esc(item.label) + '</button>'
    )).join('');
    const panel = selected ? nodePanel(selected) : '<p>Sélectionnez un nœud, ou ajoutez-en un. Tabulation, flèches, Entrée, Suppr et Échap fonctionnent sur la carte.</p>';
    const relations = state.graph.relations.map((relation) => {
      const from = graph.nodeById(state.graph, relation.from);
      const to = graph.nodeById(state.graph, relation.to);
      const rule = data.graphSchema.relationTypes.find((item) => item.id === relation.type);
      return '<li>' + esc((from && from.title) || relation.from) + ' — ' + esc(rule ? rule.label : relation.type) + ' — ' + esc((to && to.title) || relation.to) +
        ' <button class="btn ghost" type="button" data-action="delete-relation" data-relation="' + esc(relation.id) + '">Retirer le lien</button></li>';
    }).join('');
    return (
      '<section><section class="card"><h2>Carte de l’investigation</h2>' +
      '<p>Les dix sources du TP sont placées avec leur adresse. L’auteur et la date restent vides tant que vous ne les avez pas lus. Aucun site ne reçoit de note de fiabilité. Les liens « maintenance » et « erreur » décrivent l’ouverture du 15 octobre 2026, pas la vérité du contenu.</p>' +
      '<div class="row no-print">' + types +
      '<button class="btn" type="button" data-action="add-extras">Ajouter SDES et Insee</button>' +
      '<button class="btn" type="button" data-action="zoom-in">Zoom +</button>' +
      '<button class="btn" type="button" data-action="zoom-out">Zoom −</button>' +
      '<button class="btn" type="button" data-action="fit">Ajuster</button>' +
      '<button class="btn" type="button" data-action="undo">Annuler</button>' +
      '<button class="btn" type="button" data-action="redo">Rétablir</button></div>' +
      '<label class="field">Rechercher<input type="search" data-graph-query value="' + esc(state.query) + '"></label></section>' +
      '<div class="workspace"><div class="graph-host">' + map.mapMarkup(state.graph, state.view, state.selected, state.query) + '</div>' +
      '<aside class="card side-panel"><h2>Propriétés</h2>' + panel + relationForm(selected) +
      (state.relationError ? '<p class="feedback warn">' + esc(state.relationError) + '</p>' : '') +
      '<h3>Liens</h3><ul>' + (relations || '<li>Aucun lien pour l’instant.</li>') + '</ul></aside></div>' +
      '<section class="card alerts" id="alerts"><h2>Alertes pédagogiques</h2>' + alertsHtml() + '</section>' +
      conclusionForm() + nav('F') + '</section>'
    );
  }

  function nodePanel(node) {
    const status = data.graphSchema.statuses.map((item) => (
      '<option value="' + esc(item.id) + '"' + (node.status === item.id ? ' selected' : '') + '>' + esc(item.label) + '</option>'
    )).join('');
    const field = (key, label, value) => (
      '<label class="field">' + esc(label) + '<input data-node-field="' + key + '" data-node-id="' + esc(node.id) + '" value="' + esc(value || '') + '"></label>'
    );
    const area = (key, label, value) => (
      '<label class="field">' + esc(label) + '<textarea data-node-field="' + key + '" data-node-id="' + esc(node.id) + '">' + esc(value || '') + '</textarea></label>'
    );
    let body = field('title', 'Titre', node.title);
    if (node.type === 'source') {
      body += field('url', 'URL', node.url) + field('author', 'Auteur ou organisme', node.author) + field('date', 'Date', node.date) +
        field('method', 'Méthode', node.method) + field('interest', 'Intérêt visible', node.interest) +
        field('documentId', 'Identifiant de document, s’il est le même qu’une autre page', node.documentId) +
        '<p class="small">État du lien constaté le 15 octobre 2026 : ' + esc(node.linkStatus || 'non renseigné') + '. Ce n’est pas une note de fiabilité.</p>';
    }
    if (node.type === 'affirmation') {
      body += area('text', 'Phrase exacte', node.text) + area('context', 'Contexte', node.context) + field('unit', 'Unité', node.unit) +
        '<label class="field">Statut<select data-node-field="status" data-node-id="' + esc(node.id) + '">' + status + '</select></label>';
    }
    if (node.type === 'preuve') {
      body += field('reference', 'Référence vérifiable', node.reference) + field('indicator', 'Indicateur', node.indicator) +
        field('period', 'Période', node.period) + field('territory', 'Territoire', node.territory) + field('value', 'Valeur', node.value) +
        '<label class="field">Données simulées ?<select data-node-field="simulated" data-node-id="' + esc(node.id) + '">' +
        '<option value=""' + (node.simulated ? '' : ' selected') + '>Non</option>' +
        '<option value="oui"' + (node.simulated === 'oui' ? ' selected' : '') + '>Oui, jeu pédagogique</option></select></label>';
    }
    if (node.type === 'verification') {
      body += area('result', 'Ce qui a été vérifié', node.result) + area('uncertainty', 'Incertitude restante', node.uncertainty) +
        '<label class="field">Statut<select data-node-field="status" data-node-id="' + esc(node.id) + '">' + status + '</select></label>';
    }
    body += area('note', 'Note', node.note);
    return '<h3>' + esc(node.type) + '</h3>' + body +
      '<button class="btn ghost" type="button" data-action="delete-node">Supprimer ce nœud</button>';
  }

  function relationForm(selected) {
    if (!selected) return '';
    const others = state.graph.nodes.filter((node) => node.id !== selected.id);
    const to = others[0] ? others[0].id : '';
    const chosenTo = valueOf('#rel-to') || to;
    const target = graph.nodeById(state.graph, chosenTo);
    const options = data.graphSchema.relationTypes.filter((rule) => target && graph.allows(rule.id, selected, target));
    return '<h3>Nouveau lien depuis ce nœud</h3>' +
      '<input id="rel-from" type="hidden" value="' + esc(selected.id) + '">' +
      '<label class="field">Vers<select id="rel-to">' + others.map((node) => (
        '<option value="' + esc(node.id) + '"' + (node.id === chosenTo ? ' selected' : '') + '>' + esc(node.title || node.type) + '</option>'
      )).join('') + '</select></label>' +
      '<label class="field">Type<select id="rel-type">' + (options.length ? options.map((rule) => (
        '<option value="' + esc(rule.id) + '">' + esc(rule.label) + '</option>'
      )).join('') : '<option value="">Aucun type possible</option>') + '</select></label>' +
      '<label class="field">Justification<input id="rel-why" type="text"></label>' +
      '<label class="field">Indépendance, seulement pour « Confirme »<select id="rel-indep">' +
      '<option value="inconnue">Pas encore établie</option><option value="meme-document">Même document ou même communiqué</option>' +
      '<option value="independante">Source indépendante</option></select></label>' +
      '<button class="btn primary" type="button" data-action="add-relation">Créer le lien</button>';
  }

  function conclusionForm() {
    const conclusion = state.graph.conclusion;
    const status = data.graphSchema.statuses.map((item) => (
      '<option value="' + item.id + '"' + (conclusion.status === item.id ? ' selected' : '') + '>' + esc(item.label) + '</option>'
    )).join('');
    const rows = state.graph.nodes.map((node) => '<li>' + esc(node.type) + ' — ' + esc(node.title || node.text || node.url || node.id) + '</li>').join('');
    return '<section class="card" id="rapport"><h2>Conclusion de l’investigation</h2>' +
      '<label class="field">Statut<select name="invest-status">' + status + '</select></label>' +
      '<label class="field">Conclusion<textarea data-invest="text">' + esc(conclusion.text) + '</textarea></label>' +
      '<label class="field">Incertitudes restantes<textarea data-invest="uncertainties">' + esc(conclusion.uncertainties) + '</textarea></label>' +
      '<h3>Pièces</h3><ul>' + rows + '</ul>' +
      (state.importError ? '<p class="feedback warn">' + esc(state.importError) + '</p>' : '') +
      '<div class="row no-print"><button class="btn primary" type="button" data-action="export-json">Exporter le JSON</button>' +
      '<label class="btn">Importer un JSON<input data-import type="file" accept="application/json,.json" hidden></label>' +
      '<button class="btn" type="button" data-action="print">Imprimer le rapport</button></div></section>';
  }

  function teacherPanel() {
    return '<aside class="teacher"><h2>Lecture enseignant</h2><p>Cette lecture est dans la page. Elle ne recueille aucun nom.</p><pre>' + esc(teacherText()) + '</pre></aside>';
  }

  function nav(id) {
    const index = missions.findIndex((mission) => mission[0] === id);
    const previous = missions[index - 1];
    const next = missions[index + 1];
    return '<div class="row no-print">' +
      (previous ? '<button class="btn" type="button" data-action="go" data-mission="' + previous[0] + '">Mission ' + previous[0] + '</button>' : '') +
      (next ? '<button class="btn primary" type="button" data-action="go" data-mission="' + next[0] + '">Mission ' + next[0] + '</button>' : '') +
      '</div>';
  }

  function footer() {
    return '<footer><p>Prototype local pour la classe. Les parcelles A et B sont simulées. Les dix liens ont été testés le 15 octobre 2026 : le blog de la Villedieu était en maintenance, et l’adresse nationale du mémento 2025 ouvrait une page d’erreur.</p></footer>';
  }

  function studentText() {
    const review = plotReview();
    const lines = [
      'Laboratoire de vérification de l’information agricole',
      'Affirmation : ' + claim.statement,
      '',
      'Mission A : ' + (readyA() ? 'éléments de la phrase identifiés' : 'encore ouverte'),
      'Mission B : ' + (readyB() ? 'sources examinées sans classement automatique' : 'encore ouverte'),
      'Mission C : ' + (readyC()
        ? 'volume ' + fmt(review.expectedVolume, 0) + ' %, eau A ' + fmt(review.expectedA, 0) + ' m³/t, eau B ' + fmt(review.expectedB, 1) + ' m³/t, efficacité ' + fmt(review.expectedEfficiency, 1) + ' %. Données simulées.'
        : 'calculs encore ouverts. Données simulées.'),
      'Mission D : ' + (readyD() ? 'les écarts de période, de territoire, de méthode et d’indicateur ont été distingués' : 'encore ouverte'),
      'Conclusion choisie : ' + (state.final.choice || 'non choisie'),
      'Justification : ' + (state.final.text || 'non rédigée'),
      'Éléments cochés : ' + (state.final.ticks.join(', ') || 'aucun'),
    ];
    return lines.join('\n');
  }

  function teacherText() {
    return [
      'Lecture pour la mise en commun. Aucun nom d’élève.',
      '',
      'La phrase annonce −30 % d’eau d’irrigation, sans culture, sans lieu, sans année et sans pratique de comparaison.',
      'L’article d’ARVALIS du 2 août 2018 dit que 20 à 30 % sont souvent annoncés par d’autres publications. À Pusignan, en maïs, en 2016-2017, à volume d’eau égal, une meilleure efficience n’a pas été prouvée. Cela ne prouve pas le contraire dans toutes les fermes.',
      'L’accueil Agreste consulté le 15 octobre 2026 parle d’emploi : 654 460 ETP en 2024, −1,3 %. Ce n’est pas de l’eau.',
      'Le SDES, d’après Agreste, décrit des hectares irrigués en France entre 2010 et 2020, pas un essai de goutte-à-goutte. L’Insee donne 1 902 m³/ha en 2020 contre 1 924 en 2010.',
      'Wikipédia cite environ 1 000 tonnes d’eau par tonne de céréales à l’échelle mondiale. La référence reste à ouvrir. Ce n’est pas le même indicateur.',
      'Les blogs et témoignages du TP racontent des fermes ou des opinions. Ils ne mesurent pas les 30 %.',
      'Le blog de la Villedieu et le mémento national 2025 ne s’ouvraient pas correctement le 15 octobre 2026.',
      'Jeu simulé : 1 000 m³ / 10 t = 100 m³/t ; 800 m³ / 9 t ≈ 88,9 m³/t. Volume −20 %. Eau par tonne environ −11 %. Une baisse de 30 % aurait mené à 700 m³.',
      'Conclusion attendue : preuves insuffisantes pour affirmer les 30 %. Absence de preuve dans ce dossier n’est pas preuve d’absence.',
    ].join('\n');
  }

  function download(text, name, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  app.addEventListener('pointerdown', (event) => {
    const nodeEl = event.target.closest('[data-node]');
    if (nodeEl) {
      const node = graph.nodeById(state.graph, nodeEl.dataset.node);
      drag = { id: node.id, x: event.clientX, y: event.clientY, ox: node.x, oy: node.y, moved: false };
      return;
    }
    if (event.target.closest('[data-pan]')) {
      drag = { pan: true, x: event.clientX, y: event.clientY, view: Object.assign({}, state.view) };
    }
  });

  app.addEventListener('pointermove', (event) => {
    if (!drag) return;
    if (drag.pan) {
      state.view.x = drag.view.x + (event.clientX - drag.x);
      state.view.y = drag.view.y + (event.clientY - drag.y);
      const group = app.querySelector('.graph g');
      if (group) group.setAttribute('transform', 'translate(' + state.view.x + ' ' + state.view.y + ') scale(' + state.view.scale + ')');
      return;
    }
    const dx = (event.clientX - drag.x) / state.view.scale;
    const dy = (event.clientY - drag.y) / state.view.scale;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    const el = app.querySelector('[data-node="' + drag.id + '"]');
    if (el) el.setAttribute('transform', 'translate(' + (drag.ox + dx) + ' ' + (drag.oy + dy) + ')');
  });

  app.addEventListener('pointerup', () => {
    if (!drag) return;
    if (!drag.pan && drag.moved) {
      const el = app.querySelector('[data-node="' + drag.id + '"]');
      const match = el && /translate\(([-\d.]+) ([-\d.]+)\)/.exec(el.getAttribute('transform') || '');
      if (match) {
        remember();
        state.graph = graph.moveNode(state.graph, drag.id, Number(match[1]), Number(match[2])).graph;
        save();
      }
    }
    drag = null;
  });

  app.addEventListener('keydown', (event) => {
    if (event.target.closest('input, textarea, select')) {
      if (event.key === 'Escape') event.target.blur();
      return;
    }
    if (event.key === 'Escape') {
      state.selected = '';
      render();
      return;
    }
    const nodeEl = event.target.closest('[data-node]');
    if (!nodeEl) return;
    const moved = graph.nudge(state.graph, nodeEl.dataset.node, event.key);
    if (moved) {
      event.preventDefault();
      remember();
      state.graph = moved;
      const id = nodeEl.dataset.node;
      render();
      const again = app.querySelector('[data-node="' + id + '"]');
      if (again) again.focus();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      remember();
      state.graph = graph.removeNode(state.graph, nodeEl.dataset.node).graph;
      state.selected = '';
      render();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      state.selected = nodeEl.dataset.node;
      render();
      const field = app.querySelector('.side-panel input, .side-panel textarea, .side-panel select');
      if (field) field.focus();
    }
  });

  app.addEventListener('wheel', (event) => {
    if (!event.target.closest('.graph')) return;
    event.preventDefault();
    state.view.scale = Math.min(2, Math.max(0.35, state.view.scale + (event.deltaY < 0 ? 0.08 : -0.08)));
    const group = app.querySelector('.graph g');
    if (group) group.setAttribute('transform', 'translate(' + state.view.x + ' ' + state.view.y + ') scale(' + state.view.scale + ')');
    save();
  }, { passive: false });

  render();
})();
