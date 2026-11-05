(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.InfoAgri = Object.assign(root.InfoAgri || {}, { catalog: api });
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function field(id, prompt, hint, expected, explain, options) {
    return { id, prompt, hint, expected, explain, options };
  }

  const sources = [
    {
      id: 'adele',
      title: 'La Ferme d’Adèle',
      kind: 'Témoignage',
      family: 'temoignage',
      ficheRequired: true,
      url: 'https://lafermedadele.fr/sinstaller-en-maraichage-bio-mon-parcours-mes-erreurs-et-ce-que-je-peux-transmettre-aujourdhui/',
      status: 'ouvert',
      statusLabel: 'Page ouverte le 15 octobre 2026',
      precise: 'Récit de Jonathan, daté du 19 janvier 2026, sur son installation en maraîchage bio. Il écrit qu’il ne détient pas un modèle unique. La page propose un appel gratuit, puis éventuellement un mentorat.',
      quick: {
        expected: 'pas-mesure',
        explain: 'Ce récit parle d’un parcours, pas d’un volume d’eau. Le classer « peu fiable » parce que c’est un blog ne répond pas à la question. L’information précise, ici, ne mesure pas les 30 %.',
        options: [
          { id: 'prouve', label: 'Elle prouve les 30 %, parce qu’un maraîcher parle de sa ferme.' },
          { id: 'pas-mesure', label: 'Elle raconte une installation. Elle ne mesure pas la consommation d’eau.' },
          { id: 'classe', label: 'C’est un blog, donc toute information agricole y est fausse.' },
        ],
      },
      fiche: [
        field('auteur', 'Qui signe l’information ?', 'Regardez la signature, pas seulement le nom de la ferme.', 'jonathan', 'La page est signée Jonathan, le 19 janvier 2026. Le nom du site ne remplace pas l’auteur du texte.', [
          { id: 'jonathan', label: 'Jonathan, pour la Ferme d’Adèle, le 19 janvier 2026.' },
          { id: 'ministere', label: 'Le ministère de l’Agriculture.' },
          { id: 'inconnu', label: 'Aucun auteur n’est indiqué.' },
        ]),
        field('methode', 'Quelle méthode a produit cette information ?', 'Un parcours raconté n’est pas un essai avec répétitions.', 'recit', 'C’est un retour d’expérience. Il peut éclairer une installation. Il ne décrit pas un protocole de mesure de l’eau.', [
          { id: 'recit', label: 'Un récit personnel, sans mesure d’eau.' },
          { id: 'essai', label: 'Un essai comparatif en station.' },
          { id: 'recensement', label: 'Un recensement national.' },
        ]),
        field('preuve', 'Quelle preuve la page apporte-t-elle sur les 30 % ?', 'Cherchez un volume, une culture irriguée, une comparaison.', 'aucune', 'Aucun volume d’irrigation n’est donné. L’absence de ce chiffre dans le récit n’est pas la preuve que la phrase est fausse.', [
          { id: 'aucune', label: 'Pas de mesure de l’eau. Le texte ne porte pas sur les 30 %.' },
          { id: 'mesure', label: 'Un tableau de volumes d’eau avant et après le goutte-à-goutte.' },
          { id: 'preuve-absence', label: 'La preuve que le goutte-à-goutte n’économise jamais d’eau.' },
        ]),
        field('interet', 'Un intérêt autre que l’information est-il visible ?', 'Lisez la fin de la page, là où un service est proposé.', 'mentorat', 'Un appel gratuit puis un accompagnement sont proposés. Cet intérêt se note. Il ne rend pas le récit automatiquement faux, et il n’en fait pas une mesure.', [
          { id: 'mentorat', label: 'Oui : un échange, puis un mentorat, sont proposés.' },
          { id: 'aucun', label: 'Non, la page ne propose rien.' },
          { id: 'vente-eau', label: 'Oui : la ferme vend du matériel d’irrigation.' },
        ]),
        field('confirmer', 'Une autre source du dossier peut-elle confirmer ce parcours ?', 'Confirmer un récit de vie n’est pas confirmer un pourcentage d’eau.', 'non', 'Les autres pages ne racontent pas cette ferme. Même si elles le faisaient, cela ne confirmerait pas les 30 %.', [
          { id: 'non', label: 'Non. Et confirmer ce récit ne trancherait pas la phrase sur l’eau.' },
          { id: 'agreste', label: 'Oui, Agreste mesure le parcours de cette ferme.' },
          { id: 'oui-30', label: 'Oui, un autre blog suffit à prouver les 30 %.' },
        ]),
      ],
    },
    {
      id: 'agreste',
      title: 'Agreste — portail de la statistique agricole',
      kind: 'Statistique institutionnelle',
      family: 'statistique',
      ficheRequired: true,
      url: 'https://agreste.agriculture.gouv.fr/agreste-web/',
      status: 'ouvert',
      statusLabel: 'Page ouverte le 15 octobre 2026',
      precise: 'Le 15 octobre 2026, la page d’accueil annonce notamment : en 2024, l’emploi agricole en France hors DROM est de 654 460 ETP, soit 1,3 % de moins qu’en 2023. Elle annonce aussi des publications, dont une note prospective sur l’eau dans le bassin Seine-Normandie. Cette note n’a pas été ouverte pour le TP : son titre n’est pas son résultat.',
      quick: {
        expected: 'autre-objet',
        explain: 'Le chiffre vérifié sur cette page porte sur l’emploi, pas sur l’eau d’irrigation. Un site officiel ne rend pas vraie une phrase qui n’y figure pas. Le −1,3 % n’est pas une baisse d’eau.',
        options: [
          { id: 'prouve', label: 'Le site du ministère suffit à prouver les 30 %, parce qu’il est officiel.' },
          { id: 'autre-objet', label: 'La page donne un chiffre précis, mais il porte sur l’emploi agricole de 2024, pas sur les 30 % d’eau.' },
          { id: 'eau', label: 'Le −1,3 % de la page est la baisse de l’eau d’irrigation.' },
        ],
      },
      fiche: [
        field('auteur', 'Qui produit cette page ?', 'Agreste est le service statistique du ministère, pas un blog de ferme.', 'ssp', 'C’est le site public d’Agreste, statistique agricole du ministère. L’auteur du chiffre d’emploi n’est pas un maraîcher.', [
          { id: 'ssp', label: 'Agreste, service statistique du ministère de l’Agriculture.' },
          { id: 'youtubeur', label: 'Un créateur de vidéos.' },
          { id: 'jonathan', label: 'Jonathan, maraîcher.' },
        ]),
        field('date', 'De quand date l’information précise lue sur la page d’accueil ?', 'Le chiffre d’emploi a une année. La consultation du site en a une autre.', 'emploi-2024', 'L’emploi cité concerne 2024, avec une comparaison à 2023. La page a été consultée le 15 octobre 2026. Ces deux dates ne sont pas interchangeables.', [
          { id: 'emploi-2024', label: 'Le chiffre d’emploi porte sur 2024. La page a été consultée le 15 octobre 2026.' },
          { id: 'toujours', label: 'Une statistique officielle n’a pas de date.' },
          { id: '2018', label: 'Le chiffre d’emploi date du 2 août 2018.' },
        ]),
        field('preuve', 'Que prouve cette page d’accueil pour la phrase des 30 % ?', 'Un bon chiffre sur un sujet ne se transporte pas sur un autre.', 'rien-eau', 'Elle ne contient pas la mesure des 30 %. Elle contient une autre information, sur l’emploi. Il faudra ouvrir une publication sur l’irrigation pour parler d’irrigation.', [
          { id: 'rien-eau', label: 'Rien sur les 30 %. Le chiffre affiché parle d’emploi.' },
          { id: 'prouve-30', label: 'Elle prouve les 30 % parce que le domaine est gouv.fr.' },
          { id: 'contredit', label: 'Le −1,3 % contredit les 30 %.' },
        ]),
        field('limite', 'Quelle est la limite de cette page pour le TP ?', 'Une page d’accueil n’est pas la publication complète.', 'accueil', 'La page d’accueil ne donne ni le protocole du recensement, ni un essai d’irrigation. S’en servir pour les 30 % serait changer de sujet.', [
          { id: 'accueil', label: 'C’est une vitrine. Le chiffre visible ne porte pas sur l’eau d’irrigation.' },
          { id: 'aucune', label: 'Aucune limite : tout ce qui est sur un site officiel concerne toutes les questions.' },
          { id: 'mensonge', label: 'La limite est que les statistiques publiques sont toujours fausses.' },
        ]),
        field('confirmer', 'Peut-on confirmer les 30 % avec une autre page Agreste sans lire ce qu’elle mesure ?', 'Confirmer, c’est retrouver le même objet, pas le même logo.', 'non', 'Une autre publication pourra confirmer l’emploi, ou donner des surfaces irriguées. Tant qu’elle ne mesure pas la même pratique, le même indicateur et la même comparaison, elle ne confirme pas les 30 %.', [
          { id: 'non', label: 'Non. Il faut que l’autre source parle du même indicateur.' },
          { id: 'oui', label: 'Oui, dès que la source est aussi Agreste.' },
          { id: 'blog', label: 'Oui, si un blog donne le même pourcentage.' },
        ]),
      ],
    },
    {
      id: 'wikipedia',
      title: 'Wikipédia — Agriculture',
      kind: 'Encyclopédie collaborative',
      family: 'encyclopedie',
      ficheRequired: false,
      url: 'https://fr.wikipedia.org/wiki/Agriculture',
      status: 'ouvert',
      statusLabel: 'Page ouverte le 15 octobre 2026',
      precise: 'Dans la partie sur les besoins en eau douce, la page écrit qu’une tonne de céréales nécessite en moyenne 1 000 tonnes d’eau, et renvoie à une référence. Elle distingue aussi l’agriculture pluviale et l’agriculture irriguée. La référence n’a pas été ouverte pour préparer le TP.',
      quick: {
        expected: 'autre-indicateur',
        explain: 'La phrase de l’encyclopédie est un ordre de grandeur mondial, à vérifier dans la référence. Elle ne décrit pas un essai de goutte-à-goutte en France. Écarter la page seulement parce que c’est Wikipédia, ou la croire sans ouvrir la source, rate l’information précise.',
        options: [
          { id: 'jamais', label: 'Wikipédia ne sert jamais. On peut ignorer la phrase sans la lire.' },
          { id: 'prouve', label: 'Les 1 000 tonnes d’eau prouvent les 30 % du goutte-à-goutte.' },
          { id: 'autre-indicateur', label: 'C’est un ordre de grandeur mondial, autre indicateur. La référence reste à ouvrir.' },
        ],
      },
      fiche: [],
    },
    {
      id: 'villedieu',
      title: 'Ferme de la Villedieu — blog',
      kind: 'Blog d’exploitation',
      family: 'temoignage',
      ficheRequired: true,
      url: 'https://ferme-villedieu.com/blog-ferme/',
      status: 'maintenance',
      statusLabel: 'Adresse en maintenance le 15 octobre 2026',
      also: [
        { href: 'https://ferme-villedieu.com/', label: 'Page d’accueil de la ferme, ouverte le même jour' },
        { href: 'https://ferme-villedieu.com/2020/08/13/quest-ce-que-lassolement/', label: 'Article du 13 août 2020 sur l’assolement' },
      ],
      precise: 'L’adresse du TP ouvre une page de maintenance. L’accueil de la ferme, lui, présente la vente de pommes de terre, le lin et des visites, à Roman (Mesnils-sur-Iton). L’article du 13 août 2020 explique l’assolement. Aucun de ces textes ne donne un volume d’eau d’irrigation.',
      quick: {
        expected: 'lien',
        explain: 'Une adresse en maintenance ne peut pas servir de preuve. L’accueil et l’article sur l’assolement sont d’autres pages : elles parlent de la ferme et des cultures, pas des 30 %. Un blog d’agriculteur n’est pas « faux par nature ». Ici, l’information utile est que la page demandée ne s’ouvre pas.',
        options: [
          { id: 'lien', label: 'L’adresse du TP est en maintenance. On ne peut pas s’en servir, et les pages ouvertes ne mesurent pas les 30 %.' },
          { id: 'prouve', label: 'Une ferme qui vend des pommes de terre prouve l’économie d’eau.' },
          { id: 'faux', label: 'Comme c’est un blog, tout ce que dit l’agricultrice est faux.' },
        ],
      },
      fiche: [
        field('date', 'Que peut-on dire de la date ?', 'Une page qui ne s’ouvre pas n’a pas de date de publication lisible.', 'maintenance', 'Le 15 octobre 2026, l’adresse du TP est en maintenance. L’article sur l’assolement, lui, est daté du 13 août 2020. Ce n’est pas la même page.', [
          { id: 'maintenance', label: 'L’adresse du TP ne s’ouvre pas. L’article d’assolement date du 13 août 2020.' },
          { id: '2026', label: 'Le blog a été publié le 15 octobre 2026.' },
          { id: 'sans', label: 'La date ne compte pas pour un blog.' },
        ]),
        field('preuve', 'Quelle preuve d’économie d’eau ces pages donnent-elles ?', 'Cherchez un chiffre d’eau, pas seulement un récit de culture.', 'aucune', 'Ni la maintenance, ni la vente de pommes de terre, ni l’explication de l’assolement ne mesurent les 30 %.', [
          { id: 'aucune', label: 'Aucune mesure des 30 %.' },
          { id: 'essai', label: 'Un essai goutte-à-goutte contre aspersion.' },
          { id: 'national', label: 'La statistique nationale de l’irrigation.' },
        ]),
        field('interet', 'Quel intérêt apparaît sur l’accueil de la ferme ?', 'La page propose une vente.', 'vente', 'La ferme vend sa production et propose des visites. C’est un intérêt commercial visible. Il se note, sans conclure que toute phrase d’un agriculteur est fausse.', [
          { id: 'vente', label: 'Une vente de pommes de terre et des visites sont proposées.' },
          { id: 'aucun', label: 'Aucun intérêt n’est visible.' },
          { id: 'institut', label: 'La ferme est un institut de recherche public.' },
        ]),
        field('limite', 'Quelle limite bloque l’usage de l’adresse du TP ?', 'On ne cite pas une page qu’on n’a pas lue.', 'pas-lue', 'Tant que la page est en maintenance, elle ne prouve rien. Il ne faut pas la remplacer en silence par une autre adresse.', [
          { id: 'pas-lue', label: 'La page du TP ne peut pas être lue. Une autre URL est une autre source.' },
          { id: 'fiable', label: 'Aucune limite : le nom de la ferme suffit.' },
          { id: 'contredit', label: 'La maintenance prouve que les 30 % sont faux.' },
        ]),
        field('confirmer', 'L’article sur l’assolement confirme-t-il les 30 % ?', 'Même ferme ne veut pas dire même information.', 'non', 'L’article explique une notion agronomique, à une date ancienne par rapport à la consultation. Il ne confirme pas un pourcentage d’eau.', [
          { id: 'non', label: 'Non. Il parle d’assolement, pas de cette mesure d’eau.' },
          { id: 'oui', label: 'Oui, parce que c’est la même ferme.' },
          { id: 'wiki', label: 'Oui, parce que Wikipédia parle aussi d’agriculture.' },
        ]),
      ],
    },
    {
      id: 'arvalis',
      title: 'ARVALIS — institut technique',
      kind: 'Publication technique',
      family: 'technique',
      ficheRequired: true,
      url: 'https://www.arvalis.fr/',
      status: 'ouvert',
      statusLabel: 'Accueil ouvert le 15 octobre 2026',
      also: [
        {
          href: 'https://www.arvalis.fr/infos-techniques/le-goutte-goutte-peut-il-trouver-sa-place-en-grandes-cultures',
          label: 'Article du 2 août 2018 sur le goutte-à-goutte',
        },
      ],
      precise: 'L’accueil présente l’institut et des actualités d’octobre 2026. Il ne contient pas la phrase des 30 %. L’article technique du 2 août 2018, signé Romain Tscheiller, écrit que le goutte-à-goutte est souvent présenté comme plus économe que l’aspersion, « 20 à 30 % d’économie selon les publications ». Sur l’essai de maïs à Pusignan (69), en 2016-2017, à volume d’eau égal, le rendement est du même ordre en situation de restriction. L’article conclut que une meilleure efficience n’a pas été prouvée sur ces deux années.',
      quick: {
        expected: 'article',
        explain: 'Le nom d’ARVALIS ne tranche pas. L’accueil ne contient pas la mesure. L’article, lui, sépare une affirmation souvent lue (20 à 30 %) et le résultat de son essai : à eau égale, le rendement ne montre pas l’économie annoncée. Ce résultat a un lieu, une culture et des années.',
        options: [
          { id: 'nom', label: 'ARVALIS est un institut, donc les 30 % sont vrais.' },
          { id: 'article', label: 'L’accueil ne mesure pas les 30 %. L’article de 2018 rapporte cette idée, puis un essai qui ne la montre pas.' },
          { id: 'partout', label: 'L’essai prouve que le goutte-à-goutte n’économise jamais d’eau, nulle part.' },
        ],
      },
      fiche: [
        field('auteur', 'Qui signe l’information utile sur l’eau ?', 'L’accueil de l’institut et l’article ne sont pas le même texte.', 'tscheiller', 'L’article est signé Romain Tscheiller (ARVALIS), le 2 août 2018. L’accueil consulté en 2026 est une autre page.', [
          { id: 'tscheiller', label: 'Romain Tscheiller, ARVALIS, article du 2 août 2018.' },
          { id: 'accueil', label: 'Personne : l’accueil de 2026 contient déjà le résultat.' },
          { id: 'eleve', label: 'L’auteur est l’élève qui répète la phrase.' },
        ]),
        field('methode', 'Quelle méthode décrit l’article ?', 'Cherchez la culture, le lieu et ce qui est comparé.', 'pusignan', 'Essai de maïs à Pusignan, goutte-à-goutte comparé à une rampe sur enrouleur, avec des volumes d’eau identiques ou plus restrictifs. Figure indiquée pour 2016-2017.', [
          { id: 'pusignan', label: 'Essai en station, maïs, Pusignan (69), comparaison à volume d’eau égal.' },
          { id: 'recit', label: 'Un témoignage sans mesure.' },
          { id: 'france', label: 'Un recensement de toutes les fermes françaises.' },
        ]),
        field('preuve', 'Que montre cette preuve, exactement ?', 'Séparez la phrase « selon les publications » et le résultat de l’essai.', 'pas-prouve', 'L’article ne présente pas 20 à 30 % comme son résultat. Il dit que cette économie est souvent annoncée, et que l’essai n’a pas prouvé une meilleure efficience sur les deux premières années.', [
          { id: 'pas-prouve', label: 'L’essai ne montre pas l’économie annoncée. Il ne dit pas non plus ce qui se passe dans toutes les fermes.' },
          { id: 'prouve-30', label: 'L’essai mesure une baisse de 30 % partout en France.' },
          { id: 'interdit', label: 'L’essai interdit d’utiliser le goutte-à-goutte.' },
        ]),
        field('limite', 'Quelle limite empêche de généraliser ?', 'Deux années et une station ne sont pas toutes les situations.', 'limite-essai', 'Une culture, une station, deux campagnes. L’article annonce une troisième année : ce n’est pas un résultat déjà écrit sur la page.', [
          { id: 'limite-essai', label: 'Un lieu, une culture, deux années. Pas une loi pour toutes les fermes.' },
          { id: 'aucune', label: 'Aucune limite : un institut a toujours le dernier mot.' },
          { id: 'blog', label: 'La limite est que la page n’est pas un blog.' },
        ]),
        field('confirmer', 'Les statistiques nationales confirment-elles cet essai ?', 'Même thème « eau » ne veut pas dire même mesure.', 'non', 'Les pages nationales du dossier parlent de surfaces ou de prélèvements par hectare, sur toute la France. Elles ne refont pas l’essai de Pusignan, et ne confirment pas les 30 %.', [
          { id: 'non', label: 'Non. L’indicateur et l’échelle ne sont pas les mêmes.' },
          { id: 'oui', label: 'Oui, parce que tout parle d’eau.' },
          { id: 'wiki', label: 'Oui, les 1 000 tonnes d’eau de Wikipédia sont le même résultat.' },
        ]),
      ],
    },
    {
      id: 'aujourdhui',
      title: 'Agriculteur d’aujourd’hui',
      kind: 'Média et témoignage',
      family: 'temoignage',
      ficheRequired: true,
      url: 'https://www.agriculteurdaujourdhui.com/',
      status: 'ouvert',
      statusLabel: 'Page ouverte le 15 octobre 2026',
      precise: 'Thierry, fils d’agriculteur, présente sa chaîne YouTube créée en 2013, un livre et des vidéos. L’émission « RDV Agri » est indiquée en partenariat avec Agrizone, vendeur de pièces agricoles. L’accueil ne donne pas de mesure d’eau d’irrigation.',
      quick: {
        expected: 'pas-mesure',
        explain: 'La page identifie un auteur et un partenariat commercial. C’est utile pour lire la source. Elle ne contient pas la mesure des 30 %. Le partenariat ne prouve pas que toutes les vidéos sont fausses, et l’absence de chiffre ne prouve pas que la phrase est fausse.',
        options: [
          { id: 'pas-mesure', label: 'On voit un auteur et un partenariat. On ne voit pas de mesure des 30 %.' },
          { id: 'prouve', label: 'Une chaîne suivie prouve les 30 %.' },
          { id: 'faux', label: 'Le partenariat avec Agrizone rend fausse toute phrase sur l’agriculture.' },
        ],
      },
      fiche: [
        field('auteur', 'Qui parle sur cette page ?', 'Le prénom et le métier sont écrits sur la page.', 'thierry', 'Thierry se présente comme agriculteur et vidéaste. Ce n’est pas un institut, ni le ministère.', [
          { id: 'thierry', label: 'Thierry, agriculteur et auteur de la chaîne.' },
          { id: 'arvalis', label: 'ARVALIS.' },
          { id: 'insee', label: 'L’Insee.' },
        ]),
        field('interet', 'Quel intérêt autre que le récit est indiqué ?', 'Cherchez le partenaire de l’émission.', 'agrizone', 'Le partenariat avec Agrizone est écrit. Il faut le noter, puis regarder si la vidéo citée apporte une mesure. L’accueil, lui, n’en apporte pas.', [
          { id: 'agrizone', label: 'Un partenariat avec un vendeur de pièces agricoles est indiqué.' },
          { id: 'aucun', label: 'Aucun intérêt n’est visible.' },
          { id: 'public', label: 'C’est une statistique publique obligatoire.' },
        ]),
        field('preuve', 'Quelle preuve des 30 % trouve-t-on sur l’accueil ?', 'Une vidéo peut être intéressante sans contenir le chiffre cherché.', 'aucune', 'Aucune mesure d’irrigation n’est donnée sur cette page. Pour une vidéo précise, il faudrait l’ouvrir et refaire la fiche.', [
          { id: 'aucune', label: 'Pas de volume d’eau sur la page consultée.' },
          { id: 'essai', label: 'Le compte rendu d’un essai à Pusignan.' },
          { id: '30', label: 'Un tableau national des 30 %.' },
        ]),
        field('limite', 'Quelle limite faut-il écrire ?', 'L’accueil d’une chaîne n’est pas une vidéo datée.', 'accueil', 'On a consulté l’accueil, pas une vidéo précise avec sa date et ses sources. On ne peut pas lui faire dire les 30 %.', [
          { id: 'accueil', label: 'Sans vidéo précise, datée et sourcée, la page ne tranche pas.' },
          { id: 'aucune', label: 'Aucune limite.' },
          { id: 'contredit', label: 'L’absence de chiffre sur l’accueil prouve que les 30 % sont faux.' },
        ]),
        field('confirmer', 'Un autre témoignage confirme-t-il celui-ci sur les 30 % ?', 'Deux récits sans mesure ne fabriquent pas une mesure.', 'non', 'Les autres témoignages du dossier ne mesurent pas non plus ce pourcentage. Ils ne se confirment pas entre eux sur une grandeur qu’ils ne donnent pas.', [
          { id: 'non', label: 'Non. Confirmer demanderait la même mesure, ailleurs.' },
          { id: 'oui', label: 'Oui, trois blogs du même avis suffisent.' },
          { id: 'nom', label: 'Oui, si le site a l’air sérieux.' },
        ]),
      ],
    },
    {
      id: 'inrae',
      title: 'INRAE',
      kind: 'Institut de recherche',
      family: 'recherche',
      ficheRequired: false,
      url: 'https://www.inrae.fr/',
      status: 'ouvert',
      statusLabel: 'Page ouverte le 15 octobre 2026',
      precise: 'L’accueil présente l’institut et ses thèmes, dont l’adaptation de l’agriculture et la gestion de l’eau. Aucun résultat chiffré sur le goutte-à-goutte n’est donné sur cette page.',
      quick: {
        expected: 'pas-sur-page',
        explain: 'INRAE est un organisme de recherche. Cette page d’accueil ne donne pas la mesure des 30 %. Ne pas trouver le chiffre ici ne prouve pas qu’INRAE n’a jamais étudié l’irrigation : ce serait prendre une absence sur une page pour une preuve d’absence.',
        options: [
          { id: 'prouve', label: 'Le nom d’INRAE prouve les 30 %.' },
          { id: 'pas-sur-page', label: 'Cette page ne contient pas la mesure. Cela ne prouve pas qu’aucune recherche n’existe.' },
          { id: 'faux', label: 'Comme le chiffre n’est pas sur l’accueil, la phrase est fausse partout.' },
        ],
      },
      fiche: [],
    },
    {
      id: 'pourdebon',
      title: 'Pourdebon — Ferme de Franck et Blandine',
      kind: 'Article de blog commercial',
      family: 'temoignage',
      ficheRequired: true,
      url: 'https://blog.pourdebon.com/decouvrez-la-ferme-de-franck-et-blandine/',
      status: 'ouvert',
      statusLabel: 'Page ouverte le 15 octobre 2026',
      precise: 'Article de Garance Feray, publié le 1er août 2026, dans la rubrique Rencontres. Il présente une ferme entre le Cantal et la Haute-Loire, la conversion bio en 2018 et la vente directe. Les phrases sur les pratiques viennent du portrait. Aucun volume d’eau d’irrigation n’est mesuré.',
      quick: {
        expected: 'portrait',
        explain: 'L’article a une autrice, une date et un cadre commercial : le blog met en avant des producteurs. Le portrait peut décrire des choix. Il ne fournit pas la preuve des 30 %. Le noter comme blog ne dispense pas de lire la date et l’absence de mesure.',
        options: [
          { id: 'portrait', label: 'C’est un portrait daté, dans un blog qui présente des producteurs. Il ne mesure pas les 30 %.' },
          { id: 'prouve', label: 'Le mot « nature » dans l’article prouve l’économie d’eau.' },
          { id: 'faux', label: 'Tout article de blog est faux, donc inutile à lire.' },
        ],
      },
      fiche: [
        field('auteur', 'Qui a écrit la page, et quand ?', 'L’autrice de l’article n’est pas forcément l’agricultrice.', 'garance', 'Garance Feray signe l’article le 1er août 2026. Franck et Blandine sont les personnes interrogées.', [
          { id: 'garance', label: 'Garance Feray, le 1er août 2026, à partir d’un entretien.' },
          { id: 'agreste', label: 'Agreste, en 2020.' },
          { id: 'sans', label: 'La page n’a ni auteur ni date.' },
        ]),
        field('methode', 'Comment l’information a-t-elle été produite ?', 'Un entretien n’est pas un essai.', 'entretien', 'C’est une rencontre écrite. Les pratiques sont racontées. Aucun protocole de mesure de l’eau n’est décrit.', [
          { id: 'entretien', label: 'Un portrait, à partir des paroles des agriculteurs.' },
          { id: 'essai', label: 'Un essai avec volumes d’eau et rendements.' },
          { id: 'recensement', label: 'Le recensement agricole.' },
        ]),
        field('interet', 'Quel cadre commercial faut-il noter ?', 'Regardez qui publie le blog.', 'blog-vente', 'L’article est publié sur le blog Pourdebon, qui présente des fermes. Ce cadre se note. Il ne remplace pas l’examen du texte, et le texte ne mesure pas les 30 %.', [
          { id: 'blog-vente', label: 'Le blog présente des producteurs. Ce n’est pas une publication d’essai.' },
          { id: 'aucun', label: 'Aucun cadre commercial.' },
          { id: 'laboratoire', label: 'C’est un compte rendu de laboratoire public.' },
        ]),
        field('preuve', 'La phrase « sans produits chimiques » prouve-t-elle les 30 % d’eau ?', 'Une pratique annoncée n’est pas une autre grandeur.', 'non', 'Même si on discutait cette phrase, elle ne parle pas d’un volume d’irrigation. Changer de sujet ne confirme pas l’affirmation.', [
          { id: 'non', label: 'Non. Ce n’est ni le même indicateur, ni une mesure d’eau.' },
          { id: 'oui', label: 'Oui, une pratique vertueuse économise forcément 30 % d’eau.' },
          { id: 'contredit', label: 'Cette phrase contredit le recensement agricole.' },
        ]),
        field('confirmer', 'Peut-on confirmer ce portrait avec l’essai de Pusignan ?', 'Même monde agricole, objets différents.', 'non', 'L’essai parle de maïs irrigué dans le Rhône, en 2016-2017. Le portrait parle d’une ferme du Massif central, en 2026. On ne confirme pas l’un par l’autre.', [
          { id: 'non', label: 'Non. Le lieu, la date et l’objet ne correspondent pas.' },
          { id: 'oui', label: 'Oui, les deux parlent d’agriculture.' },
          { id: 'chiffres', label: 'Oui, parce que les deux ont des chiffres, même différents.' },
        ]),
      ],
    },
    {
      id: 'voix',
      title: 'Les Voix Agricoles',
      kind: 'Blog et prises de position',
      family: 'temoignage',
      ficheRequired: true,
      url: 'https://lesvoixagricoles.fr/blog/',
      status: 'ouvert',
      statusLabel: 'Page ouverte le 15 octobre 2026',
      precise: 'Le blog de l’association, à Clermont-Ferrand, publie des textes d’agriculteurs, notamment une promo 2026. Les extraits lus sont des opinions et des portraits. Aucun ne mesure une économie d’eau de 30 %.',
      quick: {
        expected: 'opinion',
        explain: 'Un texte d’opinion peut être clair sur ce que défend son auteur. Il reste une opinion tant qu’il ne joint pas une méthode et des mesures. Plusieurs opinions d’accord entre elles ne deviennent pas une preuve.',
        options: [
          { id: 'opinion', label: 'Ce sont des paroles d’agriculteurs. Elles n’apportent pas la mesure des 30 %.' },
          { id: 'prouve', label: 'Si plusieurs agriculteurs sont d’accord, les 30 % sont prouvés.' },
          { id: 'stat', label: 'Le blog est une statistique nationale.' },
        ],
      },
      fiche: [
        field('auteur', 'De quel type de source s’agit-il ?', 'Une association qui publie des tribunes n’est pas un recensement.', 'association', 'Les Voix Agricoles est une association. Les textes sont signés par des agriculteurs engagés dans une promo. Chaque article aurait sa propre date.', [
          { id: 'association', label: 'Une association qui publie des textes d’agriculteurs.' },
          { id: 'ssp', label: 'Le service statistique du ministère.' },
          { id: 'station', label: 'Une station d’essai.' },
        ]),
        field('methode', 'Quelle méthode voit-on sur le blog ?', 'Une tribune défend une idée. Elle ne décrit pas forcément un protocole.', 'tribune', 'Les textes lus défendent des choix et racontent des expériences. Ils ne décrivent pas un essai d’irrigation.', [
          { id: 'tribune', label: 'Des opinions et des portraits, sans protocole de mesure de l’eau.' },
          { id: 'essai', label: 'Un dispositif expérimental avec répétitions.' },
          { id: 'recensement', label: 'Un recensement décennal.' },
        ]),
        field('preuve', 'Une opinion est-elle une donnée, ou une preuve ?', 'Les trois mots ne sont pas synonymes.', 'opinion', 'L’opinion dit ce que la personne pense. Une donnée serait un résultat mesuré. Une preuve relierait cette donnée à la phrase, avec une méthode comparable.', [
          { id: 'opinion', label: 'Ici, on lit des opinions. Pas une donnée d’eau, donc pas une preuve des 30 %.' },
          { id: 'preuve', label: 'Toute phrase d’agriculteur est une preuve.' },
          { id: 'donnee', label: 'Le mot « promo 2026 » est une mesure d’irrigation.' },
        ]),
        field('limite', 'Quelle limite de date faut-il noter ?', 'Un blog entier n’a pas une seule date.', 'index', 'La page consultée est un sommaire. Pour citer un texte, il faut ouvrir l’article et relever sa date. Le sommaire seul ne date pas une mesure qui n’y est pas.', [
          { id: 'index', label: 'C’est un sommaire consulté le 15 octobre 2026, pas un article de mesure.' },
          { id: 'jamais', label: 'Les blogs n’ont jamais de date.' },
          { id: '2018', label: 'Tous les articles datent du 2 août 2018.' },
        ]),
        field('confirmer', 'Ces textes confirment-ils l’essai d’ARVALIS ?', 'Être d’accord sur l’agriculture ne confirme pas un résultat.', 'non', 'Ils ne reprennent ni Pusignan, ni les campagnes 2016-2017, ni un volume d’eau. Ils ne confirment pas l’essai, et ne confirment pas les 30 %.', [
          { id: 'non', label: 'Non. On ne confirme pas un essai avec une opinion sur un autre sujet.' },
          { id: 'oui', label: 'Oui, dès que les auteurs sont agriculteurs.' },
          { id: 'contre', label: 'Ils contredisent l’essai, même sans citer de chiffre.' },
        ]),
      ],
    },
    {
      id: 'memento',
      title: 'Agreste — Mémento de la statistique agricole 2025',
      kind: 'Publication statistique annoncée',
      family: 'statistique',
      ficheRequired: false,
      url: 'https://agreste.agriculture.gouv.fr/agreste-web/disaron/MemSta2025/detail/',
      status: 'erreur',
      statusLabel: 'Page d’erreur le 15 octobre 2026',
      also: [
        {
          href: 'https://agreste.agriculture.gouv.fr/agreste-web/disaron/GraFra2024Integral/detail/',
          label: 'Graph’Agri 2024, page ouverte, parution indiquée au 25 novembre 2024',
        },
        {
          href: 'https://draaf.bourgogne-franche-comte.agriculture.gouv.fr/memento-de-la-statistique-agricole-2025-bourgogne-franche-comte-a3652.html',
          label: 'Mémento régional 2025, Bourgogne-Franche-Comté, publié le 19 janvier 2026',
        },
      ],
      precise: 'L’adresse nationale du TP aboutit à une page d’erreur Agreste. Elle ne peut pas être citée comme preuve. Graph’Agri 2024 est une autre publication, nationale, plus ancienne. Le mémento 2025 trouvé ouvert est régional : ce n’est pas le document national demandé, et son chapitre sur l’eau n’a pas été retenu ici faute d’avoir vérifié un chiffre d’irrigation dedans.',
      quick: {
        expected: 'erreur',
        explain: 'Une page d’erreur ne devient pas fiable parce que l’adresse contient gouv.fr. Graph’Agri et un mémento régional sont d’autres documents, d’une autre date ou d’un autre territoire. Les substituer sans le dire fausserait la source.',
        options: [
          { id: 'erreur', label: 'L’adresse ne s’ouvre pas. Une autre publication ne la remplace pas sans être nommée.' },
          { id: 'prouve', label: 'Même en erreur, un mémento officiel prouve les 30 %.' },
          { id: 'pareil', label: 'Graph’Agri 2024 et le mémento national 2025 sont le même document.' },
        ],
      },
      fiche: [],
    },
  ];

  const extras = [
    {
      id: 'sdes',
      title: 'SDES — irrigation des surfaces agricoles, 2010-2020',
      url: 'https://www.statistiques.developpement-durable.gouv.fr/lirrigation-des-surfaces-agricoles-evolution-entre-2010-et-2020',
      note: 'Page ouverte le 15 octobre 2026. Elle sert à confronter, pas à remplacer les dix sources. En 2020, environ 1,8 million d’hectares sont irrigués en France métropolitaine, soit 6,8 % de la SAU. Les surfaces irrigables augmentent de 23 % entre 2010 et 2020. Le maïs occupe 38 % des surfaces irriguées. Source indiquée : Agreste, recensements, traitement SDES.',
    },
    {
      id: 'insee',
      title: 'Insee — prélèvements d’eau et surfaces irriguées',
      url: 'https://www.insee.fr/fr/statistiques/7728881?sommaire=7728903',
      note: 'Page ouverte le 15 octobre 2026. Le prélèvement moyen est de 1 902 m³ par hectare irrigué en 2020, contre 1 924 m³/ha en 2010. Les surfaces irriguées augmentent de 14,8 % et les prélèvements de 13,4 %. Ce n’est pas une baisse de 30 %, et ce n’est pas un essai de goutte-à-goutte.',
    },
  ];

  return { sources, extras };
});
