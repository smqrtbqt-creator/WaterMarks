(function () {
  var KEY = 'secours-info-v1';
  var TYPES = [
    'Information générale',
    'Prévention',
    'Conseil de santé',
    'Geste de secours',
    'Urgence vitale'
  ];
  var LEVELS = ['Faible', 'Modérée', 'Élevée', 'Critique'];
  var SOURCES = [
    { name: 'Croix-Rouge française', url: 'https://www.croix-rouge.fr/' },
    { name: 'Sécurité civile', url: 'https://www.securite-civile.interieur.gouv.fr/' },
    { name: 'Protection Civile', url: 'https://www.protection-civile.org/' },
    { name: 'Sapeurs-pompiers de France', url: 'https://www.pompiers.fr/' },
    { name: 'Service-Public.fr', url: 'https://www.service-public.fr/' },
    { name: 'Doctissimo', url: 'https://www.doctissimo.fr/' },
    { name: 'Secourisme.net', url: 'https://www.secourisme.net/' },
    { name: 'Le Monde', url: 'https://www.lemonde.fr/' },
    { name: 'YouTube — tutoriels de premiers secours', url: 'https://www.youtube.com/results?search_query=gestes+premiers+secours' },
    { name: 'Forum Doctissimo', url: 'https://forum.doctissimo.fr/' }
  ];
  var COMPARE = [
    ['Site', 'site1', 'site2'],
    ['Auteur identifiable', 'author1', 'author2'],
    ['Compétence de l’auteur', 'skill1', 'skill2'],
    ['Date de publication ou de mise à jour', 'date1', 'date2'],
    ['Sources ou références citées', 'refs1', 'refs2'],
    ['Information identique ou contradictoire', 'same1', 'same2']
  ];

  function emptyFinding() {
    return { site: SOURCES[0].name, info: '', type: TYPES[0], consequence: '', level: LEVELS[0] };
  }

  function fresh() {
    return {
      findings: [emptyFinding(), emptyFinding(), emptyFinding(), emptyFinding(), emptyFinding()],
      conclusion: '',
      claim: '',
      site1: '',
      site2: '',
      author1: '',
      author2: '',
      skill1: '',
      skill2: '',
      date1: '',
      date2: '',
      refs1: '',
      refs2: '',
      same1: '',
      same2: '',
      verdict: '',
      known: ''
    };
  }

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!saved || !Array.isArray(saved.findings)) return fresh();
      return Object.assign(fresh(), saved);
    } catch (error) {
      return fresh();
    }
  }

  var state = load();

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    var filled = state.findings.filter(function (row) { return row.info.trim().length > 0; }).length;
    document.getElementById('row-count').textContent = filled + ' information' + (filled > 1 ? 's' : '') + ' renseignée' + (filled > 1 ? 's' : '') + ' · le sujet en demande au moins 5';
  }

  function option(list, value) {
    return list.map(function (item) {
      return '<option' + (item === value ? ' selected' : '') + '>' + item + '</option>';
    }).join('');
  }

  function renderSources() {
    document.getElementById('link-note').textContent = 'Contrôle automatique du 5 novembre 2026 : Protection Civile, Pompiers.fr, Secourisme.net, Le Monde, YouTube et le forum Doctissimo ont répondu. La Croix-Rouge, la Sécurité civile et Doctissimo ont refusé la requête automatique. Service-Public.fr n’a pas répondu dans le délai. Ouvrez chaque lien. Ce contrôle ne mesure pas la fiabilité.';
    document.getElementById('sources').innerHTML = SOURCES.map(function (source) {
      return '<li><a href="' + source.url + '" target="_blank" rel="noopener noreferrer">' + source.name + '</a><br><span class="note">' + source.url + '</span></li>';
    }).join('');
  }

  function renderFindings() {
    document.querySelector('#findings tbody').innerHTML = state.findings.map(function (row, index) {
      return '<tr>' +
        '<td><select data-field="site" data-index="' + index + '">' + option(SOURCES.map(function (source) { return source.name; }), row.site) + '</select></td>' +
        '<td><textarea data-field="info" data-index="' + index + '">' + escapeText(row.info) + '</textarea></td>' +
        '<td><select data-field="type" data-index="' + index + '">' + option(TYPES, row.type) + '</select></td>' +
        '<td><textarea data-field="consequence" data-index="' + index + '">' + escapeText(row.consequence) + '</textarea></td>' +
        '<td><select data-field="level" data-index="' + index + '">' + option(LEVELS, row.level) + '</select></td>' +
        '<td><button type="button" class="ghost" data-remove="' + index + '">Retirer</button></td>' +
        '</tr>';
    }).join('');
  }

  function renderCompare() {
    document.getElementById('compare').innerHTML = COMPARE.map(function (row) {
      return '<tr><th>' + row[0] + '</th>' +
        '<td><input type="text" data-key="' + row[1] + '" value="' + escapeAttr(state[row[1]]) + '"></td>' +
        '<td><input type="text" data-key="' + row[2] + '" value="' + escapeAttr(state[row[2]]) + '"></td></tr>';
    }).join('');
    document.getElementById('claim').value = state.claim;
    document.getElementById('conclusion').value = state.conclusion;
    document.getElementById('verdict').value = state.verdict;
    document.getElementById('known').value = state.known;
  }

  function escapeText(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeAttr(value) {
    return escapeText(value).replace(/"/g, '&quot;');
  }

  function render() {
    renderSources();
    renderFindings();
    renderCompare();
    save();
  }

  function onFinding(event) {
    var target = event.target;
    if (!target.dataset || target.dataset.index == null) return;
    state.findings[Number(target.dataset.index)][target.dataset.field] = target.value;
    save();
  }

  document.getElementById('findings').addEventListener('input', onFinding);
  document.getElementById('findings').addEventListener('change', onFinding);

  document.getElementById('findings').addEventListener('click', function (event) {
    var button = event.target.closest('[data-remove]');
    if (!button) return;
    state.findings.splice(Number(button.dataset.remove), 1);
    if (!state.findings.length) state.findings.push(emptyFinding());
    renderFindings();
    save();
  });

  document.getElementById('add-row').addEventListener('click', function () {
    state.findings.push(emptyFinding());
    renderFindings();
    save();
  });

  document.getElementById('compare').addEventListener('input', function (event) {
    if (!event.target.dataset.key) return;
    state[event.target.dataset.key] = event.target.value;
    save();
  });

  ['claim', 'conclusion', 'verdict', 'known'].forEach(function (id) {
    var field = document.getElementById(id);
    function onField(event) {
      state[id] = event.target.value;
      save();
    }
    field.addEventListener('input', onField);
    field.addEventListener('change', onField);
  });

  document.getElementById('export').addEventListener('click', function () {
    var lines = [];
    lines.push('Fiabilité des informations sur les premiers secours');
    lines.push('');
    lines.push('Informations trouvées');
    state.findings.forEach(function (row, index) {
      if (!row.info.trim() && !row.consequence.trim()) return;
      lines.push((index + 1) + '. Site : ' + row.site);
      lines.push('   Information : ' + row.info);
      lines.push('   Type : ' + row.type);
      lines.push('   Conséquence possible : ' + row.consequence);
      lines.push('   Criticité : ' + row.level);
    });
    lines.push('');
    lines.push('Conclusion');
    lines.push(state.conclusion);
    lines.push('');
    lines.push('Affirmation vérifiée : ' + state.claim);
    lines.push('Site 1 : ' + state.site1 + ' — auteur : ' + state.author1 + ' — compétence : ' + state.skill1 + ' — date : ' + state.date1 + ' — références : ' + state.refs1);
    lines.push('Site 2 : ' + state.site2 + ' — auteur : ' + state.author2 + ' — compétence : ' + state.skill2 + ' — date : ' + state.date2 + ' — références : ' + state.refs2);
    lines.push('Comparaison : ' + state.same1 + ' / ' + state.same2);
    lines.push('Verdict : ' + state.verdict);
    lines.push('');
    lines.push('Un site connu est-il nécessairement fiable pour tout ce qu’il publie ?');
    lines.push(state.known);
    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'fiabilite-premiers-secours.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  document.getElementById('print').addEventListener('click', function () { window.print(); });

  document.getElementById('reset').addEventListener('click', function () {
    if (!window.confirm('Effacer les réponses enregistrées dans ce navigateur ?')) return;
    state = fresh();
    render();
  });

  render();
})();
