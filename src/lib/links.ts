/**
 * Documents proposés aux élèves depuis la page Liens.
 * Pour en ajouter un, copier un bloc et remplir le titre, la source, le détail et l’adresse.
 */
export type DocLink = {
	title: string;
	source: string;
	detail: string;
	href: string;
};

export const docLinks: DocLink[] = [
	{
		title: 'Relevés de pH sur la Gartempe',
		source: 'Hub’Eau · qualité des rivières',
		detail:
			'Mille derniers résultats : date de prélèvement, valeur, paramètre et station. Le fichier est un CSV.',
		href: 'https://hubeau.eaufrance.fr/api/v2/qualite_rivieres/analyse_pc.csv?libelle_cours_eau=Gartempe&libelle_parametre=pH&size=1000&fields=date_prelevement,resultat,libelle_parametre,libelle_station'
	},
	{
		title: 'RECHERCHEV — formules complètes',
		source: 'rechercheV',
		detail:
			'LibreOffice Calc : partir d’une formule RECHERCHEV complète et n’en changer qu’un paramètre à la fois. Le classeur des tronçons est le fichier associé.',
		href: '/documents-tp/cours_recherchev_formules_completes.pdf'
	},
	{
		title: 'Tronçons AEP, Creuse (23)',
		source: 'rechercheV',
		detail:
			'250 tronçons pour RECHERCHEV et les tables dynamiques. Jeu pédagogique inspiré des réseaux d’eau potable de la Creuse. Ce n’est pas le tracé officiel des canalisations.',
		href: '/documents-tp/reseau_canalisation_aep_creuse_23.xlsx'
	},
	{
		title: 'TP — tables dynamiques, réseau AEP',
		source: 'rechercheV',
		detail:
			'BTSA GEMEAU, 1 h 30 : tableaux croisés dynamiques sur le classeur de 250 tronçons. Jeu pédagogique, pas l’inventaire réel des canalisations de la Creuse.',
		href: '/documents-tp/TP_TCD_Reseau_AEP_BTSA_GEMEAU.pdf'
	}
];
