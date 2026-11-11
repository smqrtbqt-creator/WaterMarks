/**
 * Fiches de travaux pratiques proposées aux élèves.
 * Pour en ajouter une : déposer le fichier dans static/documents-tp/,
 * puis copier un bloc dans la classe correspondante.
 * L’adresse est /documents-tp/nom-du-fichier.
 */
export type TpDocument = {
	classe: string;
	title: string;
	detail: string;
	href: string;
};

export const tpDocuments: TpDocument[] = [
	{
		classe: 'Seconde SAPAT',
		title: 'Fiabilité des informations, premiers secours',
		detail:
			'Page du TP : dix sources à examiner sans les classer d’après leur nom, tableau des conséquences, export pour Writer.',
		href: '/secours-info/'
	},
	{
		classe: 'Seconde SAPAT',
		title: 'Fiche PDF — fiabilité des informations, premiers secours',
		detail: 'Sujet d’origine du TP, à lire à côté de la page interactive.',
		href: '/documents-tp/TP_fiabilite_premiers_secours.pdf'
	},
	{
		classe: 'Seconde SAPAT',
		title: 'Suivre la participation aux animations',
		detail:
			'LibreOffice Calc, en binôme : totaux, moyennes et graphique de participation à cinq animations. Fiche PDF.',
		href: '/documents-tp/tp_sapat_participation_animations.pdf'
	},
	{
		classe: 'Seconde Aquaculture',
		title: 'L’eau et l’agriculture en France',
		detail:
			'Surfaces irriguées, cycle de l’eau et techniques d’irrigation, puis présentation Impress. Fiche PDF.',
		href: '/documents-tp/2de-Aqua-TP2.pdf'
	},
	{
		classe: 'Seconde Aquaculture',
		title: 'Étudier le pH de différentes eaux',
		detail:
			'LibreOffice Calc, en binôme : moyennes et graphique. Les mesures sont fictives. Fiche PDF.',
		href: '/documents-tp/tp_ph_seconde_aquaculture.pdf'
	},
	{
		classe: 'Seconde CCE',
		title: 'Étudier le pH de différentes eaux',
		detail:
			'LibreOffice Calc, en binôme : moyennes et graphique, avec l’eau d’abreuvement en situation. Les mesures sont fictives. Fiche PDF.',
		href: '/documents-tp/tp_ph_seconde_cce.pdf'
	},
	{
		classe: 'Seconde professionnelle SAP',
		title: 'TD2 — CV et confidentialité',
		detail: 'Fiche PDF du TD.',
		href: '/documents-tp/education_2026-11-04_101645.pdf'
	},
	{
		classe: 'Seconde professionnelle agricole',
		title: 'CV et données personnelles',
		detail: 'Fiche PDF du TD : compléter un CV sans exposer de données inutiles.',
		href: '/documents-tp/education_2026-11-04_094129.pdf'
	},
	{
		classe: 'Seconde professionnelle agricole',
		title: 'Modèle de CV',
		detail: 'Fichier Word à compléter : formation, stage, expériences.',
		href: '/documents-tp/CV_Seconde_agricole.docx'
	},
	{
		classe: 'Bac Pro SAPAT',
		title: 'Modèle de CV',
		detail: 'Fichier LibreOffice à compléter : formation, stage, expériences.',
		href: '/documents-tp/CV_template_arrondi_SAPAT.odt'
	},
	{
		classe: 'Première CGEA',
		title: 'Analyser les dépenses d’une exploitation agricole',
		detail:
			'Trier et filtrer le journal des dépenses, repérer des coûts compressibles et préparer un budget prévisionnel 2026. Fiche PDF. Données fictives.',
		href: '/documents-tp/tp-1-CGEA-2.pdf'
	},
	{
		classe: 'Première CGEA',
		title: 'Classeur — comptabilité d’une exploitation agricole',
		detail:
			'Journal des dépenses, à ouvrir dans LibreOffice Calc. La fiche demande ce nom : TP_comptabilite_exploitation_agricole.xlsx.',
		href: '/documents-tp/TP_comptabilite_exploitation_agricole.xlsx'
	},
	{
		classe: 'Première STAV',
		title: 'pH de la Gartempe, Calc',
		detail:
			'Étudier le pH réel de la Gartempe dans LibreOffice Calc : import CSV, indicateurs et graphiques. Fiche PDF.',
		href: '/documents-tp/TP_pH_Gartempe_Calc_corrige-5.pdf'
	},
	{
		classe: 'BTSA GEMEAU',
		title: 'pH de la Gartempe, Calc',
		detail: 'Exploiter les mesures réelles de pH dans LibreOffice Calc. Fiche PDF.',
		href: '/documents-tp/TP_pH_Gartempe_Calc_corrige-3.pdf'
	},
	{
		classe: 'Fiches sans classe indiquée',
		title: 'TP pH de la Gartempe — calculs corrigés',
		detail: 'Fiche PDF : corrigé des calculs de pH.',
		href: '/documents-tp/TP_pH_Gartempe_Calc_corrige.pdf'
	}
];
