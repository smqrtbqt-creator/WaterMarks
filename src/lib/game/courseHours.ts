/** Pendant les cours, de 8 h à 17 h heure de Paris, les modules sont fermés. */

export const COURSE_WORK_START_HOUR = 8;
export const COURSE_WORK_END_HOUR = 17;

export type CourseSnapshot = {
	open: boolean;
	remainingSeconds: number;
};

export function courseState(now = new Date()): CourseSnapshot {
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Europe/Paris',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23'
	}).formatToParts(now);
	const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
	let hour = read('hour');
	if (hour === 24) hour = 0;
	const nowSeconds = hour * 3600 + read('minute') * 60 + read('second');
	const workStart = COURSE_WORK_START_HOUR * 3600;
	const workEnd = COURSE_WORK_END_HOUR * 3600;
	if (nowSeconds >= workStart && nowSeconds < workEnd) {
		return { open: false, remainingSeconds: workEnd - nowSeconds };
	}
	if (nowSeconds < workStart) {
		return { open: true, remainingSeconds: workStart - nowSeconds };
	}
	return { open: true, remainingSeconds: 24 * 3600 - nowSeconds + workStart };
}

export function formatCourseRemaining(totalSeconds: number): string {
	const total = Math.max(0, totalSeconds);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	const clock = `${String(minutes).padStart(2, '0')} min ${String(seconds).padStart(2, '0')} s`;
	return hours > 0 ? `${hours} h ${clock}` : clock;
}
