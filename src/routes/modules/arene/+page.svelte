<script lang="ts">
	import { base } from '$app/paths';
	import HeroChip from '$lib/components/HeroChip.svelte';
	import RoleAlert from '$lib/components/RoleAlert.svelte';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import {
		DEBOUNCE_MS,
		ENIGMAS,
		HIT_LINE,
		MONSTERS,
		canBeat,
		drainPerSec,
		hpOf,
		levelOf,
		strike,
		type Monster
	} from '$lib/game/flaque';
	import { flaque } from '$lib/game/flaque.svelte';
	import { n } from '$lib/sim/format';

	type Trace = { id: number; side: 'hero' | 'foe'; kind: 'red' | 'green' | 'drop'; x: number; y: number };

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
			? `Goutte martèle ${monster.name}. Jauge ${n(power, 0)}. ${n(heroHp, 1)} PV contre ${n(foeHp, 1)}. Elle ne perd des points que pendant un clic.`
			: outcome === 'win'
				? `${monster.name} a éclaté. Goutte est toujours niveau ${levelOf(flaque.save)}. L’arène ne récompense pas.`
				: outcome === 'lose'
					? `Goutte est dissoute. Son niveau n’a pas bougé. Les objets forts sont dans les énigmes, pas ici.`
					: solved === 0
						? `${monster.name} attend. Sans module, la jauge s’arrête sous le trait. Le coup ne peut pas partir.`
						: `${monster.name} attend. ${monster.blurb} Tiens la jauge au-dessus du trait. ${canBeat(flaque.save, monster) ? 'En martelant, Goutte peut tenir.' : 'Même à toute vitesse, Goutte fond avant la fin.'}`
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
		if (heroHp <= 0) {
			fighting = false;
			outcome = 'lose';
			log = `${monster.name} dissout Goutte. Son niveau n’a pas bougé.`;
		} else if (foeHp <= 0) {
			fighting = false;
			outcome = 'win';
			log = `${monster.name} éclate en flaque. Aucun objet. Aucun niveau.`;
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
		heroHp = hpOf(flaque.save);
		foeHp = next.hp;
		fighting = true;
		outcome = 'fight';
		power = 0;
		lastClick = 0;
		bob = 0;
		traces = [];
		log =
			flaque.save.solved.length === 0
				? 'Martèle. Sans module, la jauge ne peut pas passer le trait.'
				: 'Martèle pour remplir la jauge. Au-dessus du trait, le coup part.';
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
			mark('foe', 'green');
		}
		if (blow.red > 0) {
			heroHp = Math.max(0, heroHp - blow.red);
			mark('hero', 'red');
		}
		if (!blow.landed) {
			log =
				solved === 0
					? 'La jauge monte, puis s’arrête sous le trait. Le coup ne part pas.'
					: 'Sous le trait. Martèle plus vite : la jauge retombe dès que tu lâches.';
		} else if (blow.red > 0) {
			log = 'Au-dessus du trait. Vert sur le monstre, rouge sur Goutte.';
		} else {
			log = 'La jauge grimpe. Goutte n’encaisse rien tant que le clic suivant n’est pas là.';
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
					Goutte
					<strong>{n(outcome === 'idle' ? hpOf(flaque.save) : heroHp, 1)} PV</strong>
				</button>
				<div class="arena-foe">
					<span class="arena-blob" style:transform="scale({0.7 + monster.hp / 280})"></span>
					{#each traces.filter((trace) => trace.side === 'foe') as trace (trace.id)}
						<i class="arena-mark green" style:left="{trace.x}%" style:top="{trace.y}%" aria-hidden="true"></i>
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
				{#if solved === 0}
					Aucun module résolu : la jauge plafonne sous le trait. Gagner est impossible.
				{:else if !canBeat(flaque.save, monster)}
					Même en martelant sans reprendre souffle, ce monstre dissout Goutte. Il faut d’autres énigmes.
				{:else}
					Avec {solved} module{solved > 1 ? 's' : ''}, la jauge retombe moins vite. Le combat ne fait pas monter Goutte.
				{/if}
			</p>
		</div>

		<div class="module-panel">
			<h2>Monstres</h2>
			<div class="weather">
				{#each MONSTERS as foe (foe.id)}
					<button type="button" class="ghost" aria-pressed={foe.id === monster.id} onclick={() => begin(foe)}>
						{foe.name}
					</button>
				{/each}
			</div>
			<p>
				{monster.blurb} {monster.atk} dégâts par seconde d’attente, encaissés au clic suivant. {monster.hp} PV.
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
				Mains nues : 1 dégât. Martèle pour tenir la jauge au-dessus du trait. Moins il y a de modules, plus elle retombe vite.
			</p>
			<p><a href="{base}/modules">Retour aux modules</a></p>
		</div>
	</div>
</div>
