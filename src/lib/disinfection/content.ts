export const ORGANISMS = [
	{
		id: 'bacteria' as const,
		name: 'Bactéries indicatrices',
		example: 'Escherichia coli',
		route: 'Voie fécale-orale. E. coli est un indicateur de contamination fécale, pas à lui seul tous les pathogènes.',
		chlorine: 'En général sensibles au chlore lorsque le résiduel, le pH et le temps de contact sont réunis.',
		limit: 'Une eau claire et chlorée peut encore poser question pour d’autres familles de microorganismes.'
	},
	{
		id: 'virus' as const,
		name: 'Virus',
		example: 'Virus entériques',
		route: 'Souvent fécale-orale, par l’eau ou les mains. Ils sont plus petits que les bactéries.',
		chlorine: 'Souvent plus résistants que les bactéries indicatrices. Le modèle leur demande plus de CT pédagogique.',
		limit: 'Une filtration sur sable en retire peu dans ce module. Une membrane d’ultrafiltration pédagogique en retire une partie, pas la totalité des virus.'
	},
	{
		id: 'giardia' as const,
		name: 'Giardia',
		example: 'Giardia',
		route: 'Protozoaire, kystes transmis par voie fécale-orale, y compris par l’eau.',
		chlorine: 'Plus résistant que les bactéries. Le temps de contact et la filtration comptent fortement.',
		limit: 'La dose de chlore ne remplace pas une eau bien clarifiée.'
	},
	{
		id: 'crypto' as const,
		name: 'Cryptosporidium',
		example: 'Cryptosporidium',
		route: 'Protozoaire, oocystes transmis par voie fécale-orale. L’arrêté cite Cryptosporidium comme exemple de pathogène à rechercher si un indicateur de spores est dépassé, pour les eaux superficielles ou influencées.',
		chlorine: 'Très résistant à la chloration dans les conditions usuelles de traitement. Le modèle le montre : le CT de chlore ne fait presque pas baisser l’indicateur.',
		limit: 'Filtration, UV, ozone ou membrane sont ici les leviers. Aucune valeur unique de chlore ne garantit tous les pathogènes.'
	}
];

export const LEGIONELLA = {
	name: 'Legionella pneumophila',
	route: 'Transmission par inhalation d’aérosols (douches, tours aéroréfrigérantes), pas par le simple fait de boire un verre d’eau.',
	limit: 'Elle se développe surtout dans les réseaux d’eau chaude stagnante. Le chlore résiduel du réseau public d’eau froide ne règle pas à lui seul la prévention dans un bâtiment.'
};

