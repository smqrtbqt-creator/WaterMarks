/** Programme de la première année de BTSA GEMEAU. Les intitulés viennent de la progression. */

export type GemeauPart = {
	id: string;
	title: string;
	items: string[];
};

export type GemeauDoc = {
	partId: string;
	title: string;
	detail: string;
	href: string;
};

/** Fiches déposées pour la classe, rattachées à une partie du programme. */
export const gemeauDocs: GemeauDoc[] = [
	{
		partId: 'II',
		title: 'Chimie de l’eau : de la concentration à l’énergie libre de Gibbs',
		detail:
			'Cours : concentrations, quotient réactionnel et énergie libre. Applications à la dénitrification, au fer, au manganèse et aux carbonates.',
		href: '/documents-tp/cours_chimie_eau_gibbs.pdf'
	},
	{
		partId: 'II',
		title: 'Équilibrer la nitrification',
		detail:
			'Activité : construire la demi-équation de l’ammonium vers le nitrate, puis la réaction avec le dioxygène.',
		href: '/documents-tp/activite_nitrification.pdf'
	},
	{
		partId: 'II',
		title: 'Équilibrer la dénitrification',
		detail:
			'Suite de l’activité sur la nitrification. La matière organique est écrite CH₂O. On retrouve l’équation à partir de deux demi-équations.',
		href: '/documents-tp/activite_denitrification.pdf'
	},
	{
		partId: 'II',
		title: 'Quiz de chimie générale et de chimie de l’eau',
		detail:
			'45 à 60 minutes : matière, concentrations, acides et bases, dureté, alcalinité, solubilité et oxydoréduction. Le corrigé est à la fin du PDF.',
		href: '/documents-tp/quiz_chimie_btsa_gemeau.pdf'
	},
	{
		partId: 'III',
		title: 'Nitrates et phosphates dans les sols agricoles',
		detail:
			'Cours : adsorption, désorption, solubilité, mobilité et transfert des nitrates et des phosphates.',
		href: '/documents-tp/cours_nitrates_phosphates_sols.pdf'
	},
	{
		partId: 'III',
		title: 'Bassins de la Gartempe et de la Creuse',
		detail: 'Fiche : catégories de polluants, débits et flux massiques sur ces bassins versants.',
		href: '/documents-tp/diagnostic_bassins_gartempe_creuse.pdf'
	},
	{
		partId: 'III',
		title: 'Dilution, diffusion, dispersion et bilan de matière',
		detail:
			'Activité de 2 heures sur le bassin de la Gartempe. Les débits et les concentrations de la fiche sont fictifs.',
		href: '/documents-tp/activite_dilution_dispersion_gartempe.pdf'
	}
];

export const gemeauParts: GemeauPart[] = [
	{
		id: 'I',
		title: 'Qualité physico-chimique de l’eau',
		items: [
			'pH',
			'Température',
			'Conductivité électrique',
			'Minéralisation',
			'Salinité',
			'Oxygène dissous',
			'Solubilité de l’oxygène et influence de la température',
			'Matières en suspension — MES',
			'Turbidité',
			'Formes de l’azote et azote global — NGL',
			'Phosphates et phosphore total — Pt',
			'Dureté de l’eau — titre hydrotimétrique, TH',
			'Alcalinité — titre alcalimétrique complet, TAC',
			'Composition ionique de l’eau',
			'Rapport d’adsorption du sodium — SAR',
			'Risques de précipitation, d’entartrage et de colmatage',
			'Interprétation et comparaison des paramètres physico-chimiques'
		]
	},
	{
		id: 'II',
		title: 'Chimie des solutions aqueuses',
		items: [
			'Solvant et soluté',
			'Dissolution',
			'Solubilité',
			'Masse molaire et quantité de matière',
			'Concentration massique',
			'Concentration molaire',
			'Unités de concentration et conversions',
			'Dilution et facteur de dilution',
			'Préparation d’une solution',
			'Dosage et détermination d’une concentration',
			'Ions en solution : cations et anions',
			'Électroneutralité d’une solution',
			'Acides et bases',
			'Équilibres acido-basiques',
			'Pouvoir tampon',
			'Carbonates et bicarbonates',
			'Calcium et magnésium',
			'Sodium et chlorures',
			'Nitrates, nitrites et ammonium',
			'Phosphates',
			'Précipitation et dissolution des sels',
			'Réactions d’oxydoréduction'
		]
	},
	{
		id: 'III',
		title: 'Pollution et transfert dans l’eau',
		items: [
			'Concentration d’un polluant',
			'Masse de polluant',
			'Flux massique de polluant',
			'Dilution et mélange',
			'Bilan de matière',
			'Transport par écoulement',
			'Diffusion et dispersion',
			'Transfert par ruissellement',
			'Transfert par infiltration et drainage',
			'Transport de substances dissoutes',
			'Transport de substances associées aux particules',
			'Adsorption et désorption',
			'Solubilité et mobilité des substances',
			'Transformations chimiques des polluants',
			'Hydrocarbures',
			'Hydrocarbures aromatiques polycycliques — HAP',
			'Éléments traces métalliques — ETM',
			'Propriétés physico-chimiques des pesticides',
			'Transfert des composés azotés et phosphorés'
		]
	},
	{
		id: '12',
		title: 'Instrumentation',
		items: [
			'pH-mètre',
			'Conductimètre',
			'Oxymètre',
			'Turbidimètre',
			'Principe physique ou chimique des instruments',
			'Choix de la gamme de mesure',
			'Résolution et précision',
			'Étalonnage',
			'Vérification des appareils',
			'Protocoles de mesure',
			'Prélèvement et conservation des échantillons',
			'Acquisition et enregistrement des données',
			'Exploitation des données expérimentales'
		]
	}
];
