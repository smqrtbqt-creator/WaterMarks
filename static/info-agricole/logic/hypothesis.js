(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.InfoAgri = Object.assign(root.InfoAgri || {}, { hypothesis: api });
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function sameSet(chosen, expected) {
    const a = [...chosen].sort();
    const b = [...expected].sort();
    return a.length === b.length && a.every((id, index) => id === b[index]);
  }

  function reviewQuestion(question, selected) {
    const chosen = Array.isArray(selected) ? selected.filter(Boolean) : [];
    const ok = sameSet(chosen, question.expected);
    return {
      ok,
      explain: question.explain,
      missing: question.expected.filter((id) => !chosen.includes(id)),
    };
  }

  function missionReady(questions, answers) {
    return questions.every((question) => reviewQuestion(question, answers[question.id] || []).ok);
  }

  return { reviewQuestion, missionReady };
});
