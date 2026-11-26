/**
 * Fiches de travaux pratiques proposées aux élèves.
 * Pour en ajouter une : déposer le fichier dans static/documents-tp/,
 * puis copier un bloc avec son thème.
 * L’adresse est /documents-tp/nom-du-fichier.
 * `classe` reste le public d’origine de la fiche. Le catalogue groupe par thème.
 */
import { gemeauDocs } from '$lib/gemeau';

export type TpDocument = {
	theme: string;
	classe: string;
	title: string;
	detail: string;
	href: string;
};

export const themeOrder = [
	'Présentation',
	'pH',
	'Chimie de l’eau',
	'Pollution et transfert',
	'Qualité de l’eau',
	'Eau et agriculture',
	'rechercheV',
	'table pivot / table dynamique',
	'Comptabilité',
	'Tableur',
	'CV',
	'Fiabilité de l’information'
];

const gemeauTheme: Record<string, string> = {
	II: 'Chimie de l’eau',
	III: 'Pollution et transfert'
};

export const tpDocuments: TpDocument[] = [
	{
		theme: 'Fiabilité de l’information',
		classe: 'Seconde SAPAT',
		title: 'Fiabilité des informations, premiers secours',
		detail:
			'Page du TP : dix sources à examiner sans les classer d’après leur nom, tableau des conséquences, export pour Writer.',
		href: '/secours-info/'
	},
	{
		theme: 'Fiabilité de l’information',
		classe: 'Seconde SAPAT',
		title: 'Fiche PDF — fiabilité des informations, premiers secours',
		detail: 'Sujet d’origine du TP, à lire à côté de la page interactive.',
		href: '/documents-tp/TP_fiabilite_premiers_secours.pdf'
	},
	{
		theme: 'Présentation',
		classe: 'Seconde SAPAT',
		title: 'Bien vieillir — présentation Impress',
		detail:
			'LibreOffice Impress : présentation bilingue de six diapositives sur la vie sociale et l’activité physique des personnes âgées. Les informations viennent du portail officiel pour-les-personnes-agees.gouv.fr. Fiche PDF.',
		href: '/documents-tp/tp_sapat_bien_vieillir_impress.pdf'
	},
	{
		theme: 'Tableur',
		classe: 'Seconde SAPAT',
		title: 'Suivre la participation aux animations',
		detail:
			'LibreOffice Calc, en binôme : totaux, moyennes et graphique de participation à cinq animations. Fiche PDF.',
		href: '/documents-tp/tp_sapat_participation_animations.pdf'
	},
	{
		theme: 'Eau et agriculture',
		classe: 'Seconde Aquaculture',
		title: 'L’eau et l’agriculture en France',
		detail:
			'Surfaces irriguées, cycle de l’eau et techniques d’irrigation, puis présentation Impress. Fiche PDF.',
		href: '/documents-tp/2de-Aqua-TP2.pdf'
	},
	{
		theme: 'pH',
		classe: 'Seconde Aquaculture',
		title: 'Étudier le pH de différentes eaux',
		detail:
			'LibreOffice Calc, en binôme : moyennes et graphique. Les mesures sont fictives. Fiche PDF.',
		href: '/documents-tp/tp_ph_seconde_aquaculture.pdf'
	},
	{
		theme: 'pH',
		classe: 'Seconde CCE',
		title: 'Étudier le pH de différentes eaux',
		detail:
			'LibreOffice Calc, en binôme : moyennes et graphique, avec l’eau d’abreuvement en situation. Les mesures sont fictives. Fiche PDF.',
		href: '/documents-tp/tp_ph_seconde_cce.pdf'
	},
	{
		theme: 'CV',
		classe: 'Seconde professionnelle SAP',
		title: 'TD2 — CV et confidentialité',
		detail: 'Fiche PDF du TD.',
		href: '/documents-tp/education_2026-11-04_101645.pdf'
	},
	{
		theme: 'CV',
		classe: 'Seconde professionnelle agricole',
		title: 'CV et données personnelles',
		detail: 'Fiche PDF du TD : compléter un CV sans exposer de données inutiles.',
		href: '/documents-tp/education_2026-11-04_094129.pdf'
	},
	{
		theme: 'CV',
		classe: 'Seconde professionnelle agricole',
		title: 'Modèle de CV',
		detail: 'Fichier Word à compléter : formation, stage, expériences.',
		href: '/documents-tp/CV_Seconde_agricole.docx'
	},
	{
		theme: 'CV',
		classe: 'Bac Pro SAPAT',
		title: 'Modèle de CV',
		detail: 'Fichier LibreOffice à compléter : formation, stage, expériences.',
		href: '/documents-tp/CV_template_arrondi_SAPAT.odt'
	},
	{
		theme: 'Comptabilité',
		classe: 'Première CGEA',
		title: 'Analyser les dépenses d’une exploitation agricole',
		detail:
			'Trier et filtrer le journal des dépenses, repérer des coûts compressibles et préparer un budget prévisionnel 2026. Fiche PDF. Données fictives.',
		href: '/documents-tp/tp-1-CGEA-2.pdf'
	},
	{
		theme: 'Comptabilité',
		classe: 'Première CGEA',
		title: 'Classeur — comptabilité d’une exploitation agricole',
		detail:
			'Journal des dépenses, à ouvrir dans LibreOffice Calc. La fiche demande ce nom : TP_comptabilite_exploitation_agricole.xlsx.',
		href: '/documents-tp/TP_comptabilite_exploitation_agricole.xlsx'
	},
	{
		theme: 'pH',
		classe: 'Première STAV',
		title: 'pH de la Gartempe, Calc',
		detail:
			'Étudier le pH réel de la Gartempe dans LibreOffice Calc : import CSV, indicateurs et graphiques. Fiche PDF.',
		href: '/documents-tp/TP_pH_Gartempe_Calc_corrige-5.pdf'
	},
	{
		theme: 'Qualité de l’eau',
		classe: 'BTSA GEMEAU',
		title: '1re année — qualité de l’eau, chimie, pollution, instrumentation',
		detail:
			'Page du programme : paramètres physico-chimiques, solutions aqueuses, transfert des polluants et appareils de mesure. Les cours et activités sont rangés sur cette page.',
		href: '/gemeau'
	},
	...gemeauDocs.map((doc) => ({
		theme: gemeauTheme[doc.partId] ?? 'Qualité de l’eau',
		classe: 'BTSA GEMEAU',
		title: doc.title,
		detail: doc.detail,
		href: doc.href
	})),
	{
		theme: 'pH',
		classe: 'BTSA GEMEAU',
		title: 'pH de la Gartempe, Calc',
		detail: 'Exploiter les mesures réelles de pH dans LibreOffice Calc. Fiche PDF.',
		href: '/documents-tp/TP_pH_Gartempe_Calc_corrige-3.pdf'
	},
	{
		theme: 'pH',
		classe: 'Fiches sans classe indiquée',
		title: 'TP pH de la Gartempe — calculs corrigés',
		detail: 'Fiche PDF : corrigé des calculs de pH.',
		href: '/documents-tp/TP_pH_Gartempe_Calc_corrige.pdf'
	}
];
