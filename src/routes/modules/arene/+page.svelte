<script lang="ts">
	import { base } from '$app/paths';
	import HeroChip from '$lib/components/HeroChip.svelte';
	import RoleAlert from '$lib/components/RoleAlert.svelte';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import {
		BARE_DAMAGE,
		BASE_HP,
		DEBOUNCE_MS,
		ENIGMAS,
		HERO_NAME,
		HIT_LINE,
		MONSTERS,
		canBeat,
		canFace,
		drainPerSec,
		hpOf,
		hpRequired,
		levelOf,
		strike,
		type Monster
	} from '$lib/game/flaque';
	import { flaque } from '$lib/game/flaque.svelte';
	import { n } from '$lib/sim/format';

	type Trace = { id: number; side: 'hero' | 'foe'; kind: 'red' | 'green' | 'drop' | 'nick'; x: number; y: number };

	let monsterId = $state(MONSTERS[0].id);
	let heroHp = $state(0);
	let foeHp = $state(0);
	let fighting = $state(false);
	let power = $state(0);
	let lastClick = 0;
	let bob = $state(0);
	let traceSeq = 0;
	let traces = $state<Trace[]>([]);
	let log = $state('Choisis un monstre. Gagner un combat ne donne ni niveau ni objet.');
	let outcome = $state<'idle' | 'fight' | 'win' | 'lose'>('idle');

	const monster = $derived(MONSTERS.find((item) => item.id === monsterId) ?? MONSTERS[0]);
	const solved = $derived(flaque.save.solved.length);
	const alertLine = $derived(
		outcome === 'fight'
			? `Le têtard martèle ${monster.name}. Jauge ${n(power, 0)}. ${n(heroHp, 1)} PV contre ${n(foeHp, 1)}. Plus c’est serré, plus le coup pèse. Il ne perd des points que pendant un clic.`
			: outcome === 'win'
				? `${monster.name} a éclaté. Le têtard est toujours niveau ${levelOf(flaque.save)}. L’arène ne récompense pas.`
				: outcome === 'lose'
					? `Le têtard est dissous. Son niveau n’a pas bougé. Les objets forts sont dans les énigmes, pas ici.`
					: !canFace(flaque.save, monster)
						? `${monster.name} reste à l'écart. Il faut ${hpRequired(monster)} PV, le têtard en a ${hpOf(flaque.save)}. Ces points viennent des modules. Sans eux, il reste à ${BASE_HP} et n'affronte personne.`
						: monster.id === 'kraken' && solved < ENIGMAS.length
						? `Le kraken du réservoir est le dernier. ${solved} énigme${solved === 1 ? '' : 's'} sur ${ENIGMAS.length}. Sans les cinq, il dissout le têtard.`
						: solved === 0
							? `${monster.name} attend. Sans module, la jauge s’arrête sous le trait.`
							: `${monster.name} attend. ${monster.blurb} ${canBeat(flaque.save, monster) ? 'En tapant vite, le têtard peut tenir.' : 'Même à toute vitesse, le têtard fond avant la fin.'}`
	);

	$effect(() => {
		if (!fighting) return;
		const rate = drainPerSec(flaque.save.solved.length);
		let prev = performance.now();
		let frame = 0;
		const loop = (now: number) => {
			const dt = Math.min(80, now - prev);
			prev = now;
			power = Math.max(0, power - rate * (dt / 1000));
			frame = requestAnimationFrame(loop);
		};
		frame = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(frame);
	});

	$effect(() => {
		if (!fighting) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.code !== 'Space' && event.code !== 'Enter') return;
			event.preventDefault();
			hit();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	$effect(() => {
		if (!fighting) return;
		if (foeHp <= 0) {
			fighting = false;
			outcome = 'win';
			log =
				monster.id === 'kraken'
					? 'Le rythme serré a porté. Le kraken du réservoir éclate. Les cinq modules étaient nécessaires. Aucun niveau de plus.'
					: `Le rythme serré a porté. ${monster.name} éclate en flaque. Aucun objet. Aucun niveau.`;
		} else if (heroHp <= 0) {
			fighting = false;
			outcome = 'lose';
			log = `Le rythme n’a pas suffi. ${monster.name} dissout le têtard. Son niveau n’a pas bougé.`;
		}
	});

	function mark(side: 'hero' | 'foe', kind: Trace['kind']) {
		const id = traceSeq + 1;
		traceSeq = id;
		const next = { id, side, kind, x: 12 + Math.random() * 64, y: 4 + Math.random() * 48 };
		traces = [...traces, next].slice(-24);
		window.setTimeout(() => {
			traces = traces.filter((trace) => trace.id !== id);
		}, 700);
	}

	function begin(next: Monster) {
		monsterId = next.id;
		if (!canFace(flaque.save, next)) {
			fighting = false;
			outcome = 'idle';
			power = 0;
			log = `${next.name} demande ${hpRequired(next)} PV. Les modules donnent ces points. Sans eux, le têtard reste à ${BASE_HP}.`;
			return;
		}
		heroHp = hpOf(flaque.save);
		foeHp = next.hp;
		fighting = true;
		outcome = 'fight';
		power = 0;
		lastClick = 0;
		bob = 0;
		traces = [];
		log = 'Martèle pour remplir la jauge. Au-dessus du trait, le coup part.';
	}

	function hit() {
		if (!fighting || foeHp <= 0 || heroHp <= 0) return;
		const now = performance.now();
		const gap = lastClick === 0 ? 0 : now - lastClick;
		if (gap !== 0 && gap < DEBOUNCE_MS) return;
		lastClick = now;
		bob += 1;
		const blow = strike(flaque.save, monster, gap, power, true);
		power = blow.power;
		mark('hero', 'drop');
		if (blow.green > 0) {
			foeHp = Math.max(0, foeHp - blow.green);
			mark('foe', blow.green < 1 ? 'nick' : 'green');
		}
		if (blow.red > 0) {
			heroHp = Math.max(0, heroHp - blow.red);
			mark('hero', 'red');
		}
		if (!blow.landed) {
			log =
				solved === 0
					? 'Mains nues. Le coup effleure : très peu de dégâts.'
					: 'Sous le trait. Martèle plus vite : la jauge retombe dès que tu lâches.';
		} else if (blow.red > 0) {
			log = 'Au-dessus du trait. Plus le clic est serré, plus le vert pèse. Le rouge est sur le têtard.';
		} else {
			log = 'La jauge grimpe. Le têtard n’encaisse rien tant que le clic suivant n’est pas là.';
		}
	}
</script>

<svelte:head>
	<title>Arène de la flaque</title>
</svelte:head>

<div class="app modules">
	<header class="top">
		<div class="brand">
			<p class="mark">Jeu · sans récompense de combat</p>
			<h1>Arène de la flaque</h1>
			<ProjectSwitch current="modules" />
			<HeroChip />
		</div>
	</header>

	<RoleAlert speaker="Sifflard" role="Arbitre de la flaque" line={alertLine} />

	<div class="module-layout">
		<div class="arena">
			<div class="arena-fighters">
				<button type="button" class="arena-hero" disabled={!fighting} onclick={hit}>
					<span
						class="arena-blob hero-blob"
						style:transform="translateY({bob % 2 ? -8 : 0}px) scale({bob % 2 ? '1.1, 0.82' : '1'})"
					></span>
					{#each traces.filter((trace) => trace.side === 'hero') as trace (trace.id)}
						<i class="arena-mark {trace.kind}" style:left="{trace.x}%" style:top="{trace.y}%" aria-hidden="true"></i>
					{/each}
					{HERO_NAME}
					<strong>{n(outcome === 'idle' ? hpOf(flaque.save) : heroHp, 1)} PV</strong>
				</button>
				<div class="arena-foe">
					<span class="arena-blob" style:transform="scale({0.72 + MONSTERS.indexOf(monster) * 0.12})"></span>
					{#each traces.filter((trace) => trace.side === 'foe') as trace (trace.id)}
						<i class="arena-mark {trace.kind}" style:left="{trace.x}%" style:top="{trace.y}%" aria-hidden="true"></i>
					{/each}
					{monster.name}
					<strong>{n(outcome === 'idle' ? monster.hp : foeHp, 1)} PV</strong>
				</div>
			</div>
			<div class="track" aria-hidden="true">
				<div class="track-fill" class:hot={power >= HIT_LINE} style:width="{power}%"></div>
				<i class="track-line" style:left="{HIT_LINE}%"></i>
			</div>
			<p class="track-caption">Cadence {n(fighting ? power : 0, 0)} / 100. Le trait est à {HIT_LINE}. Espace ou le bouton.</p>
			<button type="button" class="primary track-mash" disabled={!fighting} onclick={hit}>Martèle</button>
			<p>{log}</p>
			<p class="disclaimer">
				{#if !canFace(flaque.save, monster)}
					Pour l'engager, il faut {hpRequired(monster)} PV. Le têtard en a {hpOf(flaque.save)}. Sans module, il reste à {BASE_HP} et ne prend aucun adversaire.
				{:else if monster.id === 'kraken' && solved < ENIGMAS.length}
					Le kraken est le dernier ennemi. Les cinq modules sont nécessaires. Quatre ne suffisent pas.
				{:else if !canBeat(flaque.save, monster)}
					Même en tapant au plus vite, ce monstre dissout le têtard. Il faut d’autres énigmes.
				{:else}
					Avec {solved} module{solved > 1 ? 's' : ''}, la jauge retombe moins vite. Taper vite augmente les dégâts. Le combat ne fait pas monter le têtard.
				{/if}
			</p>
		</div>

		<div class="module-panel">
			<h2>Monstres</h2>
			<div class="weather">
				{#each MONSTERS as foe (foe.id)}
					<button
						type="button"
						class="ghost"
						aria-pressed={foe.id === monster.id}
						disabled={!canFace(flaque.save, foe)}
						title={canFace(flaque.save, foe) ? foe.name : `${hpRequired(foe)} PV requis`}
						onclick={() => begin(foe)}
					>
						{foe.name}
					</button>
				{/each}
			</div>
			<p>
				{monster.blurb} {monster.atk} dégâts par seconde d’attente, encaissés au clic suivant. {monster.hp} PV.
				Pour l'engager : {hpRequired(monster)} PV. Le têtard en a {hpOf(flaque.save)}.
			</p>
			<h2>Objets</h2>
			<ul class="sample-log">
				{#each ENIGMAS as enigma (enigma.id)}
					<li>
						{flaque.save.solved.includes(enigma.id) ? enigma.itemName : 'Pas encore'}
						· {enigma.title}
						· +{enigma.bonus}
					</li>
				{/each}
			</ul>
			<p>
				Sans module : {n(BARE_DAMAGE, 1)} dégât, un peu plus si le clic est serré. Une énigme validée reste enregistrée sur cet appareil et débloque les PV, le coup, et l’adversaire suivant.
			</p>
			<p><a href="{base}/modules">Retour aux modules</a></p>
		</div>
	</div>

	{#if outcome === 'win' || outcome === 'lose'}
		<div class="cinematic" role="dialog" aria-modal="true" aria-labelledby="fight-result">
			<div class="cinematic-card result-card">
				<p class="mark">Arène</p>
				<h2 id="fight-result">{outcome === 'win' ? 'Victoire' : 'Échec'}</h2>
				<p>{log}</p>
				<p>
					{solved} énigme{solved === 1 ? '' : 's'} sur {ENIGMAS.length} restent acquises.
					Le têtard a {hpOf(flaque.save)} PV. Le combat n’en ajoute pas.
				</p>
				<button type="button" class="primary" onclick={() => (outcome = 'idle')}>Continuer</button>
			</div>
		</div>
	{/if}
</div>