export const PROCESSES = [
	{
		id: 'chlorine-gas',
		name: 'Chlore gazeux',
		family: 'Désinfection chimique, avec effet rémanent possible',
		principle: 'Le chlore dissous forme l’acide hypochloreux HOCl et l’ion hypochlorite OCl⁻. HOCl est la forme la plus active dans ce modèle.',
		targets: 'Bactéries et une partie des virus. Effet faible sur Cryptosporidium aux conditions usuelles.',
		advantages: 'Effet rémanent possible dans le réseau. Mesure du résiduel praticable.',
		drawbacks: 'Dépend du pH, de la demande, du temps et de la turbidité. Sous-produits possibles avec la matière organique.',
		operators: 'Gaz toxique. Fuite : évacuer, interdire l’accès, alerter les personnes formées et les secours. Un débutant n’intervient pas sur la fuite.',
		byproducts: 'Des sous-produits chlorés peuvent se former en présence de matière organique. L’indice du module n’est pas un dosage.',
		residual: 'Oui, s’il reste du chlore libre après la demande.',
		maintenance: 'Stockage des bouteilles, détection, ventilation, contrôle du résiduel et du pH.',
		when: 'Lorsque l’eau est déjà clarifiée et qu’un résiduel dans le réseau est recherché.'
	},
	{
		id: 'hypochlorite',
		name: 'Hypochlorite de sodium',
		family: 'Désinfection chimique, avec effet rémanent possible',
		principle: 'Eau de Javel adaptée au traitement de l’eau. Elle libère les mêmes espèces actives que le chlore : HOCl et OCl⁻.',
		targets: 'Proche du chlore gazeux sur les microorganismes. Même limite face à Cryptosporidium.',
		advantages: 'Liquide, sans bouteille de gaz sous pression. Résiduel mesurable.',
		drawbacks: 'La solution se dégrade à la chaleur et à la lumière. Le pH de l’eau de Javel est basique.',
		operators: 'Corrosif. Projection dans les yeux ou sur la peau : rincer abondamment à l’eau, ne pas neutraliser avec un autre produit, alerter les secours. Ne jamais mélanger avec un acide ou de l’ammoniaque : du chlore gazeux peut se dégager.',
		byproducts: 'Même famille de sous-produits chlorés que le chlore, si la matière organique est présente.',
		residual: 'Oui, après satisfaction de la demande.',
		maintenance: 'Stockage au frais, ventilé, à l’écart des acides et de l’ammoniaque. Contrôle du titre et du résiduel.',
		when: 'Petite et moyenne installation, quand un résiduel est voulu et que le gaz n’est pas retenu.'
	},
	{
		id: 'chlorine-dioxide',
		name: 'Dioxyde de chlore',
		family: 'Désinfection et oxydation chimiques',
		principle: 'Gaz dissous produit sur place. Ce n’est pas le même équilibre que HOCl / OCl⁻.',
		targets: 'Large spectre désinfectant. Le module ne lui attribue pas une efficacité chiffrée réelle.',
		advantages: 'Moins dépendant du pH que le chlore libre dans les descriptions classiques. Peut laisser un résiduel.',
		drawbacks: 'Précurseurs et sous-produits propres : chlorites et chlorates. Génération sur site.',
		operators: 'Gaz irritant, génération à maîtriser par du personnel formé.',
		byproducts: 'Chlorite et chlorate sont des sujets de surveillance distincts du chlore libre. Aucune limite chiffrée n’est réutilisée ici sans son échéance et son champ.',
		residual: 'Un résiduel de dioxyde de chlore peut exister. Ce n’est pas du chlore libre.',
		maintenance: 'Générateur, précurseurs, mesures spécifiques.',
		when: 'Quand le goût de chlore ou les sous-produits du chlore posent problème, après une étude de filière. Pas un réglage de ce simulateur.'
	},
	{
		id: 'ozone',
		name: 'Ozone',
		family: 'Oxydation et désinfection chimiques, sans rémanence dans les tuyaux',
		principle: 'Gaz produit sur place. Il oxyde et inactive. Il ne reste pas comme désinfectant dans les canalisations.',
		targets: 'Bactéries, virus, et une partie des protozoaires, mieux que le chlore sur Cryptosporidium dans ce modèle pédagogique.',
		advantages: 'Oxydant puissant, utile aussi sur le goût et la couleur.',
		drawbacks: 'Pas de protection du réseau. Risque de bromate si l’eau contient des bromures. Gaz toxique à maîtriser.',
		operators: 'Ozone gazeux irritant. Local ventilé, détecteurs, personnel formé.',
		byproducts: 'Bromate possible. Le module ne calcule pas une concentration de bromate.',
		residual: 'Non dans le réseau de distribution.',
		maintenance: 'Générateur, destructeur d’ozone résiduel dans l’air, énergie.',
		when: 'En filière, souvent avant une désinfection qui, elle, laisse un résiduel.'
	},
	{
		id: 'uv',
		name: 'Rayonnement UV-C',
		family: 'Inactivation physique, sans effet rémanent',
		principle: 'Les UV-C endommagent le matériel génétique. Ils ne mettent pas de désinfectant dans l’eau.',
		targets: 'Bactéries, virus et Cryptosporidium, si l’eau est assez claire pour laisser passer le rayonnement.',
		advantages: 'Pas de sous-produit chloré. Efficace sur des organismes résistants au chlore, dans ce modèle, quand la turbidité est basse.',
		drawbacks: 'Aucun résiduel. Une eau trouble ou une lampe encrassée réduit l’effet. La lampe vieillit.',
		operators: 'Risque pour les yeux et la peau si la lampe est vue directement. Carénage fermé.',
		byproducts: 'Pas la famille des sous-produits du chlore.',
		residual: 'Non. Les UV ne protègent pas le réseau.',
		maintenance: 'Gainage, transmittance de l’eau, nettoyage, changement de lampe, contrôle d’intensité.',
		when: 'En complément, surtout si des protozoaires résistants au chlore sont la préoccupation, sur une eau déjà filtrée.'
	},
	{
		id: 'membrane',
		name: 'Procédés membranaires',
		family: 'Séparation physique, pas une désinfection rémanente',
		principle: 'L’eau traverse une paroi dont le seuil retient des particules, des microorganismes, et parfois des espèces dissoutes selon le type de membrane.',
		targets: 'La microfiltration et l’ultrafiltration retiennent bactéries et protozoaires. Les virus demandent plutôt l’ultrafiltration ou un seuil plus fin. La nanofiltration et l’osmose inverse retiennent davantage d’espèces dissoutes.',
		advantages: 'Barrière physique, peu dépendante de la chimie du chlore.',
		drawbacks: 'Aucune membrane ne retire indistinctement tous les polluants dissous. Une fuite d’intégrité laisse passer ce que le seuil devait arrêter. Pas de résiduel désinfectant.',
		operators: 'Pression, nettoyage chimique des membranes : produits à manipuler selon les fiches, par du personnel formé.',
		byproducts: 'Pas de sous-produit de chloration du fait de la membrane elle-même. Les lavages chimiques sont un autre sujet.',
		residual: 'Non.',
		maintenance: 'Intégrité, colmatage, lavages, turbidité ou comptage en sortie.',
		when: 'Clarification poussée ou rétention de microorganismes, souvent suivie d’une désinfection rémanente si le réseau doit rester protégé.'
	}
];

