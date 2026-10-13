import type { ModuleId, MoleculeId, TrainSettings } from './types';
import { MODULE_ORDER } from './types';

export type Molecule = {
	id: MoleculeId;
	name: string;
	/** 0 à 1 : affinité pédagogique pour le charbon actif. Deux molécules n’ont pas la même valeur. */
	adsorbability: number;
	/** 0 à 1 : réactivité pédagogique à l’ozone. */
	ozoneability: number;
	/** Fraction retenue par nanofiltration dans ce modèle, propre à la molécule. */
	nfRejection: number;
};

export const MOLECULES: Record<MoleculeId, Molecule> = {
	cas: {
		id: 'cas',
		name: 'Molécule du cas, plutôt adsorbable',
		adsorbability: 0.85,
		ozoneability: 0.35,
		nfRejection: 0.62
	},
	faible: {
		id: 'faible',
		name: 'Autre molécule, peu adsorbable',
		adsorbability: 0.18,
		ozoneability: 0.55,
		nfRejection: 0.28
	}
};

export type ModuleInfo = {
	id: ModuleId;
	title: string;
	short: string;
	principle: string;
};

export const MODULES: Record<ModuleId, ModuleInfo> = {
	screen: {
		id: 'screen',
		title: 'Prétraitement et tamisage',
		short: 'Tamis',
		principle:
			'Retient les débris grossiers. Dans ce modèle, les colloïdes et les espèces dissoutes traversent.'
	},
	aeration: {
		id: 'aeration',
		title: 'Aération et dégazage',
		short: 'Aération',
		principle:
			'Transfère des gaz dissous vers l’air. Le H₂S strippé n’est pas détruit : il faut maîtriser la phase gazeuse. L’oxygène peut oxyder une partie du fer si le pH s’y prête ; le manganèse réagit très peu.'
	},
	neutralization: {
		id: 'neutralization',
		title: 'Neutralisation du pH',
		short: 'pH',
		principle:
			'La soude relève surtout le pH. La chaux et le calcaire consomment de l’acidité et apportent aussi du calcium et de l’alcalinité. Ce n’est pas le même geste qu’une reminéralisation réglée à la chaux et au CO₂.'
	},
	oxidation: {
		id: 'oxidation',
		title: 'Oxydation chimique',
		short: 'Oxydation',
		principle:
			'Transforme fer et manganèse dissous en particules, et peut détruire le H₂S dans l’eau. Le chlore oxyde mal le manganèse si le pH reste proche de 7. Le rendement sature : doubler la dose ne double pas l’effet.'
	},
	coagulation: {
		id: 'coagulation',
		title: 'Coagulation-floculation',
		short: 'Coagulation',
		principle:
			'Regroupe des colloïdes. La dose utile dépend de la turbidité et du pH. Trop peu ou trop de coagulant donne un floc médiocre. Le fer dissous n’est pas retenu.'
	},
	settling: {
		id: 'settling',
		title: 'Décantation',
		short: 'Décantation',
		principle: 'Laisse déposer un floc déjà formé. Sans coagulation, les fines décantent mal.'
	},
	filtration: {
		id: 'filtration',
		title: 'Filtration',
		short: 'Filtre',
		principle:
			'Retient des particules. Un filtre propre laisse passer le fer et le manganèse dissous. Un média biologique ne retire qu’une part limitée du COT, parce que le COT ne dit pas quelle fraction est biodégradable.'
	},
	remineralization: {
		id: 'remineralization',
		title: 'Reminéralisation',
		short: 'Reminéralisation',
		principle:
			'Ajoute calcium et alcalinité. Le couple chaux–CO₂ suit un bilan molaire pédagogique. Un apport équilibré minéralise sans être une simple correction de pH à la soude.'
	},
	softening: {
		id: 'softening',
		title: 'Adoucissement',
		short: 'Adoucisseur',
		principle:
			'Résine échangeuse qui retire calcium et magnésium tant qu’il reste de la capacité. Elle ne retire pas les nitrates. Une résine épuisée ne traite plus.'
	},
	nitrate: {
		id: 'nitrate',
		title: 'Élimination des nitrates',
		short: 'Nitrates',
		principle:
			'Dénitrification biologique ou résine sélective. La voie biologique peut augmenter l’indicateur microbien : une désinfection ensuite devient nécessaire. La résine dépend de sa capacité restante et produit un éluat à gérer.'
	},
	carbon: {
		id: 'carbon',
		title: 'Adsorption sur charbon actif',
		short: 'Charbon',
		principle:
			'Retient certaines molécules organiques et une part des pesticides. L’efficacité dépend de la molécule, du temps de contact et de la saturation. Un charbon saturé n’adsorbe presque plus.'
	},
	membrane: {
		id: 'membrane',
		title: 'Filtration membranaire',
		short: 'Membrane',
		principle:
			'L’ultrafiltration retient particules et micro-organismes, pas les sels dissous ni ce pesticide. La nanofiltration et l’osmose retiennent davantage de dissous, avec un concentrât et une pression minimale.'
	},
	ozone: {
		id: 'ozone',
		title: 'Traitement par ozone',
		short: 'Ozone',
		principle:
			'Oxyde une partie des matières organiques et inactive des micro-organismes. Il ne laisse pas de résiduel dans le réseau. Toutes les molécules de pesticide ne réagissent pas de la même façon.'
	},
	uv: {
		id: 'uv',
		title: 'Désinfection par UV',
		short: 'UV',
		principle:
			'Inactive des micro-organismes sans résiduel. Une turbidité élevée abrite les germes du rayonnement. Le débit réduit la dose réellement délivrée.'
	},
	chlorine: {
		id: 'chlorine',
		title: 'Désinfection par chlore',
		short: 'Chlore',
		principle:
			'Le chlore libre dépend de la dose, de la demande et du temps de contact. L’acide hypochloreux, majoritaire à pH modéré, est la forme la plus active dans ce modèle. La turbidité limite l’effet. Ce n’est pas une eau déclarée potable.'
	}
};

