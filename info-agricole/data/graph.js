(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.InfoAgri = Object.assign(root.InfoAgri || {}, { graphSchema: api });
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const format = 1;

  const statuses = [
    { id: 'a-verifier', label: 'À vérifier' },
    { id: 'etayee', label: 'Étayée par les éléments disponibles' },
    { id: 'contestee', label: 'Contestée ou contradictoire' },
    { id: 'insuffisant', label: 'Informations insuffisantes' },
  ];

  const nodeTypes = [
    { id: 'source', label: 'Source' },
    { id: 'affirmation', label: 'Affirmation' },
    { id: 'preuve', label: 'Preuve' },
    { id: 'verification', label: 'Vérification' },
  ];

  const relationTypes = [
    { id: 'porte-sur', label: 'Porte sur', from: ['source', 'preuve'], to: ['affirmation'] },
    { id: 'fournit', label: 'Fournit', from: ['source'], to: ['preuve'] },
    { id: 'meme-document', label: 'Même document', from: ['source', 'preuve'], to: ['source', 'preuve'] },
    { id: 'autre-indicateur', label: 'Autre indicateur', from: ['preuve'], to: ['affirmation', 'preuve'] },
    { id: 'etaye', label: 'Étaye', from: ['preuve'], to: ['affirmation'] },
    { id: 'conteste', label: 'Conteste', from: ['preuve'], to: ['affirmation'] },
    { id: 'ne-confirme-pas', label: 'Ne confirme pas', from: ['source', 'preuve'], to: ['affirmation', 'preuve'] },
    { id: 'donnees-simulees', label: 'Données simulées', from: ['preuve'], to: ['affirmation'] },
    { id: 'confirme', label: 'Confirme', from: ['source', 'preuve'], to: ['affirmation', 'preuve'] },
    { id: 'verifie', label: 'Vérifie', from: ['verification'], to: ['affirmation', 'preuve', 'source'] },
  ];

  return { format, statuses, nodeTypes, relationTypes };
});