export const REFERENCES = [
	{
		title: 'Arrêté du 11 janvier 2007 modifié par l’arrêté du 30 décembre 2022',
		url: 'https://www.legifrance.gouv.fr',
		note: 'Limites et références de qualité des eaux destinées à la consommation humaine. En vigueur au 1er janvier 2023 pour la modification de 2022. E. coli : 0/100 mL. Turbidité : limite 1,0 NFU et référence 0,50 NFU au point de mise en distribution, dans le champ décrit par l’annexe. pH : référence ≥ 6,5 et ≤ 9, eaux non agressives. Chlore libre et total : absence d’odeur ou de saveur désagréable et pas de changement anormal, sans seuil chiffré dans cette annexe.'
	},
	{
		title: 'Code de la santé publique',
		url: 'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006072665/',
		note: 'Articles R. 1321-2 et suivants sur la qualité de l’eau destinée à la consommation humaine. Le contrôle sanitaire et les limites ne se confondent pas avec une consigne de dose.'
	},
	{
		title: 'Ministère chargé de la santé',
		url: 'https://sante.gouv.fr',
		note: 'Politique de l’eau potable et information des consommateurs.'
	},
	{
		title: 'Agences régionales de santé',
		url: 'https://www.ars.sante.fr',
		note: 'Contrôle sanitaire local et information sur la qualité de l’eau distribuée.'
	},
	{
		title: 'ANSES — avis sur le chlore dans les réseaux d’eau',
		url: 'https://www.anses.fr/fr/system/files/EAUX-2023-SA-0002-RA.pdf',
		note: 'Avis relatif aux risques en cas de diminution ou de suppression du chlore. Il rappelle que l’arrêté ne fixe pas de seuil chiffré de chlore libre. Les objectifs cités du plan Vigipirate ne sont pas des limites de qualité de l’annexe.'
	},
	{
		title: 'Santé publique France',
		url: 'https://www.santepubliquefrance.fr',
		note: 'Surveillance des épidémies d’origine hydrique et information sur les pathogènes. Le module ne remplace pas un signalement sanitaire.'
	},
	{
		title: 'INRS — fiche toxicologique Chlore (FT 51)',
		url: 'https://www.inrs.fr/publications/bdd/fichetox/fiche.html?refINRS=FICHETOX_51',
		note: 'En cas de fuite : fermer l’arrivée seulement si cela se fait sans risque ; sinon interdire l’approche, aérer, évacuer, et alerter les secours formés. Ce module demande au débutant d’évacuer et d’alerter, pas d’intervenir sur la fuite.'
	},
	{
		title: 'INRS — fiche toxicologique Hypochlorite de sodium (FT 157)',
		url: 'https://www.inrs.fr/publications/bdd/fichetox/fiche.html?refINRS=FICHETOX_157',
		note: 'Stockage à l’écart des acides et de l’ammoniaque. Contact : rincer abondamment à l’eau, alerter les secours, ne pas neutraliser avec un autre produit.'
	},
	{
		title: 'Morris J. C., 1966 — équilibre de l’acide hypochloreux',
		url: 'https://pubs.acs.org/journal/jpchax',
		note: 'Formule de pKa utilisée pour f(HOCl). C’est une relation physicochimique de référence, pas une consigne de pH d’usine.'
	}
];

export const MODEL_LIMITS = [
	'Les eaux brutes, les doses et les coefficients k sont des hypothèses pédagogiques. Aucune ne reproduit une installation nommée.',
	'Le CT est le produit du chlore libre, de la fraction de HOCl, du temps, d’un facteur de température 1,06^(T−20) et d’un facteur de turbidité. Ce n’est pas une table de crédits réglementaires.',
	'Cryptosporidium est plafonné à 0,15 log de réduction par le chlore seul, pour montrer sa résistance habituelle. Ce plafond n’est pas une mesure.',
	'Chlore libre, chlore combiné et chlore total se distinguent. Le total simulé est la somme du libre et du combiné. Le chlore consommé par la demande n’est plus du résiduel.',
	'L’indice de sous-produits n’est pas une concentration de trihalométhanes.',
	'La couleur de l’eau sur le schéma suit la turbidité. Une eau claire à l’écran n’est pas la preuve qu’elle est potable.',
	'La conformité affichée est pédagogique. Elle ne vaut ni contrôle sanitaire, ni autorisation de distribution.'
];
