export type Sense = 'direct' | 'inverse' | 'equilibre';

export type GibbsReading = {
	qr: number;
	k: number;
	ratio: number;
	deltaGkj: number;
	sense: Sense;
};

const R = 8.314;

/** ΔrG = RT ln(Q/K), en kJ/mol. */
export function gibbsReading(qr: number, k: number, tempC: number): GibbsReading {
	const safeQ = Math.max(qr, 1e-30);
	const safeK = Math.max(k, 1e-30);
	const ratio = safeQ / safeK;
	const deltaGkj = (R * (tempC + 273.15) * Math.log(ratio)) / 1000;
	const sense: Sense = Math.abs(Math.log10(ratio)) < 0.05 ? 'equilibre' : ratio < 1 ? 'direct' : 'inverse';
	return { qr: safeQ, k: safeK, ratio, deltaGkj, sense };
}

/**
 * 5 CH2O + 4 NO3− → 2 N2 + 4 HCO3− + CO2 + 3 H2O
 * CH2O et H2O pris d’activité 1. Concentrations en mol/L, gaz en bar, référence 1.
 */
export function qrDenitrification(no3: number, n2Bar: number, hco3: number, co2Bar: number): number {
	return (n2Bar ** 2 * hco3 ** 4 * co2Bar) / no3 ** 4;
}

/** CaCO3(s) ⇌ Ca2+ + CO3^2−. Ordre de grandeur de la calcite à 25 °C, hors force ionique. */
export const CALCITE_KS = 3.3e-9;

export function qrCalcite(caMol: number, co3Mol: number): number {
	return caMol * co3Mol;
}

/**
 * 4 Fe2+ + O2 + 4 H+ → 4 Fe3+ + 2 H2O
 * K placé pour que les curseurs fassent passer Q de part et d’autre.
 * Ce n’est pas la constante des potentiels standard, ni celle d’une eau réelle.
 */
export const IRON_K = 1e26;

export function qrIron(fe2: number, fe3: number, o2Bar: number, ph: number): number {
	const h = 10 ** -ph;
	return fe3 ** 4 / (fe2 ** 4 * o2Bar * h ** 4);
}
