<script lang="ts">
	import Charts from '$lib/components/bastide/Charts.svelte';
	import Compare from '$lib/components/bastide/Compare.svelte';
	import Panel from '$lib/components/bastide/Panel.svelte';
	import Synoptic from '$lib/components/bastide/Synoptic.svelte';
	import { CATEGORY_LABEL, factById, factNumber, facts, lessons, scenarioById, scenarios } from '$lib/bastide/catalog';
	import { evaluate, step } from '$lib/bastide/model';
	import type { Accumulators, DataCategory, Settings, StageId, Trial } from '$lib/bastide/types';
	import { formatClock, n } from '$lib/sim/format';

	const START = 'claire';

	let scenarioId = $state(START);
	let settings = $state<Settings>(structuredClone(scenarioById(START).initialSettings));
	let acc = $state<Accumulators>(structuredClone(scenarioById(START).initialAccumulators));
	let selected = $state<StageId>(scenarioById(START).focus);
	let trials = $state<Trial[]>([]);
	let trialNo = $state(1);
	let running = $state(false);
	let speed = $state(1);
	let sheetFilter = $state<'all' | DataCategory>('all');
	let referenceDialog = $state<HTMLDialogElement | null>(null);
	let lessonDialog = $state<HTMLDialogElement | null>(null);

	const scenario = $derived(scenarioById(scenarioId));
	const evaluation = $derived(evaluate(scenario, settings, acc));
	const lesson = $derived(lessons[selected]);
	const shownFacts = $derived(
		sheetFilter === 'all' ? facts : facts.filter((fact) => fact.category === sheetFilter)
	);
	const missionCount = $derived(evaluation.missions.filter((mission) => mission.ok).length);
	const tankUnit = factNumber('tank-unit-m3');
	const tankTotal = tankUnit * factNumber('tank-count');

	function load(id: string) {
		const next = scenarioById(id);
		scenarioId = id;
		settings = structuredClone(next.initialSettings);
		acc = structuredClone(next.initialAccumulators);
		selected = next.focus;
		trials = [];
		trialNo = 1;
		running = false;
	}

	function restart() {
		const next = scenarioById(scenarioId);
		settings = structuredClone(next.initialSettings);
		acc = structuredClone(next.initialAccumulators);
		running = false;
	}

	function tick() {
		const dtHours = (0.2 * speed) / 60;
		const current = evaluate(scenario, settings, acc);
		acc = step(current, acc, dtHours);
	}

	function record() {
		const snapSettings = structuredClone($state.snapshot(settings));
		const snapAcc = structuredClone($state.snapshot(acc));
		trials = [
			...trials,
			{
				id: trialNo,
				label: `Essai ${trialNo}`,
				scenarioTitle: scenario.title,
				settings: snapSettings,
				acc: snapAcc,
				turbidityNtu: evaluation.outlet.turbidityNtu,
				ph: evaluation.outlet.ph,
				chlorineMgL: evaluation.networkChlorineMgL,
				microbial: evaluation.outlet.microbial,
				reagentScore: evaluation.reagentScore,
				reagentGh: evaluation.reagentGh,
				failures: evaluation.missions.filter((mission) => !mission.ok).map((mission) => mission.label)
			}
		];
		trialNo += 1;
	}

	function restore(trial: Trial) {
		settings = structuredClone(trial.settings);
		acc = structuredClone(trial.acc);
	}

	function factText(value: number | string, unit: string | null) {
		if (typeof value !== 'number') return value;
		const digits = Number.isInteger(value) ? 0 : Math.abs(value) < 0.1 ? 3 : 2;
		return `${n(value, digits)}${unit ? ` ${unit}` : ''}`;
	}

	$effect(() => {
		if (!running) return;
		const id = window.setInterval(tick, 200);
		return () => window.clearInterval(id);
	});
</script>

<svelte:head>
	<title>La Bastide — simulation pédagogique</title>
</svelte:head>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') {
			referenceDialog?.close();
			lessonDialog?.close();
		}
	}}
/>