export function emptyEnabled(): Record<ModuleId, boolean> {
	return Object.fromEntries(MODULE_ORDER.map((id) => [id, false])) as Record<ModuleId, boolean>;
}

export function defaultSettings(moleculeId: MoleculeId = 'cas'): TrainSettings {
	return {
		enabled: emptyEnabled(),
		airIntensity: 40,
		airContactMin: 8,
		airFlow: 30,
		neutralReagent: 'soda',
		neutralDose: 10,
		neutralTargetPh: 7.2,
		oxidant: 'chlorine',
		oxidantDose: 0.8,
		oxidantContactMin: 10,
		coagulant: 'alum',
		coagulantDose: 4,
		coagMix: 50,
		coagContactMin: 8,
		settlingMin: 15,
		filterMedia: 'sand',
		filterRate: 8,
		filterState: 10,
		reminMedia: 'lime-co2',
		reminContactMin: 10,
		reminLime: 10,
		reminCo2: 8,
		softenerCapacity: 40,
		nitrateTech: 'resin',
		nitrateRate: 30,
		nitrateCapacity: 40,
		carbonType: 'gac',
		carbonContactMin: 8,
		carbonSaturation: 20,
		moleculeId,
		membrane: 'uf',
		membranePressure: 3,
		membraneRecovery: 80,
		ozoneDose: 1,
		ozoneContactMin: 6,
		ozoneTransfer: 50,
		uvDose: 20,
		uvFlow: 40,
		chlorineDose: 0.6,
		chlorineDemand: 0.4,
		chlorineContactMin: 15,
		sourceInvestigated: false
	};
}

/** Volume d’un essai, fixé pour comparer les essais. Ce n’est pas le débit d’une usine. */
export const RUN_VOLUME_M3 = 100;
