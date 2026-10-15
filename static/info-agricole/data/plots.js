(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.InfoAgri = Object.assign(root.InfoAgri || {}, { plots: api });
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const plot = {
    simulated: true,
    claimPercent: 30,
    A: {
      id: 'A',
      name: 'Parcelle A',
      practice: 'Aspersion',
      waterM3: 1000,
      tonnes: 10,
    },
    B: {
      id: 'B',
      name: 'Parcelle B',
      practice: 'Goutte-à-goutte',
      waterM3: 800,
      tonnes: 9,
    },
  };

  const facts = [
    {
      id: 'affirmation',
      label: 'Phrase des 30 %',
      period: 'non précisée',
      territory: 'non précisé',
      method: 'affirmation, sans protocole',
      indicator: 'variation d’eau annoncée, sans unité ni base de comparaison',
      value: '−30 % annoncé',
    },
    {
      id: 'arvalis',
      label: 'Article ARVALIS, Pusignan',
      period: 'essais 2016-2017, article du 2 août 2018',
      territory: 'Pusignan (69), une station',
      method: 'essai maïs, goutte-à-goutte comparé à une rampe, volumes d’eau identiques',
      indicator: 'rendement à volume d’eau égal',
      value: 'rendement semblable en restriction ; économie d’eau non montrée',
    },
    {
      id: 'sdes',
      label: 'SDES, d’après Agreste',
      period: '2010-2020',
      territory: 'France métropolitaine',
      method: 'recensements agricoles, traitement SDES publié en 2023',
      indicator: 'surface irriguée et surface irrigable, en hectares',
      value: 'environ 1,8 million d’ha irrigués en 2020 ; surfaces irrigables +23 %',
    },
    {
      id: 'insee',
      label: 'Insee, d’après Agreste et la BNPE',
      period: '2010-2020',
      territory: 'France métropolitaine',
      method: 'recensements et banque des prélèvements',
      indicator: 'm³ prélevés par hectare irrigué',
      value: '1 902 m³/ha en 2020, contre 1 924 m³/ha en 2010',
    },
    {
      id: 'wiki',
      label: 'Wikipédia, besoins en eau',
      period: 'ordre de grandeur cité, page consultée le 15 octobre 2026',
      territory: 'monde',
      method: 'encyclopédie collaborative, référence encore à ouvrir',
      indicator: 'tonnes d’eau par tonne de céréales',
      value: 'environ 1 000 tonnes d’eau par tonne de céréales',
    },
    {
      id: 'simulation',
      label: 'Jeu de la classe',
      period: 'exercice, sans campagne réelle',
      territory: 'parcelles fictives',
      method: 'nombres choisis pour calculer, pas un essai',
      indicator: 'm³ totaux et m³ par tonne',
      value: '1 000 m³ pour 10 t, et 800 m³ pour 9 t',
    },
  ];

  const pairs = [
    {
      id: 'surface-vs-30',
      left: 'sdes',
      right: 'affirmation',
      prompt: 'La hausse des surfaces irriguées entre 2010 et 2020 contredit-elle la phrase des 30 % ?',
      expected: 'non',
      explain: 'Non. Les surfaces en hectares, sur la France et sur dix ans, ne mesurent pas l’économie d’une pratique sur une parcelle. Deux chiffres différents ne deviennent pas une contradiction quand l’indicateur, le territoire ou la méthode ne sont pas les mêmes.',
    },
    {
      id: 'm3ha-vs-simulation',
      left: 'insee',
      right: 'simulation',
      prompt: 'Les 1 902 m³/ha de l’Insee et les 100 m³/t de la parcelle A se contredisent-ils ?',
      expected: 'non',
      explain: 'Non. L’un est un prélèvement national par hectare irrigué. L’autre est un volume simulé par tonne, sur une parcelle fictive. On ne les soustrait pas.',
    },
    {
      id: 'essai-vs-30',
      left: 'arvalis',
      right: 'affirmation',
      prompt: 'L’essai de Pusignan prouve-t-il que le goutte-à-goutte n’économise jamais 30 % d’eau, où que ce soit ?',
      expected: 'non',
      explain: 'Non. L’essai dit que, sur cette station, en maïs, en 2016-2017, à volume d’eau égal, le rendement n’a pas montré une meilleure efficience. Cela ne prouve pas un résultat contraire dans toutes les fermes. Absence de preuve dans cet essai n’est pas preuve d’absence partout.',
    },
  ];

  return { plot, facts, pairs };
});
