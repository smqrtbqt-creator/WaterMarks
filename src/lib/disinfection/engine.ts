import { clamp } from '../sim/chemistry';
import type {
	Alert,
	ChlorineBalance,
	Evaluation,
	OrganismId,
	OrganismResult,
	ProbeMode,
	Settings
} from './types';

/**
 * Moteur pédagogique de désinfection.
 * Il est déterministe et indépendant de l’interface.
 * Ce n’est pas une validation sanitaire ni une consigne d’exploitation.
 *
 * pKa de HOCl : formule de Morris (1966), T en kelvin :
 * pKa = 3000/T − 10,0686 + 0,0253×T.
 * f(HOCl) = 1 / (1 + 10^(pH − pKa)).
 *
 * Le chlore libre pondéré par HOCl, le temps, la température et la turbidité
 * forment un CT pédagogique. Les coefficients k ne sont pas des tables industrielles.
 * Cryptosporidium est volontairement presque insensible à ce CT.
 */

const TAU_MIN = 5;
const DEMAND_INSTANT = 0.45;

const KINETIC: Record<OrganismId, { k: number; cap: number }> = {
	bacteria: { k: 0.35, cap: 4 },
	virus: { k: 0.08, cap: 4 },
	giardia: { k: 0.012, cap: 3 },
	crypto: { k: 0.0008, cap: 0.15 }
};

export const DEFAULT_SETTINGS: Settings = {
	doseMgL: 1,
	ph: 7.2,
	contactMin: 30,
	temperatureC: 15,
	demandMgL: 0.35,
	combinedPotentialMgL: 0.1,
	turbidityNtu: 0.4,
	organic: 18,
	bacteria: 50,
	virus: 40,
	giardia: 25,
	crypto: 15,
	filtrationAid: 40,
	uvAid: false,
	ozoneAid: false,
	membraneAid: false,
	probeMode: 'calibrated',
	probeDriftMgL: 0,
	useDpdAsReference: false
};

export function pKa(temperatureC: number): number {
	const T = clamp(temperatureC, 0, 40) + 273.15;
	return 3000 / T - 10.0686 + 0.0253 * T;
}

export function hoclFraction(ph: number, temperatureC: number): number {
	const fraction = 1 / (1 + 10 ** (ph - pKa(temperatureC)));
	return clamp(fraction, 0, 1);
}

export function kineticFactor(temperatureC: number): number {
	return 1.06 ** (clamp(temperatureC, 0, 35) - 20);
}

export function turbidityShield(turbidityNtu: number): number {
	if (turbidityNtu <= 0.5) return 1;
	return clamp(1 / (1 + 0.28 * (turbidityNtu - 0.5)), 0.15, 1);
}

export function effectiveTurbidity(turbidityNtu: number, filtrationAid: number): number {
	const aid = clamp(filtrationAid, 0, 100) / 100;
	return Math.max(0, turbidityNtu) * (1 - 0.92 * aid);
}

export function chlorineBalance(settings: Settings): ChlorineBalance {
	const dose = Math.max(0, settings.doseMgL);
	const contact = Math.max(0, settings.contactMin);
	const progress = 1 - Math.exp(-contact / TAU_MIN);
	const demandProgress = DEMAND_INSTANT + (1 - DEMAND_INSTANT) * progress;
	const consumed = Math.min(dose, Math.max(0, settings.demandMgL) * demandProgress);
	const rest = dose - consumed;
	const combined = Math.min(rest, Math.max(0, settings.combinedPotentialMgL) * progress);
	const free = rest - combined;
	const hocl = hoclFraction(settings.ph, settings.temperatureC);
	return {
		injectedMgL: dose,
		consumedMgL: consumed,
		combinedMgL: combined,
		freeMgL: free,
		totalMgL: free + combined,
		hoclFraction: hocl,
		oclFraction: 1 - hocl,
		pKa: pKa(settings.temperatureC)
	};
}

export function probeReading(freeMgL: number, mode: ProbeMode, driftMgL: number): number | null {
	if (mode === 'lost') return null;
	if (mode === 'calibrated') return Math.max(0, freeMgL);
	if (mode === 'drift') return Math.max(0, freeMgL + driftMgL);
	return Math.max(0, freeMgL * 0.35 + 0.85);
}

export function byproductRisk(settings: Settings, freeMgL: number): number {
	const contactWeight = 0.6 + Math.max(0, settings.contactMin) / 40;
	const phWeight = settings.ph > 7.8 ? 1.3 : 1;
	const raw = settings.doseMgL * (settings.organic / 20) * contactWeight * phWeight * (0.7 + freeMgL);
	return clamp(raw, 0, 100);
}

