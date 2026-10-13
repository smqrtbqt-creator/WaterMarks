import { stabilityOf } from './engine';
import type { AnalysisRow, MeasureStatus, StudyCase, Water } from './types';

function water(partial: Partial<Water>): Water {
	return {
		ph: 7.2,
		turbidityNtu: 0.6,
		ironDissolvedMgL: 0.02,
		ironParticulateMgL: 0,
		manganeseDissolvedMgL: 0.01,
		manganeseParticulateMgL: 0,
		nitrateMgL: 8,
		calciumF: 8,
		magnesiumF: 4,
		alkalinityF: 12,
		h2sMgL: 0,
		h2sStrippedMgL: 0,
		h2sOxidizedMgL: 0,
		tocMgL: 1.2,
		microbial: 2,
		pesticideUgL: 0,
		chlorineFreeMgL: 0,
		...partial,
		hardnessF: (partial.calciumF ?? 8) + (partial.magnesiumF ?? 4)
	};
}

function row(
	id: string,
	label: string,
	unit: string,
	value: number | null,
	digits: number,
	status: MeasureStatus
): AnalysisRow {
	return { id, label, unit, value, digits, status };
}

const measured = (id: string, label: string, unit: string, value: number, digits = 2) =>
	row(id, label, unit, value, digits, 'measured');
const missing = (id: string, label: string, unit: string) => row(id, label, unit, null, 0, 'missing');
const simulated = (id: string, label: string, unit: string, value: number, digits = 1) =>
	row(id, label, unit, value, digits, 'simulated');

