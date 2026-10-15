(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.InfoAgri = Object.assign(root.InfoAgri || {}, { sourcesLogic: api });
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function reviewQuick(source, answer) {
    return {
      ok: answer === source.quick.expected,
      explain: source.quick.explain,
    };
  }

  function reviewFiche(source, answers) {
    const fields = {};
    let ok = true;
    source.fiche.forEach((field) => {
      const fieldOk = answers[field.id] === field.expected;
      fields[field.id] = { ok: fieldOk, explain: field.explain };
      if (!fieldOk) ok = false;
    });
    return { ok, fields };
  }

  function familiesReady(sources, state) {
    const done = sources.filter((source) => {
      if (source.quick.expected !== (state.quick[source.id] || '')) return false;
      if (!source.ficheRequired) return true;
      const fiche = state.fiches[source.id] || {};
      return reviewFiche(source, fiche).ok;
    });
    const testimonyDone = done.some((source) => source.family === 'temoignage' && source.ficheRequired);
    const statsDone = done.some((source) => source.family === 'statistique' && source.ficheRequired);
    const techDone = done.some((source) => source.family === 'technique' && source.ficheRequired);
    const quickDone = sources.every((source) => state.quick[source.id] === source.quick.expected);
    return {
      quickDone,
      statsDone,
      techDone,
      testimonyDone,
      ready: quickDone && statsDone && techDone && testimonyDone,
    };
  }

  return { reviewQuick, reviewFiche, familiesReady };
});
