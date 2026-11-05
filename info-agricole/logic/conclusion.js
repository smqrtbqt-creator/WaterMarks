(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.InfoAgri = Object.assign(root.InfoAgri || {}, { conclusion: api });
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function review(input) {
    const ticks = Array.isArray(input.ticks) ? input.ticks : [];
    const text = String(input.text || '').trim();
    const choice = input.choice || '';
    const hasTrial = ticks.includes('essai');
    const hasOtherIndicator = ticks.includes('autre-indicateur');
    const hasSim = ticks.includes('simulation');
    const hasAbsence = ticks.includes('absence');
    const hasBlogs = ticks.includes('blogs');
    const concrete = [hasTrial, hasOtherIndicator, hasSim, hasAbsence, hasBlogs].filter(Boolean).length;
    const written = text.length >= 40;
    let reading = '';
    if (choice === 'etayee') {
      reading = 'Choisir « étayée » revient à dire que les preuves disponibles suffisent à affirmer les 30 %. L’article technique ne donne pas ce résultat : il rapporte que des publications annoncent souvent 20 à 30 %, puis décrit un essai où cette économie n’est pas montrée. Les pages d’accueil et les témoignages ne mesurent pas la phrase. Le jeu de parcelles est simulé, et sa baisse de volume n’est pas de 30 %.';
    } else if (choice === 'contredite') {
      reading = 'Dire que l’affirmation est contredite partout va plus loin que les preuves. L’essai de Pusignan ne montre pas les 30 % dans ses conditions : c’est une absence de preuve pour cette phrase, pas la preuve que le goutte-à-goutte n’économise jamais d’eau. Un autre lieu, une autre culture ou une autre année pourraient donner un résultat différent. Ce résultat-là, le dossier ne le contient pas.';
    } else if (choice === 'insuffisant') {
      reading = 'La conclusion tient : les pièces du dossier ne permettent pas d’affirmer les 30 % comme un résultat général. Il reste à le justifier avec des éléments concrets, et à ne pas transformer ce manque de preuve en preuve que la pratique ne sert jamais à rien.';
    } else {
      reading = 'Trois issues sont possibles. Elles ne disent pas la même chose.';
    }
    const ok = choice === 'insuffisant' && concrete >= 3 && hasTrial && hasAbsence && written;
    return { ok, reading, concrete, written, hasTrial, hasAbsence };
  }

  return { review };
});
