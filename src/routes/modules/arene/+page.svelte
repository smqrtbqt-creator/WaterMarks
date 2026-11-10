<script lang="ts">
	import { base } from '$app/paths';
	import HeroChip from '$lib/components/HeroChip.svelte';
	import RoleAlert from '$lib/components/RoleAlert.svelte';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import { ENIGMAS, MONSTERS, canBeat, damageOf, hpOf, levelOf, type Monster } from '$lib/game/flaque';
	import { flaque } from '$lib/game/flaque.svelte';

	let monsterId = $state(MONSTERS[0].id);
	let heroHp = $state(0);
	let foeHp = $state(0);
	let fighting = $state(false);
	let cooling = $state(false);
	let log = $state('Choisis un monstre. Gagner un combat ne donne ni niveau ni objet.');
	let outcome = $state<'idle' | 'fight' | 'win' | 'lose'>('idle');

	const monster = $derived(MONSTERS.find((item) => item.id === monsterId) ?? MONSTERS[0]);
	const alertLine = $derived(
		outcome === 'fight'
			? `Goutte tape ${monster.name}. ${heroHp} PV contre ${foeHp}. Les coups ne donnent ni niveau ni objet.`
			: outcome === 'win'
				? `${monster.name} a éclaté. Goutte est toujours niveau ${levelOf(flaque.save)}. L’arène ne récompense pas.`
				: outcome === 'lose'
					? `Goutte est dissoute. Son niveau n’a pas bougé. Les objets forts sont dans les énigmes, pas ici.`
					: `${monster.name} attend. ${monster.blurb} ${canBeat(flaque.save, monster) ? 'Goutte peut tenir.' : 'Sans objet d’énigme, Goutte fond avant la fin.'}`
	);

	$effect(() => {
		if (!fighting) return;
		const atk = monster.atk / 2;
		const id = window.setInterval(() => {
			heroHp = Math.max(0, heroHp - atk);
		}, 500);
		return () => window.clearInterval(id);
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

	function begin(next: Monster) {
		monsterId = next.id;
		heroHp = hpOf(flaque.save);
		foeHp = next.hp;
		fighting = true;
		outcome = 'fight';
		cooling = false;
		log = 'Les coups partent. Les énigmes, elles, sont ailleurs.';
	}

	function hit() {
		if (!fighting || cooling || foeHp <= 0) return;
		cooling = true;
		foeHp = Math.max(0, foeHp - damageOf(flaque.save));
		window.setTimeout(() => (cooling = false), 500);
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
				<button type="button" class="arena-hero" disabled={!fighting || cooling} onclick={hit}>
					<span class="arena-blob hero-blob"></span>
					Goutte
					<strong>{fighting ? heroHp : hpOf(flaque.save)} PV</strong>
				</button>
				<div class="arena-foe">
					<span class="arena-blob" style:transform="scale({0.7 + monster.hp / 280})"></span>
					{monster.name}
					<strong>{fighting ? foeHp : monster.hp} PV</strong>
				</div>
			</div>
			<p>{log}</p>
			<p class="disclaimer">
				{#if !canBeat(flaque.save, monster)}
					Ce monstre dissout Goutte avant la fin. Il faut un objet d’énigme, pas plus de clics.
				{:else if levelOf(flaque.save) === 1}
					Celui-là se tape à mains nues. Ça ne fait pas monter Goutte.
				{:else}
					Avec les objets des énigmes, Goutte peut tenir ce combat. Le combat ne la fera pas monter.
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
			<p>{monster.blurb} {monster.atk} dégâts par seconde, {monster.hp} PV.</p>
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
			<p>Mains nues : 1 dégât. Le rythme de l’arène est de deux coups par seconde.</p>
			<p><a href="{base}/modules">Retour aux modules</a></p>
		</div>
	</div>
</div>
