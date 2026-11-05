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

export const tpDocuments: TpDocument[] = [];
