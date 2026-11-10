/** Rendement fixé pour l’activité. Ce n’est pas une courbe de constructeur. */
export const PUMP_ETA = 0.72;
export const PUMP_Q_MAX = 90;
export const RESERVOIR_M3 = 400;

const RHO = 1000;
const G = 9.81;

export function pumpFlowM3h(speedPct: number): number {
	const speed = Math.min(100, Math.max(0, speedPct)) / 100;
	return speed * PUMP_Q_MAX;
}

/** H = hauteur statique + pertes qui croissent avec le carré du débit. */
export function headM(staticHead: number, flowM3h: number): number {
	const q = Math.max(0, flowM3h) / 3600;
	return staticHead + 18000 * q * q;
}

export function powerKw(flowM3h: number, head: number): number {
	const q = Math.max(0, flowM3h) / 3600;
	if (q <= 0 || head <= 0) return 0;
	return (RHO * G * q * head) / PUMP_ETA / 1000;
}

export function levelAfter(levelPct: number, flowM3h: number, demandM3h: number, hours: number): number {
	const net = flowM3h - demandM3h;
	const next = levelPct + (net / RESERVOIR_M3) * 100 * hours;
	return Math.min(100, Math.max(0, next));
}
