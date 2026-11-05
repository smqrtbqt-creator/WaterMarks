(function (root, factory) {
  const api = factory(root && root.InfoAgri && root.InfoAgri.graphSchema);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.InfoAgri = Object.assign(root.InfoAgri || {}, { graph: api });
})(typeof window !== 'undefined' ? window : globalThis, function (schema) {
  const format = schema.format;
  const statuses = schema.statuses.map((item) => item.id);
  const nodeTypes = schema.nodeTypes.map((item) => item.id);
  const relationTypes = schema.relationTypes;

  function clone(graph) {
    return JSON.parse(JSON.stringify(graph));
  }

  function nodeById(graph, id) {
    return graph.nodes.find((node) => node.id === id) || null;
  }

  function ruleById(id) {
    return relationTypes.find((rule) => rule.id === id) || null;
  }

  function allows(type, fromNode, toNode) {
    const rule = ruleById(type);
    if (!rule || !fromNode || !toNode || fromNode.id === toNode.id) return false;
    return rule.from.includes(fromNode.type) && rule.to.includes(toNode.type);
  }

  function blankNode(type, partial) {
    const base = {
      id: partial.id,
      type,
      x: Number(partial.x) || 80,
      y: Number(partial.y) || 80,
      title: partial.title || '',
      url: '',
      author: '',
      date: '',
      method: '',
      interest: '',
      linkStatus: '',
      documentId: '',
      text: '',
      context: '',
      unit: '',
      status: 'a-verifier',
      reference: '',
      indicator: '',
      period: '',
      territory: '',
      value: '',
      simulated: '',
      result: '',
      uncertainty: '',
      note: '',
    };
    Object.keys(base).forEach((key) => {
      if (partial[key] != null && key !== 'type') base[key] = partial[key];
    });
    base.type = type;
    if (!statuses.includes(base.status)) base.status = 'a-verifier';
    return base;
  }

  function emptyConclusion() {
    return { status: 'a-verifier', text: '', uncertainties: '' };
  }

  function seed(statement, sources) {
    const nodes = [blankNode('affirmation', {
      id: 'aff-eau',
      x: 420,
      y: 260,
      title: 'Les 30 %',
      text: statement,
      context: 'Phrase rapportée en classe. Ce n’est pas un résultat d’essai.',
      status: 'a-verifier',
    })];
    sources.forEach((source, index) => {
      const angle = (index / Math.max(sources.length, 1)) * Math.PI * 2 - Math.PI / 2;
      nodes.push(blankNode('source', {
        id: 'src-' + source.id,
        x: Math.round(420 + Math.cos(angle) * 300),
        y: Math.round(260 + Math.sin(angle) * 210),
        title: source.title,
        url: source.url || '',
        linkStatus: source.status || '',
        note: source.statusLabel || '',
      }));
    });
    return { format, nodes, relations: [], conclusion: emptyConclusion() };
  }

  function addSourceNodes(graph, sources) {
    const next = clone(graph);
    sources.forEach((source) => {
      const id = 'src-' + source.id;
      if (next.nodes.some((node) => node.id === id)) return;
      const index = next.nodes.length;
      next.nodes.push(blankNode('source', {
        id,
        x: 80 + (index % 4) * 190,
        y: 40 + Math.floor(index / 4) * 110,
        title: source.title,
        url: source.url || '',
        linkStatus: source.status || '',
        note: source.statusLabel || '',
      }));
    });
    return next;
  }

  function addNode(graph, partial) {
    if (!nodeTypes.includes(partial.type)) return { ok: false, errors: ['Type de nœud inconnu.'], graph };
    const id = partial.id || ('n-' + Math.random().toString(36).slice(2, 10));
    if (nodeById(graph, id)) return { ok: false, errors: ['Identifiant déjà utilisé.'], graph };
    const next = clone(graph);
    next.nodes.push(blankNode(partial.type, Object.assign({}, partial, { id })));
    return { ok: true, errors: [], graph: next };
  }

  function updateNode(graph, id, patch) {
    const next = clone(graph);
    const node = nodeById(next, id);
    if (!node) return { ok: false, errors: ['Nœud introuvable.'], graph };
    Object.keys(patch).forEach((key) => {
      if (key === 'id' || key === 'type') return;
      if (typeof patch[key] === 'string' || typeof patch[key] === 'number') node[key] = patch[key];
    });
    if (patch.x != null) node.x = Number(patch.x) || 0;
    if (patch.y != null) node.y = Number(patch.y) || 0;
    if (patch.status && !statuses.includes(patch.status)) node.status = 'a-verifier';
    return { ok: true, errors: [], graph: next };
  }

  function moveNode(graph, id, x, y) {
    return updateNode(graph, id, { x, y });
  }

  function removeNode(graph, id) {
    if (!nodeById(graph, id)) return { ok: false, errors: ['Nœud introuvable.'], graph };
    const next = clone(graph);
    next.nodes = next.nodes.filter((node) => node.id !== id);
    next.relations = next.relations.filter((relation) => relation.from !== id && relation.to !== id);
    return { ok: true, errors: [], graph: next };
  }

  function addRelation(graph, partial) {
    const fromNode = nodeById(graph, partial.from);
    const toNode = nodeById(graph, partial.to);
    if (!fromNode || !toNode) return { ok: false, errors: ['La relation pointe vers un objet absent.'], graph };
    if (!allows(partial.type, fromNode, toNode)) return { ok: false, errors: ['Ces deux objets ne peuvent pas être reliés par ce type.'], graph };
    const duplicate = graph.relations.some((relation) => relation.from === partial.from && relation.to === partial.to && relation.type === partial.type);
    if (duplicate) return { ok: false, errors: ['Cette relation existe déjà.'], graph };
    const next = clone(graph);
    next.relations.push({
      id: partial.id || ('r-' + Math.random().toString(36).slice(2, 10)),
      from: partial.from,
      to: partial.to,
      type: partial.type,
      justification: typeof partial.justification === 'string' ? partial.justification : '',
      independence: partial.type === 'confirme' ? (partial.independence || 'inconnue') : '',
    });
    return { ok: true, errors: [], graph: next };
  }

  function removeRelation(graph, id) {
    if (!graph.relations.some((relation) => relation.id === id)) return { ok: false, errors: ['Relation introuvable.'], graph };
    const next = clone(graph);
    next.relations = next.relations.filter((relation) => relation.id !== id);
    return { ok: true, errors: [], graph: next };
  }

  function orphanRelations(graph) {
    const ids = new Set(graph.nodes.map((node) => node.id));
    return graph.relations.filter((relation) => !ids.has(relation.from) || !ids.has(relation.to));
  }

  function nudge(graph, id, key) {
    const step = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[key];
    const node = nodeById(graph, id);
    if (!step || !node) return null;
    return moveNode(graph, id, node.x + step[0], node.y + step[1]).graph;
  }

  function proofLinks(graph, affirmationId) {
    return graph.relations.filter((relation) => {
      if (relation.to !== affirmationId) return false;
      const fromNode = nodeById(graph, relation.from);
      return fromNode && fromNode.type === 'preuve' && ['porte-sur', 'etaye', 'conteste', 'autre-indicateur', 'donnees-simulees', 'ne-confirme-pas'].includes(relation.type);
    });
  }

  function alerts(graph) {
    const list = [];
    graph.nodes.filter((node) => node.type === 'affirmation').forEach((node) => {
      if (!proofLinks(graph, node.id).length) {
        list.push({ id: 'sans-preuve-' + node.id, text: '« ' + (node.title || node.text || 'Affirmation') + ' » n’a pas encore de preuve associée. Ce n’est pas une preuve que la phrase est fausse.' });
      }
      const incoming = graph.relations.filter((relation) => relation.to === node.id);
      const supports = incoming.some((relation) => relation.type === 'etaye');
      const contests = incoming.some((relation) => relation.type === 'conteste');
      if (supports && contests) {
        list.push({ id: 'oppose-' + node.id, text: 'Deux preuves vont dans des sens opposés. Avant de parler de contradiction, comparez l’indicateur, la période, le territoire et la méthode. Opposé n’est pas encore faux.' });
      }
      const verified = graph.relations.some((relation) => relation.to === node.id && relation.type === 'verifie');
      if (node.status === 'a-verifier' || !verified) {
        list.push({ id: 'a-verifier-' + node.id, text: 'Une vérification est encore à écrire pour « ' + (node.title || 'cette affirmation') + ' ». Non vérifié ne veut pas dire faux.' });
      }
    });
    graph.nodes.filter((node) => node.type === 'source').forEach((node) => {
      if (!String(node.author || '').trim() || !String(node.date || '').trim()) {
        list.push({ id: 'source-incomplete-' + node.id, text: 'La source « ' + (node.title || node.url || node.id) + ' » n’a pas encore d’auteur ou de date. Le nom du site ne remplace pas ces deux informations.' });
      }
    });
    graph.nodes.filter((node) => node.type === 'preuve').forEach((node) => {
      if (!String(node.reference || '').trim()) {
        list.push({ id: 'preuve-sans-ref-' + node.id, text: 'La preuve « ' + (node.title || node.id) + ' » n’a pas de référence vérifiable.' });
      }
    });
    graph.relations.filter((relation) => relation.type === 'confirme' && relation.independence !== 'independante').forEach((relation) => {
      list.push({ id: 'independance-' + relation.id, text: 'Une confirmation est notée sans indépendance établie. Deux pages du même communiqué ne comptent pas comme deux confirmations.' });
    });
    const grouped = {};
    graph.relations.filter((relation) => relation.type === 'confirme' && relation.independence === 'independante').forEach((relation) => {
      const fromNode = nodeById(graph, relation.from);
      const key = relation.to + '|' + (fromNode && fromNode.documentId ? fromNode.documentId : '');
      if (!fromNode || !fromNode.documentId) return;
      grouped[key] = grouped[key] || [];
      grouped[key].push(relation);
    });
    Object.keys(grouped).forEach((key) => {
      if (grouped[key].length > 1) {
        list.push({ id: 'meme-document-' + key, text: 'Plusieurs confirmations portent le même identifiant de document. Elles ne sont pas indépendantes.' });
      }
    });
    return list;
  }

  function textField(value, fallback) {
    return typeof value === 'string' ? value : fallback;
  }

  function readNode(raw, errors, seen) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push('Un nœud n’est pas un objet.');
      return null;
    }
    if (!nodeTypes.includes(raw.type)) errors.push('Type de nœud refusé.');
    if (typeof raw.id !== 'string' || !raw.id.trim()) errors.push('Identifiant de nœud manquant.');
    if (seen.has(raw.id)) errors.push('Identifiant de nœud en double : ' + raw.id);
    seen.add(raw.id);
    ['title', 'url', 'author', 'date', 'method', 'interest', 'linkStatus', 'documentId', 'text', 'context', 'unit', 'reference', 'indicator', 'period', 'territory', 'value', 'simulated', 'result', 'uncertainty', 'note'].forEach((key) => {
      if (raw[key] != null && typeof raw[key] !== 'string') errors.push('Le champ ' + key + ' doit être du texte.');
    });
    if (raw.status != null && !statuses.includes(raw.status)) errors.push('Statut de nœud refusé.');
    if (typeof raw.x !== 'number' || typeof raw.y !== 'number') errors.push('La position d’un nœud doit être numérique.');
    return blankNode(raw.type, raw);
  }

  function importInvestigation(data) {
    const errors = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, errors: ['Le fichier n’est pas un objet JSON.'], graph: null };
    if (data.format !== format) errors.push('Version de format non prise en charge.');
    if (!Array.isArray(data.nodes) || !Array.isArray(data.relations)) errors.push('Nœuds ou relations manquants.');
    const seen = new Set();
    const nodes = Array.isArray(data.nodes) ? data.nodes.map((raw) => readNode(raw, errors, seen)).filter(Boolean) : [];
    const relationIds = new Set();
    const relations = [];
    if (Array.isArray(data.relations)) {
      data.relations.forEach((raw) => {
        if (!raw || typeof raw !== 'object') {
          errors.push('Une relation n’est pas un objet.');
          return;
        }
        if (typeof raw.id !== 'string' || relationIds.has(raw.id)) errors.push('Identifiant de relation manquant ou en double.');
        relationIds.add(raw.id);
        const fromNode = nodes.find((node) => node.id === raw.from);
        const toNode = nodes.find((node) => node.id === raw.to);
        if (!fromNode || !toNode) errors.push('Une relation pointe vers un objet absent.');
        else if (!allows(raw.type, fromNode, toNode)) errors.push('Type de relation refusé.');
        if (raw.justification != null && typeof raw.justification !== 'string') errors.push('La justification doit être du texte.');
        relations.push({
          id: raw.id,
          from: raw.from,
          to: raw.to,
          type: raw.type,
          justification: textField(raw.justification, ''),
          independence: textField(raw.independence, ''),
        });
      });
    }
    const conclusion = data.conclusion && typeof data.conclusion === 'object' ? data.conclusion : null;
    if (!conclusion || !statuses.includes(conclusion.status)) errors.push('Conclusion absente ou statut refusé.');
    if (conclusion && conclusion.text != null && typeof conclusion.text !== 'string') errors.push('Le texte de conclusion doit être du texte.');
    if (errors.length) return { ok: false, errors, graph: null };
    return {
      ok: true,
      errors: [],
      graph: {
        format,
        nodes,
        relations,
        conclusion: {
          status: conclusion.status,
          text: textField(conclusion.text, ''),
          uncertainties: textField(conclusion.uncertainties, ''),
        },
      },
    };
  }

  function exportInvestigation(graph) {
    return clone(Object.assign({ format }, graph, { format }));
  }

  function fitView(graph, width, height) {
    if (!graph.nodes.length) return { x: 40, y: 40, scale: 1 };
    const minX = Math.min.apply(null, graph.nodes.map((node) => node.x)) - 30;
    const minY = Math.min.apply(null, graph.nodes.map((node) => node.y)) - 30;
    const maxX = Math.max.apply(null, graph.nodes.map((node) => node.x)) + 200;
    const maxY = Math.max.apply(null, graph.nodes.map((node) => node.y)) + 90;
    const scale = Math.max(0.35, Math.min(1.3, (width - 32) / (maxX - minX), (height - 32) / (maxY - minY)));
    return { x: 16 - minX * scale, y: 16 - minY * scale, scale };
  }

  return {
    format,
    seed,
    addSourceNodes,
    addNode,
    updateNode,
    moveNode,
    removeNode,
    addRelation,
    removeRelation,
    allows,
    orphanRelations,
    nudge,
    alerts,
    importInvestigation,
    exportInvestigation,
    fitView,
    nodeById,
  };
});
