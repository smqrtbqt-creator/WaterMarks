(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.InfoAgri = Object.assign(root.InfoAgri || {}, { map: api });
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function labelOf(node) {
    return node.title || node.text || node.url || node.type;
  }

  function matches(node, query) {
    if (!query) return true;
    const haystack = [node.title, node.text, node.url, node.author, node.reference, node.note].join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase());
  }

  function mapMarkup(graph, view, selectedId, query) {
    const lines = graph.relations.map((relation) => {
      const from = graph.nodes.find((node) => node.id === relation.from);
      const to = graph.nodes.find((node) => node.id === relation.to);
      if (!from || !to) return '';
      const x1 = from.x + 84;
      const y1 = from.y + 32;
      const x2 = to.x + 84;
      const y2 = to.y + 32;
      const rule = (root.InfoAgri.graphSchema.relationTypes.find((item) => item.id === relation.type) || {}).label || relation.type;
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#8a5a32" stroke-width="2"></line>' +
        '<text class="link-label" x="' + ((x1 + x2) / 2) + '" y="' + ((y1 + y2) / 2 - 6) + '" text-anchor="middle" font-size="12">' + esc(rule) + '</text>';
    }).join('');
    const nodes = graph.nodes.map((node) => {
      const selected = node.id === selectedId ? ' is-selected' : '';
      const dim = matches(node, query) ? '' : ' is-dim';
      return '<g class="node' + selected + dim + '" data-node="' + esc(node.id) + '" data-type="' + esc(node.type) + '" tabindex="0" role="button" aria-label="' + esc(labelOf(node)) + ', ' + esc(node.type) + '" transform="translate(' + Number(node.x) + ' ' + Number(node.y) + ')">' +
        '<rect width="168" height="64" rx="12"></rect>' +
        '<text x="12" y="24" font-size="12">' + esc(node.type) + '</text>' +
        '<text x="12" y="46" font-size="14">' + esc(String(labelOf(node)).slice(0, 22)) + '</text>' +
        '</g>';
    }).join('');
    return '<svg class="graph" data-pan tabindex="0" role="application" aria-label="Carte de l’investigation. Tabulation entre les nœuds, flèches pour déplacer, Entrée pour ouvrir, Suppr pour retirer, Échap pour fermer." viewBox="0 0 960 640">' +
      '<g transform="translate(' + Number(view.x) + ' ' + Number(view.y) + ') scale(' + Number(view.scale) + ')">' +
      lines + nodes + '</g></svg>';
  }

  return { mapMarkup };
});