<div class="app bastide">
	<header class="top">
		<div class="brand">
			<p class="mark">Limoges · modèle éducatif</p>
			<h1>La Bastide</h1>
			<p class="plant-switch">
				<a href="/">Rivière Blanche</a>
				<a href="/desinfection">Désinfection</a>
				<a href="/laboratoire">Laboratoire</a>
				<a href="/info-agricole/">Information agricole</a>
			</p>
		</div>
		<nav class="scenarios" aria-label="Scénarios d’eau brute">
			{#each scenarios as item (item.id)}
				<button
					type="button"
					class="scenario"
					aria-pressed={item.id === scenarioId}
					onclick={() => load(item.id)}
				>
					<span>{item.kicker}</span>
					{item.title}
				</button>
			{/each}
		</nav>
		<div class="clock">
			<p>{formatClock(acc.hours)}</p>
			<div class="speeds" role="group" aria-label="Temps simulé">
				<button type="button" class="ghost" aria-pressed={running} onclick={() => (running = !running)}>
					{running ? 'Pause' : 'Lecture'}
				</button>
				<button type="button" class="ghost" onclick={restart}>Réinitialiser</button>
				{#each [1, 10, 60] as value (value)}
					<button type="button" class="ghost" aria-pressed={speed === value} onclick={() => (speed = value)}>
						×{value}
					</button>
				{/each}
			</div>
		</div>
	</header>

	<p class="disclaimer">
		Simulation pédagogique inspirée de la station de l’eau de La Bastide. Les doses ne sont pas des consignes du site,
		et les résultats ne sont pas des mesures. Le château d’eau stocke l’eau potable ; il ne la potabilise pas.
		Production citée {n(factNumber('production-m3-day'), 0)} m³/j, rendement 2023 {n(factNumber('yield-2023-percent'), 0)} %,
		cuves {n(tankUnit, 0)} m³ × {factNumber('tank-count')} = {n(tankTotal, 0)} m³.
	</p>

	<section class="brief">
		<div>
			<p class="kicker">{scenario.kicker}</p>
			<h2>{scenario.title}</h2>
			<p>{scenario.summary}</p>
		</div>
		<div class="goals">
			<ul>
				{#each evaluation.missions as mission (mission.id)}
					<li class:ok={mission.ok}>
						<span>{mission.ok ? 'Atteint' : 'En cours'} · {mission.basis === 'regulatory_reference' ? 'référence citée' : 'hypothèse'}</span>
						<strong>{mission.label}</strong>
					</li>
				{/each}
			</ul>
			<p class="note">{missionCount} / {evaluation.missions.length} objectifs atteints avec les réglages actuels. Ils se recalculent dès qu’un curseur bouge.</p>
		</div>
	</section>

	<div class="workspace">
		<section class="stage" aria-label="Synoptique de la station">
			<Synoptic
				stages={evaluation.stages}
				{selected}
				tankM3={evaluation.tankM3}
				tankCapacityM3={evaluation.tankCapacityM3}
				onSelect={(id) => (selected = id)}
			/>
			<div class="metrics-row">
				<p><span>Débit traité</span><strong>{n(evaluation.productionM3h, 0)} m³/h</strong></p>
				<p><span>Volume stocké</span><strong>{n(evaluation.tankM3, 0)} / {n(evaluation.tankCapacityM3, 0)} m³</strong></p>
				<p><span>Chlore après séjour</span><strong>{n(evaluation.networkChlorineMgL, 2)} mg/L</strong></p>
			</div>
			<Charts stages={evaluation.stages} />
			<div class="stage-foot">
				<button type="button" class="primary" onclick={record}>Enregistrer l’essai</button>
				<button type="button" class="text" onclick={() => referenceDialog?.showModal()}>Données de référence</button>
			</div>
		</section>
		<Panel bind:settings bind:acc {evaluation} {selected} onLesson={() => lessonDialog?.showModal()} />
	</div>

	<Compare {trials} onRestore={restore} onClear={() => (trials = [])} />

	<footer>
		Sources : rapport de développement durable 2024 de Limoges Métropole ; page de modernisation de la station ;
		arrêté du 11 janvier 2007 modifié par l’arrêté du 30 décembre 2022 pour les références de turbidité et de pH.
		Surveillance citée : {factById('instruments').value}, {factById('lab-frequency').value}, {factById('pesticides').value},
		{factById('chlorine-devices').value}.
	</footer>
</div>

<dialog bind:this={referenceDialog}>
	<h2>Fiche de référence</h2>
	<div class="inline-choices" role="group" aria-label="Catégorie de données">
		<button type="button" class="ghost" aria-pressed={sheetFilter === 'all'} onclick={() => (sheetFilter = 'all')}>Toutes</button>
		<button type="button" class="ghost" aria-pressed={sheetFilter === 'official'} onclick={() => (sheetFilter = 'official')}>Site</button>
		<button type="button" class="ghost" aria-pressed={sheetFilter === 'educational_assumption'} onclick={() => (sheetFilter = 'educational_assumption')}>Hypothèses</button>
		<button type="button" class="ghost" aria-pressed={sheetFilter === 'regulatory_reference'} onclick={() => (sheetFilter = 'regulatory_reference')}>Réglementaire</button>
	</div>
	<div class="sheet">
		{#each shownFacts as fact (fact.id)}
			<article>
				<p class="kicker">{CATEGORY_LABEL[fact.category]}</p>
				<h3>{factText(fact.value, fact.unit)}</h3>
				<p>{fact.description}</p>
				<p class="note">{fact.source} {fact.context}</p>
			</article>
		{/each}
	</div>
	<button type="button" class="primary" onclick={() => referenceDialog?.close()}>Fermer</button>
</dialog>

<dialog bind:this={lessonDialog}>
	<h2>{evaluation.stages.find((stage) => stage.id === selected)?.title}</h2>
	<p>{lesson.objective}</p>
	<h3>Phénomène</h3>
	<p>{lesson.phenomenon}</p>
	<h3>Ce que vous réglez</h3>
	<p>{lesson.parameters}</p>
	<h3>Trop faible, adapté, excessif</h3>
	<ul>
		<li>{lesson.low}</li>
		<li>{lesson.adapted}</li>
		<li>{lesson.high}</li>
	</ul>
	<h3>Comment vérifier</h3>
	<p>{lesson.indicators}</p>
	<h3>Limites du modèle</h3>
	<p>{lesson.limits}</p>
	<button type="button" class="primary" onclick={() => lessonDialog?.close()}>Fermer</button>
</dialog>
