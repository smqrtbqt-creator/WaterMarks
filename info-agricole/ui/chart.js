(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.InfoAgri = Object.assign(root.InfoAgri || {}, { chart: api });
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function bar(x, y, height, label, value, fill) {
    return (
      '<g>' +
      '<rect x="' + x + '" y="' + y + '" width="72" height="' + height + '" rx="6" fill="' + fill + '"></rect>' +
      '<text x="' + (x + 36) + '" y="' + (y - 8) + '" text-anchor="middle" font-size="14" fill="#1c2416">' + value + '</text>' +
      '<text x="' + (x + 36) + '" y="248" text-anchor="middle" font-size="13" fill="#1c2416">' + label + '</text>' +
      '</g>'
    );
  }

  function group(title, a, b, max, unit, originX) {
    const base = 228;
    const hA = Math.max(4, (a / max) * 180);
    const hB = Math.max(4, (b / max) * 180);
    return (
      '<g>' +
      '<text x="' + (originX + 86) + '" y="28" text-anchor="middle" font-size="16" font-weight="700" fill="#1c2416">' + title + '</text>' +
      bar(originX, base - hA, hA, 'A', String(a).replace('.', ','), '#1f6b45') +
      bar(originX + 100, base - hB, hB, 'B', String(b).replace('.', ','), '#8a5a32') +
      '<text x="' + (originX + 86) + '" y="268" text-anchor="middle" font-size="13" fill="#3d4a38">' + unit + '</text>' +
      '</g>'
    );
  }

  function comparisonChart(plot, showEfficiency) {
    const aEff = Math.round((plot.B.waterM3 / plot.B.tonnes) * 10) / 10;
    const efficiency = showEfficiency
      ? group('Eau par tonne', plot.A.waterM3 / plot.A.tonnes, aEff, 120, 'm³/t', 360)
      : '<text x="520" y="140" text-anchor="middle" font-size="16" fill="#3d4a38">Le second graphique s’affiche après le calcul des m³/t.</text>';
    return (
      '<svg viewBox="0 0 680 290" role="img" aria-label="Graphique simulé comparant deux parcelles">' +
      '<rect width="680" height="290" fill="#fffdf8"></rect>' +
      group('Volume total', plot.A.waterM3, plot.B.waterM3, 1000, 'm³', 40) +
      efficiency +
      '<text x="340" y="286" text-anchor="middle" font-size="12" fill="#6a5a42">Données simulées pour la classe, pas un résultat d’essai.</text>' +
      '</svg>'
    );
  }

  return { comparisonChart };
});