function barrierSurvival(id: OrganismId, settings: Settings, turbidityNtu: number): number {
	let survival = 1;
	const filt = clamp(settings.filtrationAid, 0, 100) / 100;
	const turbPenalty = turbidityNtu > 1 ? clamp((turbidityNtu - 1) / 8, 0, 0.7) : 0;
	if (id === 'virus') survival *= 1 - filt * 0.35 * (1 - turbPenalty * 0.4);
	else survival *= 1 - filt * (0.92 - turbPenalty * 0.25);
	if (settings.uvAid) {
		const kill = (1 - turbPenalty) * (id === 'crypto' ? 0.9 : 0.85);
		survival *= 1 - kill;
	}
	if (settings.ozoneAid) survival *= 1 - (id === 'crypto' ? 0.75 : 0.8);
	if (settings.membraneAid) survival *= id === 'virus' ? 0.4 : 0.08;
	return clamp(survival, 0.02, 1);
}

function organismResult(id: OrganismId, initial: number, settings: Settings, ct: number, turbidityNtu: number): OrganismResult {
	const spec = KINETIC[id];
	const chlorineLog = Math.min(spec.k * Math.max(0, ct), spec.cap);
	const chlorineSurvival = 10 ** -chlorineLog;
	const remaining = clamp(initial, 0, 100) * chlorineSurvival * barrierSurvival(id, settings, turbidityNtu);
	const safeInitial = Math.max(initial, 0.001);
	const log10 = Math.log10(safeInitial / Math.max(remaining, 0.001));
	return {
		id,
		initial: clamp(initial, 0, 100),
		remaining: clamp(remaining, 0, 100),
		log10Reduction: Math.max(0, log10),
		chlorineLimited: id === 'crypto' && chlorineLog < 0.2
	};
}

function explanations(settings: Settings, balance: ChlorineBalance, turbidityNtu: number, organisms: OrganismResult[], byproduct: number): string[] {
	const lines: string[] = [];
	const bacteria = organisms.find((item) => item.id === 'bacteria');
	const crypto = organisms.find((item) => item.id === 'crypto');
	if (balance.hoclFraction < 0.45) {
		lines.push(
			'Le pH est élevé. La proportion estimée de HOCl diminue. À concentration de chlore libre identique, le pouvoir désinfectant peut donc être plus faible.'
		);
	} else if (balance.hoclFraction > 0.75) {
		lines.push(
			'La part estimée de HOCl est majoritaire. Baisser encore le pH n’est pas une consigne universelle : l’eau doit rester dans une zone compatible avec la potabilité.'
		);
	}
	if (settings.contactMin < 12 && balance.freeMgL > 0.05 && (bacteria?.remaining ?? 0) > 10) {
		lines.push(
			'Le temps de contact est insuffisant dans ce scénario. Une concentration résiduelle mesurable ne suffit pas, à elle seule, à garantir une désinfection efficace.'
		);
	}
	if (balance.consumedMgL > balance.injectedMgL * 0.55 && balance.injectedMgL > 0) {
		lines.push(
			'Une grande partie du chlore injecté est consommée par la demande de l’eau. Le résiduel libre est ce qui reste après cette consommation, pas la dose affichée à la pompe.'
		);
	}
	if (turbidityNtu > 1.5) {
		lines.push(
			'L’eau est encore trouble à l’entrée de la désinfection. Des microorganismes peuvent être protégés. La clarification et la filtration en amont comptent autant que la dose.'
		);
	}
	if ((crypto?.remaining ?? 0) > 30) {
		lines.push(
			'Cryptosporidium reste élevé. Dans ce modèle, la chloration classique ne suffit pas. Une filtration, des UV, de l’ozone ou une membrane pédagogique changent le résultat ; augmenter seulement le chlore, non.'
		);
	}
	if (byproduct > 40) {
		lines.push(
			'Le couple dose, matière organique et temps de contact fait monter un indice de sous-produits. Ce n’est pas une mesure de trihalométhanes. Réduire la dose ou la charge organique en amont fait baisser l’indice.'
		);
	}
	if (settings.probeMode === 'lost') {
		lines.push(
			'L’analyseur continu ne donne plus de signal. La désinfection n’est pas devenue sûre pour autant. Un contrôle DPD de référence et une surveillance renforcée compensent l’absence de mesure, le temps de rétablir l’appareil.'
		);
	} else if (settings.probeMode !== 'calibrated' && !settings.useDpdAsReference) {
		lines.push(
			'La sonde s’écarte de la mesure DPD de référence. Tant que l’écart n’est pas compris, la valeur affichée par l’analyseur ne doit pas servir seule à conclure.'
		);
	}
	if (!settings.uvAid) {
		lines.push('Les UV ne sont pas en service : ils n’apporteraient de toute façon aucun désinfectant rémanent dans les canalisations.');
	}
	if (lines.length === 0) {
		lines.push(
			'Les réglages laissent un résiduel libre, une part de HOCl et un temps de contact qui agissent ensemble. Ce résultat reste une simulation, pas une analyse de laboratoire.'
		);
	}
	return lines;
}

