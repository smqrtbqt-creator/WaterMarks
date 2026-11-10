<script lang="ts">
	import { base } from '$app/paths';
	import Cinematic from '$lib/components/Cinematic.svelte';
	import HeroChip from '$lib/components/HeroChip.svelte';
	import RoleAlert from '$lib/components/RoleAlert.svelte';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import Slider from '$lib/components/Slider.svelte';
	import { ENIGMAS } from '$lib/game/flaque';
	import { flaque } from '$lib/game/flaque.svelte';
	import { n } from '$lib/sim/format';
	import { PUMP_ETA, RESERVOIR_M3, headM, levelAfter, powerKw, pumpFlowM3h } from '$lib/modules/pump';

	let speedA = $state(0);
	let speedB = $state(0);
	let demand = $state(30);
	let staticHead = $state(18);
	let level = $state(18);
	let running = $state(false);
	let intro = $state(true);
	let dipped = $state(true);

	const flow = $derived(pumpFlowM3h(speedA) + pumpFlowM3h(speedB));
	const usefulFlow = $derived(level <= 0 ? 0 : flow);
	const head = $derived(headM(staticHead, usefulFlow));
	const losses = $derived(Math.max(0, head - staticHead));
	const power = $derived(powerKw(usefulFlow, head));
	const waterY = $derived(250 - (level / 100) * 150);
	const alertLine = $derived.by(() => {
		if (level <= 0) return 'La bâche est à sec. Les pompes n’aspirent plus. Relance l’alerte, puis ouvre un débit plus fort que la demande.';
		if (level < 20) return `Le niveau est à ${n(level, 0)} %. C’est anormalement bas. La hauteur statique, elle, est autre chose : ${n(staticHead, 0)} m de dénivelée, à débit nul.`;
		if (usefulFlow + 2 < demand) return `Le réseau demande ${n(demand, 0)} m³/h et le refoulement n’est qu’à ${n(usefulFlow, 0)}. Le réservoir baisse.`;
		if (level >= 98) return 'Le réservoir est plein. Tu refoules plus que le réseau ne prend.';
		if (staticHead >= 35 && usefulFlow > demand + 2) return `Hstat est à ${n(staticHead, 0)} m et l’eau monte encore. Les pertes ajoutent ${n(losses, 1)} m. La hauteur manométrique vaut ${n(head, 1)} m.`;
		if (usefulFlow > demand + 2) return `Ça remonte : ${n(usefulFlow, 0)} contre ${n(demand, 0)} m³/h. La bâche se calme vers 70 %.`;
		return `Débit et demande se tiennent. Hstat ${n(staticHead, 0)} m, pertes ${n(losses, 1)} m.`;
	});
	const bache = ENIGMAS.find((enigma) => enigma.id === 'bache');
	const hstat = ENIGMAS.find((enigma) => enigma.id === 'hstat');

	$effect(() => {
		if (flaque.loaded && flaque.save.seenIntro) intro = false;
	});

	$effect(() => {
		if (intro || !running) return;
		const id = window.setInterval(() => {
			level = levelAfter(level, usefulFlow, demand, 4 / 60);
		}, 400);
		return () => window.clearInterval(id);
	});

	$effect(() => {
		if (level < 20) dipped = true;
		if (dipped && level >= 70 && usefulFlow > demand + 2) flaque.solve('bache');
		if (staticHead >= 35 && usefulFlow > demand + 2 && level > 15) flaque.solve('hstat');
	});

	function closeIntro() {
		flaque.seeIntro();
		intro = false;
		running = true;
	}
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
			<HeroChip />
		</div>
	</header>

	{#if intro}
		<Cinematic
			speaker="Marceline Poche"
			role="Gardienne de la bâche"
			line="C’est critique. Le niveau d’eau est anormalement bas : si la bâche se vide, les pompes perdent l’aspiration. Et ne confonds pas ce niveau avec la hauteur statique. La hauteur statique, c’est la dénivelée entre le plan d’eau aspiré et le plan d’eau refoulé, quand le débit est nul. Les pertes de charge n’existent que lorsque l’eau circule."
			action="Je remonte la bâche"
			onclose={closeIntro}
		/>
	{/if}

	<RoleAlert speaker="Marceline Poche" role="Gardienne de la bâche" line={alertLine} />

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
			<figure class="static-head">
				<svg viewBox="0 0 280 130" role="img" aria-label="La hauteur statique est la dénivelée entre l’aspiration et le refoulement, à débit nul.">
					<rect x="16" y="18" width="70" height="96" rx="8" fill="#12303a" />
					<rect x="24" y="70" width="54" height="36" fill="#1d6d8a" />
					<text x="51" y="14" text-anchor="middle" fill="#93aeb0" font-size="11">Aspiration</text>
					<rect x="194" y="18" width="70" height="96" rx="8" fill="#12303a" />
					<rect x="202" y={70 - staticHead * 1.1} width="54" height={36 + staticHead * 1.1} fill="#1d6d8a" />
					<text x="229" y="14" text-anchor="middle" fill="#93aeb0" font-size="11">Refoulement</text>
					<line x1="148" y1="70" x2="148" y2={70 - staticHead * 1.1} stroke="#dff56a" stroke-width="3" />
					<text x="154" y="52" fill="#dff56a" font-size="12">Hstat {n(staticHead, 0)} m</text>
				</svg>
				<figcaption>
					La hauteur statique est cette dénivelée, à débit nul. Ce n’est pas le pourcentage du réservoir.
					Dès que l’eau circule, H = Hstat + pertes. Ici les pertes valent {n(losses, 1)} m, donc H = {n(head, 1)} m.
				</figcaption>
			</figure>
			<div class="speeds">
				<button type="button" class="ghost" aria-pressed={running} onclick={() => (running = !running)}>
					{running ? 'Pause' : 'Lecture'}
				</button>
				<button type="button" class="ghost" onclick={() => (level = 18)}>Relancer l’alerte</button>
			</div>
			<dl class="readout">
				<div><dt>Débit refoulé</dt><dd>{n(usefulFlow, 0)} m³/h</dd></div>
				<div><dt>Hauteur statique</dt><dd>{n(staticHead, 0)} m</dd></div>
				<div><dt>Pertes de charge</dt><dd>{n(losses, 1)} m</dd></div>
				<div><dt>Hauteur manométrique</dt><dd>{n(head, 1)} m</dd></div>
				<div><dt>Puissance absorbée</dt><dd>{n(power, 1)} kW</dd></div>
				<div><dt>Dans une heure</dt><dd>{n(levelAfter(level, usefulFlow, demand, 1), 0)} %</dd></div>
			</dl>
			<p class="enigma-line">
				{bache?.ask}
				{flaque.save.solved.includes('bache') ? ` Objet : ${bache?.itemName}.` : ''}
			</p>
			<p class="enigma-line">
				{hstat?.ask}
				{flaque.save.solved.includes('hstat') ? ` Objet : ${hstat?.itemName}.` : ''}
			</p>
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
				La puissance affichée est la puissance absorbée, ρgQH/η. Ce n’est pas une courbe de pompe réelle.
			</p>
			<p><a href="{base}/modules">Retour aux modules</a></p>
		</div>
	</div>
</div>