const ALL = [
	{
		id: 'fer',
		kicker: 'Cas 1',
		title: 'Excès de fer',
		origin: 'Captage souterrain',
		symptoms: 'Eau brunâtre au soutirage, dépôt ocre dans le réservoir.',
		water: water({ ph: 7, turbidityNtu: 2.2, ironDissolvedMgL: 2, calciumF: 7, magnesiumF: 3, alkalinityF: 10 }),
		rows: [
			measured('ph', 'pH', '', 7, 1),
			measured('turbidity', 'Turbidité', 'NTU', 2.2, 1),
			measured('iron', 'Fer dissous', 'mg/L', 2, 1),
			simulated('color', 'Teinte ocre estimée', 'indice', 70, 0),
			missing('mn', 'Manganèse', 'mg/L'),
			missing('pest', 'Pesticides', 'µg/L')
		],
		goals: [
			'Fer total ≤ 0,20 mg/L, soit la référence de qualité de 200 µg/L (arrêté du 11 janvier 2007 modifié).',
			'Turbidité de sortie ≤ 1 NTU dans cet atelier.'
		],
		unknowns: ['La spéciation Fe(II) / Fe(III) n’est pas distinguée par cette seule analyse.', 'Le manganèse n’a pas été dosé.'],
		problems: ['iron'],
		hints: [
			'La couleur et le fer dissous vont ensemble. Un filtre seul laisse passer ce qui est dissous.',
			'L’oxydation transforme le fer dissous en particules. Ces particules demandent ensuite une séparation.',
			'Oxydation chimique puis filtration. Ajustez dose et temps de contact : la courbe sature. L’aération à pH 7 n’oxyde qu’une partie du fer dans ce modèle.'
		],
		moleculeId: 'cas',
		focus: ['ironTotal', 'turbidityNtu', 'ironDissolvedMgL', 'ironParticulateMgL']
	},
	{
		id: 'turbidite',
		kicker: 'Cas 2',
		title: 'Eau trouble',
		origin: 'Rivière',
		symptoms: 'Eau visiblement trouble après une pluie.',
		water: water({ ph: 7.2, turbidityNtu: 8, ironDissolvedMgL: 0.05, alkalinityF: 8, calciumF: 6, magnesiumF: 3 }),
		rows: [
			measured('turbidity', 'Turbidité', 'NTU', 8, 1),
			measured('ph', 'pH', '', 7.2, 1),
			measured('iron', 'Fer dissous', 'mg/L', 0.05, 2),
			simulated('particles', 'Charge colloïdale estimée', 'indice', 80, 0),
			missing('toc', 'COT', 'mg/L')
		],
		goals: ['Turbidité ≤ 1 NTU. La limite réglementaire au point de mise en distribution est 1,0 NFU dans le champ d’application de l’arrêté, et la référence est 0,50 NFU.'],
		unknowns: ['La nature exacte des colloïdes n’est pas connue.', 'Le COT n’a pas été mesuré.'],
		problems: ['turbidity'],
		hints: [
			'Huit NTU, ce sont surtout des particules fines. Le tamisage ne suffit pas.',
			'La coagulation a une dose et un pH utiles. En dehors, le floc reste faible et le filtre colmate ou laisse passer.',
			'Coagulation à dose proche du sommet de la courbe, puis filtration. Une dose très basse laisse la turbidité haute.'
		],
		moleculeId: 'cas',
		focus: ['turbidityNtu']
	},
	{
		id: 'nitrates',
		kicker: 'Cas 3',
		title: 'Excès de nitrates',
		origin: 'Puits en nappe',
		symptoms: 'Analyse de routine au-dessus de la limite, eau claire.',
		water: water({ ph: 7.1, turbidityNtu: 0.4, nitrateMgL: 78, microbial: 4, calciumF: 14, magnesiumF: 6, alkalinityF: 18 }),
		rows: [
			measured('nitrate', 'Nitrates', 'mg/L', 78, 0),
			measured('ph', 'pH', '', 7.1, 1),
			measured('turbidity', 'Turbidité', 'NTU', 0.4, 1),
			missing('nitrite', 'Nitrites', 'mg/L'),
			missing('pest', 'Pesticides', 'µg/L')
		],
		goals: ['Nitrates ≤ 50 mg/L, limite de qualité de l’arrêté du 11 janvier 2007 modifié. La somme nitrates/50 + nitrites/3 n’est pas calculable ici : les nitrites manquent.'],
		unknowns: ['Nitrites non mesurés.', 'L’origine agricole ou naturelle n’est pas établie par ce seul chiffre.'],
		problems: ['nitrate'],
		hints: [
			'78 mg/L est au-dessus de 50 mg/L. Un adoucisseur classique ne retire pas les nitrates.',
			'Deux voies sont dans la station : dénitrification biologique et résine sélective. La biologie peut relever l’indicateur microbien.',
			'Résine avec de la capacité restante, ou dénitrification puis désinfection. Une résine épuisée ne change rien.'
		],
		moleculeId: 'cas',
		focus: ['nitrateMgL', 'microbial']
	},
	{
		id: 'microbes',
		kicker: 'Cas 4',
		title: 'Contamination microbiologique',
		origin: 'Eau de rivière déjà partiellement clarifiée',
		symptoms: 'E. coli détecté dans 100 mL. L’origine n’est pas encore identifiée.',
		water: water({ ph: 7.3, turbidityNtu: 4, microbial: 70, tocMgL: 2.4, nitrateMgL: 12 }),
		rows: [
			measured('ecoli', 'E. coli', '/100 mL', 12, 0),
			measured('turbidity', 'Turbidité', 'NTU', 4, 1),
			simulated('micro', 'Indicateur microbien d’atelier', '0–100', 70, 0),
			missing('crypto', 'Cryptosporidium', ''),
			missing('origin', 'Origine de la contamination', '')
		],
		goals: [
			'La limite de qualité E. coli est 0 / 100 mL. L’atelier vise un indicateur ≤ 8, une turbidité ≤ 1 NTU, et une recherche d’origine cochée par l’apprenant.',
			'Ce succès d’atelier n’est pas un résultat de laboratoire accrédité.'
		],
		unknowns: ['Cryptosporidium non recherché.', 'L’origine de la contamination est inconnue tant que la case n’est pas travaillée sur le terrain.'],
		problems: ['microbial', 'turbidity'],
		hints: [
			'Un germe fécal demande une désinfection, et aussi de chercher d’où vient la contamination.',
			'UV et chlore perdent en efficacité quand l’eau reste trouble. Les organismes ne réagissent pas tous de la même façon au chlore.',
			'Clarifier puis désinfecter (UV ou chlore avec du chlore libre et un temps de contact). Cochez la recherche d’origine : la simulation ne la fait pas à votre place.'
		],
		moleculeId: 'cas',
		focus: ['microbial', 'turbidityNtu', 'chlorineFreeMgL']
	},
	{
		id: 'durete',
		kicker: 'Cas 5',
		title: 'Eau trop dure',
		origin: 'Captage souterrain calcaire',
		symptoms: 'Entartrage des équipements. Pas de limite réglementaire de dureté dans l’arrêté : l’objectif d’atelier est 20 °f.',
		water: water({ ph: 7.4, turbidityNtu: 0.3, hardnessF: 35, calciumF: 22, magnesiumF: 13, alkalinityF: 28, nitrateMgL: 18 }),
		rows: [
			measured('th', 'Dureté', '°f', 35, 0),
			measured('ca', 'Calcium', '°f', 22, 0),
			measured('mg', 'Magnésium', '°f', 13, 0),
			measured('ph', 'pH', '', 7.4, 1),
			missing('na', 'Sodium', 'mg/L')
		],
		goals: ['Dureté ≤ 20 °f dans cet atelier, avec baisse du calcium et du magnésium. Ce seuil n’est pas une limite de l’arrêté.'],
		unknowns: ['Le sodium après échange d’ions n’est pas mesuré.', 'Aucun objectif réglementaire de dureté n’est simulé.'],
		problems: ['hardness'],
		hints: [
			'35 °f, ce sont le calcium et le magnésium, pas la turbidité.',
			'L’adoucissement échange Ca et Mg tant que la résine a de la capacité. La régénération remet cette capacité.',
			'Montez la capacité disponible, ou régénérez. Une résine vide laisse la dureté inchangée.'
		],
		moleculeId: 'cas',
		focus: ['hardnessF', 'calciumF', 'magnesiumF']
	},
	{
		id: 'acide',
		kicker: 'Cas 6',
		title: 'Eau acide',
		origin: 'Captage souterrain peu minéralisé',
		symptoms: 'pH bas, eau agressive pour les matériaux.',
		water: water({ ph: 5.5, turbidityNtu: 0.4, alkalinityF: 2.5, calciumF: 4, magnesiumF: 2, hardnessF: 6 }),
		rows: [
			measured('ph', 'pH', '', 5.5, 1),
			measured('alk', 'Alcalinité', '°f', 2.5, 1),
			measured('ca', 'Calcium', '°f', 4, 1),
			measured('th', 'Dureté', '°f', 6, 1),
			simulated('lsi', 'Langelier d’atelier', '', -2, 1),
			missing('co2', 'CO₂ agressif', 'mg/L')
		],
		goals: [
			'pH entre 6,5 et 9, limites de l’arrêté, eaux non agressives.',
			'Alcalinité ≥ 8 °f et calcium ≥ 8 °f : objectif d’atelier pour ne pas confondre un simple relevé de pH et une eau minéralisée.',
			'L’indice de Langelier est indicatif (15 °C, 220 mg/L de TDS).'
		],
		unknowns: ['TAC et calcium sont mesurés, pas le CO₂ agressif en mg/L.', 'La température réelle du captage n’est pas saisie.'],
		problems: ['acid'],
		hints: [
			'pH 5,5 est sous 6,5. Regardez aussi l’alcalinité et le calcium, pas seulement le pH.',
			'La soude relève le pH sans apporter de calcium. Chaux, calcaire ou chaux + CO₂ minéralisent en même temps.',
			'Neutralisation à la chaux ou au calcaire, ou reminéralisation chaux–CO₂ dosée. La soude seule laisse une eau peu minéralisée.'
		],
		moleculeId: 'cas',
		focus: ['ph', 'alkalinityF', 'calciumF']
	},
	{
		id: 'manganese',
		kicker: 'Cas 7',
		title: 'Excès de manganèse',
		origin: 'Forage en terrain manganifère',
		symptoms: 'Eau qui noircit au contact de l’air, taches sur le linge.',
		water: water({ ph: 7, turbidityNtu: 1.2, manganeseDissolvedMgL: 0.25, ironDissolvedMgL: 0.08, alkalinityF: 11, calciumF: 9, magnesiumF: 4 }),
		rows: [
			measured('mn', 'Manganèse dissous', 'mg/L', 0.25, 2),
			measured('ph', 'pH', '', 7, 1),
			measured('turbidity', 'Turbidité', 'NTU', 1.2, 1),
			measured('iron', 'Fer dissous', 'mg/L', 0.08, 2),
			missing('spec', 'Forme dissoute ou particulaire après oxydation', '')
		],
		goals: ['Manganèse total ≤ 0,05 mg/L, référence de qualité 50 µg/L.'],
		unknowns: ['La part déjà oxydée n’est pas mesurée séparément à l’arrivée.', 'Le pH optimal dépend de l’oxydant choisi.'],
		problems: ['manganese'],
		hints: [
			'0,25 mg/L de manganèse dissous. Le filtre, seul, ne le retient pas.',
			'Le chlore à pH 7 oxyde mal le manganèse ici. Le permanganate, l’ozone, ou un pH plus haut avant le chlore, changent le résultat. Il faut ensuite séparer les particules.',
			'Permanganate puis filtration, ou neutralisation vers pH 8,2 puis chlore puis filtration. Le pH se règle avant l’oxydation dans cette station.'
		],
		moleculeId: 'cas',
		focus: ['mnTotal', 'manganeseDissolvedMgL', 'ph', 'turbidityNtu']
	},
	{
		id: 'h2s',
		kicker: 'Cas 8',
		title: 'Présence de H₂S',
		origin: 'Forage profond',
		symptoms: 'Odeur d’œuf pourri. L’odeur n’est pas une mesure de la concentration.',
		water: water({ ph: 7.2, turbidityNtu: 0.5, h2sMgL: 0.08, ironDissolvedMgL: 0.1, alkalinityF: 14 }),
		rows: [
			measured('h2s', 'H₂S dissous', 'mg/L', 0.08, 2),
			measured('ph', 'pH', '', 7.2, 1),
			simulated('odor', 'Odeur signalée', 'qualitatif', 1, 0),
			missing('air', 'H₂S dans l’air du local', 'mg/m³')
		],
		goals: [
			'H₂S dans l’eau ≤ 0,01 mg/L, objectif d’atelier.',
			'Si le gaz est transféré dans l’air, il reste à maîtriser. Le H₂S est toxique.'
		],
		unknowns: ['Pas de mesure d’ambiance.', 'L’odeur peut disparaître alors que le gaz est encore dangereux.'],
		problems: ['h2s'],
		hints: [
			'0,08 mg/L et une odeur. L’odeur ne donne pas la concentration.',
			'L’aération déplace le H₂S vers l’air. L’oxydation chimique le détruit dans l’eau. Ce n’est pas le même devenir.',
			'Comparez aération forte et oxydation. Dans les deux cas l’eau peut s’améliorer ; seul le bilan gaz / oxydé dit ce qu’est devenu le polluant.'
		],
		moleculeId: 'cas',
		focus: ['h2sMgL', 'h2sStrippedMgL', 'h2sOxidizedMgL']
	},
	{
		id: 'organique',
		kicker: 'Cas 9',
		title: 'Excès de matière organique',
		origin: 'Eau de surface',
		symptoms: 'COT élevé. La nature de cette matière organique n’est pas connue.',
		water: water({ ph: 7.3, turbidityNtu: 1.5, tocMgL: 12, microbial: 8, alkalinityF: 9, calciumF: 6, magnesiumF: 3 }),
		rows: [
			measured('toc', 'COT', 'mg/L', 12, 1),
			measured('turbidity', 'Turbidité', 'NTU', 1.5, 1),
			missing('doc', 'Carbone dissous biodégradable', 'mg/L'),
			missing('abs', 'Absorbance UV', ''),
			simulated('share', 'Part biodégradable supposée', '%', 36, 0)
		],
		goals: [
			'COT ≤ 5 mg/L dans cet atelier. La référence de qualité est 2 mg/L et aucun changement anormal : le modèle ne peut pas l’atteindre de façon certaine à partir du seul COT.',
			'La part « 36 % » est une hypothèse du filtre biologique, pas une analyse.'
		],
		unknowns: ['Fraction biodégradable inconnue.', 'Pesticides et autres micropolluants non recherchés.'],
		problems: ['organic'],
		hints: [
			'Un COT de 12 mg/L ne dit pas si la matière est biodégradable ou adsorbable.',
			'Le filtre biologique est plafonné. Le charbon adsorbe une autre part, tant qu’il n’est pas saturé.',
			'Charbon actif en grains, temps de contact suffisant, charbon peu saturé. Le filtre biologique seul ne descend pas assez bas dans ce modèle.'
		],
		moleculeId: 'cas',
		focus: ['tocMgL']
	},
	{
		id: 'pesticides',
		kicker: 'Cas 10',
		title: 'Présence d’un pesticide',
		origin: 'Puits influencé par un bassin agricole',
		symptoms: 'Une molécule identifiée à 0,25 µg/L. Une autre molécule du menu n’aurait pas le même comportement.',
		water: water({ ph: 7.2, turbidityNtu: 0.8, pesticideUgL: 0.25, tocMgL: 1.8, nitrateMgL: 22 }),
		rows: [
			measured('pest', 'Pesticide identifié', 'µg/L', 0.25, 2),
			measured('ph', 'pH', '', 7.2, 1),
			missing('sum', 'Total pesticides', 'µg/L'),
			missing('metab', 'Métabolites', 'µg/L'),
			simulated('ads', 'Adsorbabilité d’atelier de la molécule du cas', '0–1', 0.85, 2)
		],
		goals: [
			'Substance individuelle ≤ 0,10 µg/L, limite de qualité. Le total pesticides (0,50 µg/L) n’est pas connu : les autres molécules n’ont pas été dosées.'
		],
		unknowns: ['Somme des pesticides manquante.', 'Les métabolites ne sont pas identifiés.', 'L’adsorbabilité affichée est une propriété d’atelier, pas une mesure de terrain.'],
		problems: ['pesticide'],
		hints: [
			'0,25 µg/L pour une molécule précise. Ne généralisez pas à tous les pesticides.',
			'Le charbon dépend de l’adsorbabilité, du temps de contact et de la saturation. L’ultrafiltration ne retire pas cette molécule dissoute.',
			'Charbon actif peu saturé et temps de contact d’une vingtaine de minutes pour la molécule du cas. Basculez sur la molécule peu adsorbable pour voir la limite. Nanofiltration ou osmose sont d’autres voies, pas l’ultrafiltration.'
		],
		moleculeId: 'cas',
		focus: ['pesticideUgL', 'tocMgL']
	}
] satisfies StudyCase[];

export const CASES: StudyCase[] = ALL.map((study): StudyCase => {
	if (study.id !== 'acide') return study;
	const lsi = stabilityOf(study.water).lsi;
	return {
		...study,
		rows: study.rows.map((item) => (item.id === 'lsi' ? { ...item, value: lsi, digits: 2 } : item))
	};
});

export function caseById(id: string): StudyCase {
	return CASES.find((item) => item.id === id) ?? CASES[0];
}