function alerts(
	settings: Settings,
	balance: ChlorineBalance,
	turbidityNtu: number,
	organisms: OrganismResult[],
	byproduct: number,
	probe: number | null,
	reliable: boolean
): Alert[] {
	const list: Alert[] = [];
	const bacteria = organisms.find((item) => item.id === 'bacteria');
	if (settings.ph < 6.5 || settings.ph > 9) {
		list.push({
			id: 'ph-band',
			level: 'watch',
			title: 'pH hors référence citée',
			text: 'La référence de qualité citée va de 6,5 à 9. Ce n’est pas une consigne de baisser le pH au plus bas.'
		});
	}
	if (balance.freeMgL < 0.05) {
		list.push({
			id: 'no-residual',
			level: 'fail',
			title: 'Résiduel libre très faible',
			text: 'Presque tout le chlore injecté a été consommé ou n’a pas encore laissé de résiduel libre. L’indice microbiologique des bactéries peut rester haut.'
		});
	}
	if ((bacteria?.remaining ?? 0) > 20) {
		list.push({
			id: 'bacteria',
			level: (bacteria?.remaining ?? 0) > 40 ? 'fail' : 'watch',
			title: 'Indicateur bactérien encore élevé',
			text: 'La dose seule ne raconte pas le résultat : pH, temps, demande et turbidité pèsent sur l’efficacité simulée.'
		});
	}
	if (turbidityNtu > 1) {
		list.push({
			id: 'turbidity',
			level: turbidityNtu > 5 ? 'fail' : 'watch',
			title: 'Turbidité encore gênante',
			text: 'L’eau qui entre en désinfection est trouble. Le modèle réduit alors l’effet du chlore et des UV.'
		});
	}
	if (byproduct > 40) {
		list.push({
			id: 'byproducts',
			level: byproduct > 70 ? 'fail' : 'watch',
			title: 'Indice de sous-produits',
			text: 'Conditions favorables à un risque pédagogique de sous-produits. Aucune concentration réelle n’est calculée.'
		});
	}
	if (probe === null) {
		list.push({
			id: 'probe-lost',
			level: 'fail',
			title: 'Analyseur indisponible',
			text: 'Le signal continu est perdu. S’appuyer sur le contrôle DPD simulé et alerter la surveillance, sans inventer une valeur.'
		});
	} else if (!reliable) {
		list.push({
			id: 'probe-gap',
			level: 'watch',
			title: 'Écart sonde / DPD',
			text: `L’analyseur affiche ${probe.toFixed(2)} mg/L, le DPD de référence ${balance.freeMgL.toFixed(2)} mg/L.`
		});
	}
	if ((organisms.find((item) => item.id === 'crypto')?.remaining ?? 0) > 40) {
		list.push({
			id: 'crypto',
			level: 'watch',
			title: 'Limite de la chloration',
			text: 'Cryptosporidium reste peu touché par le chlore dans les conditions usuelles de ce modèle.'
		});
	}
	return list;
}

export function readSettings(input: Partial<Settings> | null | undefined): { settings: Settings; issues: string[] } {
	const issues: string[] = [];
	const source = input ?? {};
	function num(key: keyof Settings, fallback: number, min: number, max: number): number {
		const value = source[key];
		if (value === undefined) return fallback;
		if (typeof value !== 'number' || !Number.isFinite(value)) {
			issues.push(`${key} : valeur invalide, repli pédagogique ${fallback} ${unitOf(key)}.`);
			return fallback;
		}
		if (value < min || value > max) {
			issues.push(`${key} : ${value} hors plage ${min}–${max} ${unitOf(key)}.`);
			return clamp(value, min, max);
		}
		return value;
	}
	const probeMode = source.probeMode;
	const mode: ProbeMode =
		probeMode === 'drift' || probeMode === 'inconsistent' || probeMode === 'lost' || probeMode === 'calibrated'
			? probeMode
			: 'calibrated';
	if (source.probeMode !== undefined && mode === 'calibrated' && source.probeMode !== 'calibrated') {
		issues.push('Mode de sonde inconnu : sonde considérée étalonnée.');
	}
	return {
		issues,
		settings: {
			doseMgL: num('doseMgL', DEFAULT_SETTINGS.doseMgL, 0, 8),
			ph: num('ph', DEFAULT_SETTINGS.ph, 4.5, 10.5),
			contactMin: num('contactMin', DEFAULT_SETTINGS.contactMin, 0, 120),
			temperatureC: num('temperatureC', DEFAULT_SETTINGS.temperatureC, 1, 35),
			demandMgL: num('demandMgL', DEFAULT_SETTINGS.demandMgL, 0, 6),
			combinedPotentialMgL: num('combinedPotentialMgL', DEFAULT_SETTINGS.combinedPotentialMgL, 0, 3),
			turbidityNtu: num('turbidityNtu', DEFAULT_SETTINGS.turbidityNtu, 0, 200),
			organic: num('organic', DEFAULT_SETTINGS.organic, 0, 100),
			bacteria: num('bacteria', DEFAULT_SETTINGS.bacteria, 0, 100),
			virus: num('virus', DEFAULT_SETTINGS.virus, 0, 100),
			giardia: num('giardia', DEFAULT_SETTINGS.giardia, 0, 100),
			crypto: num('crypto', DEFAULT_SETTINGS.crypto, 0, 100),
			filtrationAid: num('filtrationAid', DEFAULT_SETTINGS.filtrationAid, 0, 100),
			uvAid: Boolean(source.uvAid),
			ozoneAid: Boolean(source.ozoneAid),
			membraneAid: Boolean(source.membraneAid),
			probeMode: mode,
			probeDriftMgL: num('probeDriftMgL', 0, -2, 2),
			useDpdAsReference: Boolean(source.useDpdAsReference)
		}
	};
}

