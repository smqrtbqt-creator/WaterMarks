import { browser } from '$app/environment';
import { emptySave, sanitizeSave, solve as applySolve, type EnigmaId, type Save } from './flaque';

const KEY = 'watermarks-flaque-v1';

class Flaque {
	save = $state<Save>(emptySave());
	loaded = $state(false);

	constructor() {
		if (browser) this.load();
	}

	load() {
		try {
			const raw = localStorage.getItem(KEY);
			if (raw) this.save = sanitizeSave(JSON.parse(raw));
		} catch {
			this.save = emptySave();
		}
		this.loaded = true;
	}

	persist() {
		if (!browser) return;
		localStorage.setItem(KEY, JSON.stringify(this.save));
	}

	solve(id: EnigmaId): boolean {
		const next = applySolve(this.save, id);
		if (!next.fresh) return false;
		this.save = next.save;
		this.persist();
		return true;
	}

	seeIntro() {
		if (this.save.seenIntro) return;
		this.save = { ...this.save, seenIntro: true };
		this.persist();
	}
}

export const flaque = new Flaque();
