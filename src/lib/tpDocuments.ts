/**
 * Fiches de travaux pratiques proposées aux élèves.
 * Pour en ajouter une : déposer le fichier dans static/documents-tp/,
 * puis copier un bloc ci-dessous. L’adresse est /documents-tp/nom-du-fichier.
 */
export type TpDocument = {
	title: string;
	detail: string;
	href: string;
};

export const tpDocuments: TpDocument[] = [
	{
		title: 'Seconde SAPAT — fiabilité des informations, premiers secours',
		detail:
			'Page du TP : dix sources à examiner sans les classer d’après leur nom, tableau des conséquences, export pour Writer.',
		href: '/secours-info/'
	},
	{
		title: 'Fiche PDF — fiabilité des informations, premiers secours',
		detail: 'Sujet d’origine du TP Seconde SAPAT, à lire à côté de la page interactive.',
		href: '/documents-tp/TP_fiabilite_premiers_secours.pdf'
	},
	{
		title: 'Seconde Aquaculture — L’eau et l’agriculture en France',
		detail:
			'TP 2 : surfaces irriguées, cycle de l’eau et techniques d’irrigation, puis présentation Impress. Fiche PDF.',
		href: '/documents-tp/2de-Aqua-TP2.pdf'
	},
	{
		title: 'Première STAV — pH de la Gartempe, Calc',
		detail:
			'Étudier le pH réel de la Gartempe dans LibreOffice Calc : import CSV, indicateurs et graphiques. Fiche PDF.',
		href: '/documents-tp/TP_pH_Gartempe_Calc_corrige-5.pdf'
	},
	{
		title: 'BTSA GEMEAU — pH de la Gartempe, Calc',
		detail: 'Exploiter les mesures réelles de pH dans LibreOffice Calc. Fiche PDF.',
		href: '/documents-tp/TP_pH_Gartempe_Calc_corrige-3.pdf'
	},
	{
		title: 'TP pH de la Gartempe — calculs corrigés',
		detail: 'Fiche PDF : corrigé des calculs de pH.',
		href: '/documents-tp/TP_pH_Gartempe_Calc_corrige.pdf'
	},
	{
		title: 'TD2 — CV et confidentialité',
		detail: 'Seconde professionnelle SAP. Fiche PDF du TD.',
		href: '/documents-tp/education_2026-11-04_101645.pdf'
	},
	{
		title: 'Modèle de CV — Bac Pro SAPAT',
		detail: 'Fichier LibreOffice à compléter : formation, stage, expériences.',
		href: '/documents-tp/CV_template_arrondi_SAPAT.odt'
	},
	{
		title: 'Seconde pro agricole — CV et données personnelles',
		detail: 'Fiche PDF du TD : compléter un CV sans exposer de données inutiles.',
		href: '/documents-tp/education_2026-11-04_094129.pdf'
	},
	{
		title: 'Modèle de CV — Seconde professionnelle agricole',
		detail: 'Fichier Word à compléter : formation, stage, expériences.',
		href: '/documents-tp/CV_Seconde_agricole.docx'
	}
];