function unitOf(key: keyof Settings): string {
	if (key === 'ph') return '';
	if (key === 'contactMin') return 'min';
	if (key === 'temperatureC') return '°C';
	if (key === 'turbidityNtu') return 'NTU';
	if (key.includes('MgL')) return 'mg/L';
	return '';
}

export function evaluate(input: Partial<Settings> | Settings): Evaluation {
	const { settings, issues } = readSettings(input);
	const turbidityNtu = effectiveTurbidity(settings.turbidityNtu, settings.filtrationAid);
	const balance = chlorineBalance({ ...settings, turbidityNtu });
	const kinetic = kineticFactor(settings.temperatureC);
	const shield = turbidityShield(turbidityNtu);
	const effectiveCt = balance.freeMgL * balance.hoclFraction * settings.contactMin * kinetic * shield;
	const organisms = [
		organismResult('bacteria', settings.bacteria, settings, effectiveCt, turbidityNtu),
		organismResult('virus', settings.virus, settings, effectiveCt, turbidityNtu),
		organismResult('giardia', settings.giardia, settings, effectiveCt, turbidityNtu),
		organismResult('crypto', settings.crypto, settings, effectiveCt, turbidityNtu)
	];
	const byproduct = byproductRisk(settings, balance.freeMgL);
	const probe = probeReading(balance.freeMgL, settings.probeMode, settings.probeDriftMgL);
	const gap = probe === null ? Infinity : Math.abs(probe - balance.freeMgL);
	const probeReliable = probe !== null && (settings.probeMode === 'calibrated' || gap <= 0.12 || settings.useDpdAsReference);
	const bacteria = organisms[0];
	const exerciseOk =
		issues.length === 0 &&
		bacteria.remaining <= 8 &&
		balance.freeMgL >= 0.1 &&
		balance.freeMgL <= 0.8 &&
		settings.ph >= 6.5 &&
		settings.ph <= 9 &&
		turbidityNtu <= 1 &&
		probeReliable &&
		byproduct <= 40;
	return {
		settings,
		issues,
		balance,
		effectiveTurbidityNtu: turbidityNtu,
		kineticFactor: kinetic,
		turbidityFactor: shield,
		effectiveCt,
		organisms,
		byproductRisk: byproduct,
		probeMgL: probe,
		dpdMgL: balance.freeMgL,
		probeReliable,
		exerciseOk,
		alerts: alerts(settings, balance, turbidityNtu, organisms, byproduct, probe, probeReliable),
		explanations: explanations(settings, balance, turbidityNtu, organisms, byproduct)
	};
}

export function residualCurve(input: Settings, steps = 7): { minute: number; freeMgL: number; injectedMgL: number }[] {
	const count = clamp(Math.round(steps), 2, 13);
	return Array.from({ length: count }, (_, index) => {
		const minute = (index / (count - 1)) * 60;
		const balance = chlorineBalance({ ...input, contactMin: minute });
		return { minute, freeMgL: balance.freeMgL, injectedMgL: balance.injectedMgL };
	});
}

export function numbersAreFinite(evaluation: Evaluation): boolean {
	const values = [
		evaluation.balance.injectedMgL,
		evaluation.balance.consumedMgL,
		evaluation.balance.combinedMgL,
		evaluation.balance.freeMgL,
		evaluation.balance.totalMgL,
		evaluation.balance.hoclFraction,
		evaluation.balance.oclFraction,
		evaluation.effectiveCt,
		evaluation.byproductRisk,
		evaluation.dpdMgL,
		...evaluation.organisms.flatMap((item) => [item.remaining, item.log10Reduction])
	];
	return values.every((value) => Number.isFinite(value));
}
