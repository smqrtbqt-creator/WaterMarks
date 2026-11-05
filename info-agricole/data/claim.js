(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.InfoAgri = Object.assign(root.InfoAgri || {}, { claim: api });
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const statement = 'Le goutte-à-goutte permet de réduire de 30 % la consommation d’eau d’irrigation.';

  const questions = [
    {
      id: 'sens',
      prompt: 'Que dit précisément cette phrase, et que ne dit-elle pas ?',
      hint: 'Un pourcentage ne précise ni la culture, ni le lieu, ni l’année.',
      hint2: 'Cherchez la pratique de comparaison : elle n’est pas écrite dans la phrase.',
      multiple: false,
      expected: ['lecture'],
      explain: 'La phrase annonce une baisse relative de la consommation d’eau. Elle ne dit pas par rapport à quelle pratique, sur quelle culture, dans quel sol, ni pendant quelle année. La comprendre ainsi, ce n’est pas encore décider qu’elle est vraie.',
      options: [
        { id: 'lecture', label: 'Elle annonce une baisse de 30 % de l’eau d’irrigation, sans dire la culture, le lieu, l’année, ni la pratique à laquelle on compare.' },
        { id: 'toutes', label: 'Elle prouve que toutes les fermes en goutte-à-goutte économisent 30 % d’eau.' },
        { id: 'rendement', label: 'Elle veut dire que le rendement augmente de 30 %.' },
        { id: 'prix', label: 'Elle veut dire que l’eau coûte 30 % moins cher.' },
      ],
    },
    {
      id: 'grandeur',
      prompt: 'Quelle grandeur faut-il mesurer pour examiner la phrase ?',
      hint: 'Le pourcentage est une façon de comparer. Il faut d’abord nommer ce qui est comparé.',
      hint2: 'La phrase parle de consommation d’eau, pas du prix ni du temps de travail.',
      multiple: false,
      expected: ['volume'],
      explain: 'La grandeur nommée est l’eau d’irrigation consommée, donc un volume apporté. Le pourcentage viendra ensuite, en comparant deux volumes. L’efficacité, elle, demande aussi la production.',
      options: [
        { id: 'prix', label: 'Le prix du mètre cube d’eau.' },
        { id: 'volume', label: 'Le volume d’eau d’irrigation apportée.' },
        { id: 'surface', label: 'La seule surface de l’exploitation.' },
        { id: 'travail', label: 'Le nombre d’heures de travail.' },
      ],
    },
    {
      id: 'unite',
      prompt: 'Quelle unité permet de dire ce que l’on mesure ?',
      hint: 'Un pourcent exprime une variation. Il n’est pas l’unité du volume.',
      hint2: 'On peut compter des m³ au total, puis des m³ pour une tonne produite. Ce n’est pas la même question.',
      multiple: false,
      expected: ['m3'],
      explain: 'Le volume se mesure en mètres cubes. Le pourcent dit de combien il a changé. Les m³ par tonne répondent à une autre question : l’eau utilisée pour produire une tonne, pas le volume total de la parcelle.',
      options: [
        { id: 'pourcent', label: 'Le pourcent est déjà l’unité de la grandeur.' },
        { id: 'm3', label: 'Le volume se mesure en m³. L’eau par tonne produite se mesure en m³/t.' },
        { id: 'hectare', label: 'La seule unité possible est l’hectare.' },
        { id: 'euro', label: 'L’unité de cette phrase est l’euro.' },
      ],
    },
    {
      id: 'conditions',
      prompt: 'Quelles conditions de comparaison manquent dans la phrase ? Cochez tout ce qu’il faudrait connaître.',
      hint: 'Une comparaison honnête garde la même culture et nomme l’autre pratique.',
      hint2: 'Une année sèche comparée à une année humide, sans le dire, ne mesure pas la pratique.',
      multiple: true,
      expected: ['culture', 'pratique', 'periode', 'production'],
      explain: 'Pour attribuer une baisse à la pratique, il faut la même culture, un lieu et une période identifiés, la pratique de départ (ici, souvent l’aspersion), et la production. Sans le rendement, une baisse de volume peut venir d’une récolte plus faible.',
      options: [
        { id: 'culture', label: 'La culture et le lieu.' },
        { id: 'pratique', label: 'La pratique à laquelle on compare le goutte-à-goutte.' },
        { id: 'periode', label: 'La période, et le fait de ne pas comparer une année sèche à une année humide sans le dire.' },
        { id: 'production', label: 'La production, pour ne pas confondre « moins d’eau au total » et « moins d’eau par tonne ».' },
        { id: 'monde', label: 'Il suffit que la phrase soit répétée sur plusieurs sites.' },
      ],
    },
    {
      id: 'preuves',
      prompt: 'Quelles preuves permettraient de conclure ? Cochez les pièces utiles.',
      hint: 'Le nom du site ne mesure pas l’eau.',
      hint2: 'Une preuve décrit une méthode, des dates et des résultats. Une autre source doit parler du même objet.',
      multiple: true,
      expected: ['mesures', 'methode', 'autre'],
      explain: 'Pour conclure, il faut des volumes mesurés, la méthode, le lieu et les dates, et une autre source indépendante sur le même indicateur. Le nom de domaine, ou un avis isolé, ne remplace pas ces pièces.',
      options: [
        { id: 'mesures', label: 'Des volumes d’eau et des rendements mesurés.' },
        { id: 'methode', label: 'Le lieu, les dates et la méthode de comparaison.' },
        { id: 'autre', label: 'Une autre source indépendante qui parle du même indicateur.' },
        { id: 'nom', label: 'Le nom du site suffit, s’il se termine par .fr ou .gouv.fr.' },
        { id: 'avis', label: 'L’avis d’une personne suffit, même sans mesure.' },
      ],
    },
  ];

  return {
    statement,
    questions,
    checkedOn: '15 octobre 2026',
  };
});
