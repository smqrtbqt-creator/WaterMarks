import { courseState } from './courseHours';

let now = $state(Date.now());
let started = false;

export function courseSnapshot() {
	return courseState(new Date(now));
}

export function ensureCourseClock() {
	if (started || typeof window === 'undefined') return;
	started = true;
	setInterval(() => {
		now = Date.now();
	}, 1000);
}
