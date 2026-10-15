(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.InfoAgri = Object.assign(root.InfoAgri || {}, { calc: api });
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function percentChange(from, to) {
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null;
    return ((to - from) / from) * 100;
  }

  function perUnit(total, units) {
    if (!Number.isFinite(total) || !Number.isFinite(units) || units === 0) return null;
    return total / units;
  }

  function parseNum(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const text = String(value).trim().replace(/\s/g, '').replace(',', '.').replace(/−/g, '-');
    if (!text) return null;
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  }

  function nearly(value, expected, tolerance) {
    return value != null && Math.abs(value - expected) <= tolerance;
  }

  function reviewPlot(input, plot) {
    const volume = parseNum(input.volume);
    const waterA = parseNum(input.waterA);
    const waterB = parseNum(input.waterB);
    const efficiency = parseNum(input.efficiency);
    const drop30 = parseNum(input.drop30);
    const expectedVolume = percentChange(plot.A.waterM3, plot.B.waterM3);
    const expectedA = perUnit(plot.A.waterM3, plot.A.tonnes);
    const expectedB = perUnit(plot.B.waterM3, plot.B.tonnes);
    const expectedEfficiency = percentChange(expectedA, expectedB);
    const expectedDrop30 = plot.A.waterM3 * (1 - plot.claimPercent / 100);
    return {
      expectedVolume,
      expectedA,
      expectedB,
      expectedEfficiency,
      expectedDrop30,
      volumeOk: nearly(volume, expectedVolume, 0.6),
      waterAOk: nearly(waterA, expectedA, 0.05),
      waterBOk: nearly(waterB, expectedB, 0.15),
      efficiencyOk: nearly(efficiency, expectedEfficiency, 0.6),
      drop30Ok: nearly(drop30, expectedDrop30, 0.5),
    };
  }

  function compareFacts(a, b) {
    const fields = [
      ['period', 'la période'],
      ['territory', 'le territoire'],
      ['method', 'la méthode'],
      ['indicator', 'l’indicateur'],
    ];
    const mismatches = fields
      .filter(([key]) => a[key] !== b[key])
      .map(([, label]) => label);
    return {
      comparable: mismatches.length === 0,
      mismatches,
    };
  }

  return { percentChange, perUnit, parseNum, nearly, reviewPlot, compareFacts };
});
