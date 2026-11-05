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
	}
];
