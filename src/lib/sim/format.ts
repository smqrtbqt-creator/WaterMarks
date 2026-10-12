export function n(value: number, digits = 0): string {
	return value.toLocaleString('fr-FR', {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
}

export function formatClock(hours: number): string {
	const totalMin = Math.max(0, Math.floor(hours * 60));
	const h = Math.floor(totalMin / 60);
	const m = totalMin % 60;
	return `${h} h ${m.toString().padStart(2, '0')}`;
}
