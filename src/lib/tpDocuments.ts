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
