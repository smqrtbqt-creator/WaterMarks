<script lang="ts">
	import { base } from '$app/paths';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import Slider from '$lib/components/Slider.svelte';
	import { n } from '$lib/sim/format';
	import { PUMP_ETA, RESERVOIR_M3, headM, levelAfter, powerKw, pumpFlowM3h } from '$lib/modules/pump';

	let speedA = $state(70);
	let speedB = $state(0);
	let demand = $state(60);
	let staticHead = $state(18);
	let level = $state(62);
	let running = $state(true);

	const flow = $derived(pumpFlowM3h(speedA) + pumpFlowM3h(speedB));
	const usefulFlow = $derived(level <= 0 ? 0 : flow);
	const head = $derived(headM(staticHead, usefulFlow));
	const power = $derived(powerKw(usefulFlow, head));
	const waterY = $derived(250 - (level / 100) * 150);

	$effect(() => {
		if (!running) return;
		const id = window.setInterval(() => {
			level = levelAfter(level, usefulFlow, demand, 2 / 60);
		}, 400);
		return () => window.clearInterval(id);
	});
</script>

<svelte:head>
	<title>Station de pompage</title>
</svelte:head>

<div class="app modules">
	<header class="top">
		<div class="brand">
			<p class="mark">Module · sans quiz</p>
			<h1>Station de pompage</h1>
			<ProjectSwitch current="modules" />
		</div>
	</header>

	<div class="module-layout">
		<svg class="pump-svg" viewBox="0 0 760 320" role="img" aria-label="Deux pompes alimentent un réservoir">
			<rect width="760" height="320" fill="#07161c" rx="16" />
			<text x="28" y="36" fill="#93aeb0" font-size="13">Bâche</text>
			<rect x="24" y="70" width="90" height="160" rx="12" fill="#12303a" stroke="rgba(196,224,220,0.3)" />
			<rect x="36" y="150" width="66" height="68" rx="8" fill="#1d6d8a" />
			<path d="M114 150 H190" stroke="#8ec8e6" stroke-width="10" stroke-linecap="round" />
			<g>
				<rect x="190" y="108" width="110" height="84" rx="16" fill="#0d2129" stroke={speedA > 0 ? '#dff56a' : 'rgba(196,224,220,0.3)'} />
				<circle cx="245" cy="150" r="22" fill="none" stroke="#dff56a" stroke-width="3" />
				<text x="245" y="155" text-anchor="middle" fill="#e8f3f1" font-size="12">A</text>
				<text x="245" y="214" text-anchor="middle" fill="#93aeb0" font-size="12">{n(pumpFlowM3h(speedA), 0)} m³/h</text>
			</g>
			<g>
				<rect x="330" y="108" width="110" height="84" rx="16" fill="#0d2129" stroke={speedB > 0 ? '#dff56a' : 'rgba(196,224,220,0.3)'} />
				<circle cx="385" cy="150" r="22" fill="none" stroke="#dff56a" stroke-width="3" />
				<text x="385" y="155" text-anchor="middle" fill="#e8f3f1" font-size="12">B</text>
				<text x="385" y="214" text-anchor="middle" fill="#93aeb0" font-size="12">{n(pumpFlowM3h(speedB), 0)} m³/h</text>
			</g>
			<path d="M300 150 H330" stroke="#8ec8e6" stroke-width="10" stroke-linecap="round" />
			<path d="M440 150 H520" stroke="#8ec8e6" stroke-width="10" stroke-linecap="round" />
			<rect x="540" y="48" width="180" height="220" rx="16" fill="#0d2129" stroke="rgba(196,224,220,0.35)" />
			<rect x="558" y={waterY} width="144" height={298 - waterY} fill="#1d6d8a" />
			<text x="630" y="40" text-anchor="middle" fill="#93aeb0" font-size="13">Réservoir</text>
			<text x="630" y="290" text-anchor="middle" fill="#e8f3f1" font-size="16">{n(level, 0)} %</text>
		</svg>

		<div class="module-panel">
			<Slider label="Vitesse pompe A" bind:value={speedA} min={0} max={100} step={5} unit="%" />
			<Slider label="Vitesse pompe B" bind:value={speedB} min={0} max={100} step={5} unit="%" />
			<Slider label="Demande du réseau" bind:value={demand} min={0} max={180} step={5} unit="m³/h" />
			<Slider label="Hauteur statique" bind:value={staticHead} min={8} max={40} step={1} unit="m" />
			<div class="speeds">
				<button type="button" class="ghost" aria-pressed={running} onclick={() => (running = !running)}>
					{running ? 'Pause' : 'Lecture'}
				</button>
				<button type="button" class="ghost" onclick={() => (level = 62)}>Niveau de départ</button>
			</div>
			<dl class="readout">
				<div><dt>Débit refoulé</dt><dd>{n(usefulFlow, 0)} m³/h</dd></div>
				<div><dt>Hauteur manométrique</dt><dd>{n(head, 1)} m</dd></div>
				<div><dt>Puissance utile</dt><dd>{n(power, 1)} kW</dd></div>
				<div><dt>Dans une heure</dt><dd>{n(levelAfter(level, usefulFlow, demand, 1), 0)} %</dd></div>
			</dl>
			<p>
				{#if level <= 0}
					Le réservoir est vide : les pompes n’aspirent plus.
				{:else if level >= 98}
					Le réservoir est plein. Le débit dépasse la demande.
				{:else if usefulFlow + 2 < demand}
					La demande dépasse le débit. Le niveau baisse.
				{:else if usefulFlow > demand + 2}
					Le débit dépasse la demande. Le niveau monte.
				{:else}
					Débit et demande se tiennent. Le niveau bouge peu.
				{/if}
			</p>
			<p class="disclaimer">
				Réservoir de {RESERVOIR_M3} m³ et rendement {n(PUMP_ETA * 100, 0)} % fixés pour l’activité.
				La puissance est ρgQH/η. Ce n’est pas une courbe de pompe réelle.
			</p>
			<p><a href="{base}/modules">Retour aux modules</a></p>
		</div>
	</div>
</div>
