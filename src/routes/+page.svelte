<script lang="ts">
	import FeedbackToast from '$lib/components/FeedbackToast.svelte';
	import HeroChip from '$lib/components/HeroChip.svelte';
	import RoleAlert from '$lib/components/RoleAlert.svelte';
	import { flaque } from '$lib/game/flaque.svelte';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import Inspector from '$lib/components/Inspector.svelte';
	import PlantSchematic from '$lib/components/PlantSchematic.svelte';
	import Trials from '$lib/components/Trials.svelte';
	import { makeToast, type Toast } from '$lib/feedback';
	import { hypotheses, plant, scenarioById, scenarios } from '$lib/sim/catalog';
	import { evaluate, stepAccumulators } from '$lib/sim/engine';
	import { formatClock, n } from '$lib/sim/format';
	import type { Accumulators, RawModifiers, Sample, Settings, Trial, UnitId } from '$lib/sim/types';

	const START = 'crue';

	let scenarioId = $state(START);
	let settings = $state<Settings>(structuredClone(scenarioById(START).initialSettings));
	let acc = $state<Accumulators>(structuredClone(scenarioById(START).initialAccumulators));
	let modifiers = $state<RawModifiers>({ flood: false, degraded: false });
	let selected = $state<UnitId | null>(scenarioById(START).focusUnit);
	let trials = $state<Trial[]>([]);
	let samples = $state<Sample[]>([]);
	let running = $state(true);
	let speed = $state(1);
	let trialNo = $state(1);
	let won = $state(false);
	let hypothesesDialog = $state<HTMLDialogElement | null>(null);
	let toasts = $state<Toast[]>([]);
	let celebratedWin = $state(false);
	let justHitGoals = $state<string[]>([]);
	/** Suivi non réactif pour éviter les boucles d’effet */
	let prevGoalOk: Record<string, boolean> = {};
	let prevCritical = 0;

	const scenario = $derived(scenarioById(scenarioId));
	const evaluation = $derived(evaluate(plant, scenario, settings, acc, modifiers));
	const holdTarget = $derived(scenario.holdMinutes / 60);
	const holdPct = $derived(won ? 100 : Math.min(100, (acc.holdHours / holdTarget) * 100));
	const criticalCount = $derived(evaluation.alarms.filter((alarm) => alarm.level === 'critical').length);

	function freshSample(next = acc): Sample {
		const current = evaluate(plant, scenarioById(scenarioId), settings, next, modifiers);
		return {
			hours: next.hours,
			reservoirRatio: current.storage.ratio,
			productionM3h: current.productionM3h,
			demandM3h: current.demandM3h,
			turbidityNtu: current.filter.turbidityNtu
		};
	}

	function pushToast(kind: Toast['kind'], text: string) {
		toasts = [...toasts, makeToast(kind, text)].slice(-4);
	}

	function load(id: string) {
		const next = scenarioById(id);
		scenarioId = id;
		settings = structuredClone(next.initialSettings);
		acc = structuredClone(next.initialAccumulators);
		modifiers = { flood: false, degraded: false };
		selected = next.focusUnit;
		trials = [];
		trialNo = 1;
		won = false;
		celebratedWin = false;
		prevGoalOk = {};
		prevCritical = 0;
		justHitGoals = [];
		samples = [];
		samples = [freshSample(acc)];
	}

	function noteGoalHits(goals: { id: string; label: string; ok: boolean }[]) {
		const hits: string[] = [];
		const nextMap: Record<string, boolean> = {};
		for (const goal of goals) {
			nextMap[goal.id] = goal.ok;
			if (goal.ok && prevGoalOk[goal.id] === false) {
				hits.push(goal.id);
				pushToast('ok', `Objectif atteint : ${goal.label}`);
			}
		}
		prevGoalOk = nextMap;
		if (!hits.length) return;
		justHitGoals = hits;
		window.setTimeout(() => {
			justHitGoals = justHitGoals.filter((id) => !hits.includes(id));
		}, 900);
	}

	function restart() {
		load(scenarioId);
	}

	function tick() {
		const dtHours = (0.2 * speed) / 60;
		const current = evaluate(plant, scenario, settings, acc, modifiers);
		const next = stepAccumulators(plant, current, acc, dtHours);
		const mark = samples.at(-1)?.hours ?? 0;
		acc = next;
		if (next.hours - mark >= 5 / 60) {
			samples = [...samples, freshSample(next)].slice(-90);
		}
	}

	function record() {
		trials = [
			...trials,
			{
				id: trialNo,
				label: `Essai ${trialNo}`,
				hours: acc.hours,
				deliveredTurbidity: evaluation.filter.turbidityNtu,
				coagTurbidity: evaluation.coag.turbidityNtu,
				coagEfficiency: evaluation.coag.efficiency * 100,
				settledTurbidity: evaluation.settling.turbidityNtu,
				filteredTurbidity: evaluation.filter.turbidityNtu,
				ph: evaluation.remin.ph,
				lsi: evaluation.remin.lsi,
				chlorine: evaluation.disinfection.residualMgL,
				reservoirRatio: evaluation.storage.ratio,
				productionM3h: evaluation.productionM3h,
				settings: $state.snapshot(settings)
			}
		];
		trialNo += 1;
	}

	function restore(trial: Trial) {
		settings = structuredClone(trial.settings);
	}

	samples = [freshSample()];

	$effect(() => {
		if (evaluation.succeeded) won = true;
	});

	$effect(() => {
		noteGoalHits(evaluation.goals);
		if (criticalCount > prevCritical) {
			pushToast(
				'alarm',
				criticalCount === 1
					? 'Alarme critique : vérifiez les ouvrages signalés.'
					: `${criticalCount} alarmes critiques actives.`
			);
		}
		prevCritical = criticalCount;
		if (won && !celebratedWin) {
			celebratedWin = true;
			pushToast('ok', 'Bravo — tous les objectifs sont tenus. Vous pouvez encore perturber la station.');
		}
	});

	$effect(() => {
		if (!running) return;
		const id = window.setInterval(tick, 200);
		return () => window.clearInterval(id);
	});

	$effect(() => {
		if (won) flaque.solve('riviere');
	});
</script>

<svelte:head>
	<title>Rivière Blanche — poste de conduite</title>
</svelte:head>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') selected = null;
	}}
/>

<div class="app">
	<header class="top">
		<div class="brand">
			<p class="mark">Station d’eau potable</p>
			<h1>Rivière Blanche</h1>
			<ProjectSwitch current="home" />
			<HeroChip />
		</div>
		<nav class="scenarios" aria-label="Scénarios">
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
			<div class="speeds" role="group" aria-label="Vitesse du temps simulé">
				<button type="button" class="ghost" aria-pressed={!running} onclick={() => (running = !running)}>
					{running ? 'Pause' : 'Lecture'}
				</button>
				{#each [1, 10, 60] as value (value)}
					<button
						type="button"
						class="ghost"
						aria-pressed={running && speed === value}
						onclick={() => {
							speed = value;
							running = true;
						}}
					>
						×{value}
					</button>
				{/each}
			</div>
		</div>
	</header>

	<section class="brief">
		<div>
			<h2>{scenario.title}</h2>
			<p>{scenario.summary}</p>
			<p class="intent">{scenario.intent}</p>
		</div>
		<div class="goals" aria-live="polite">
			<ul>
				{#each evaluation.goals as goal (goal.id)}
					<li class:ok={goal.ok} class:just-hit={justHitGoals.includes(goal.id)}>
						<span>{goal.ok ? 'Atteint' : 'En cours'}</span>
						{goal.label}
						<strong>{goal.reading}</strong>
					</li>
				{/each}
			</ul>
			<div class="hold">
				<span>
					{evaluation.succeeded || won
						? 'Objectifs tenus'
						: `Maintenir ${scenario.holdMinutes} min · ${formatClock(acc.holdHours)}`}
				</span>
				<div class="hold-bar"><span style:width="{holdPct}%"></span></div>
			</div>
		</div>
	</section>

	<RoleAlert
		speaker="Goutte"
		role="Héros de la flaque"
		line={won
			? 'Les objectifs tiennent. Ce scénario de la Rivière Blanche est le gros morceau, pas un combat de flaque.'
			: criticalCount > 0
				? `${criticalCount} alarme${criticalCount > 1 ? 's' : ''} critique${criticalCount > 1 ? 's' : ''}. La station tousse. Tiens les objectifs : l’arène ne me fera pas monter.`
				: `Production ${n(evaluation.productionM3h, 0)} m³/h, demande ${n(evaluation.demandM3h, 0)} m³/h. On garde le scénario jusqu’au bout.`}
	/>

	{#if won}
		<p class="success">Les objectifs restent atteints. Vous pouvez continuer à perturber la station et comparer.</p>
	{/if}

	<div class="workspace">
		<div class="stage">
			<PlantSchematic
				{evaluation}
				{selected}
				focus={scenario.focusUnit}
				onSelect={(id) => (selected = selected === id ? null : id)}
			/>
			<div class="stage-foot">
				<p>
					{criticalCount
						? `${criticalCount} alarme${criticalCount > 1 ? 's' : ''} critique${criticalCount > 1 ? 's' : ''}`
						: 'Les couleurs suivent la turbidité, d’un ouvrage à l’autre.'}
				</p>
				<div class="stage-actions">
					<button type="button" class="ghost" onclick={restart}>Recommencer</button>
					<button type="button" class="primary" onclick={record}>Enregistrer l’essai</button>
					<button type="button" class="text" onclick={() => hypothesesDialog?.showModal()}>
						Hypothèses du modèle
					</button>
				</div>
			</div>
		</div>
		<Inspector
			bind:settings
			{evaluation}
			{scenario}
			{selected}
			{acc}
			{modifiers}
			{samples}
			onClose={() => (selected = null)}
			onSelect={(id) => (selected = id)}
			onPurge={() => {
				if (acc.purgeRemainingH <= 0) acc.purgeRemainingH = plant.purgeHours;
			}}
			onBackwash={() => {
				if (acc.backwashRemainingH <= 0) acc.backwashRemainingH = plant.backwashHours;
			}}
			onToggleFlood={() => (modifiers.flood = !modifiers.flood)}
			onToggleDegraded={() => (modifiers.degraded = !modifiers.degraded)}
			onClearEvents={() => (modifiers = { flood: false, degraded: false })}
		/>
	</div>

	<Trials {trials} onRestore={restore} onClear={() => (trials = [])} />

	<footer>
		<p>
			Prototype pédagogique. Débit produit {n(evaluation.productionM3h, 0)} m³/h pour une demande de
			{n(evaluation.demandM3h, 0)} m³/h. Les calculs illustrent des enchaînements, ils ne dimensionnent pas une
			usine.
		</p>
	</footer>

	<FeedbackToast bind:toasts />
</div>

<dialog bind:this={hypothesesDialog}>
	<h2>Hypothèses du modèle</h2>
	<ul>
		{#each hypotheses as line, index (index)}
			<li>{line}</li>
		{/each}
	</ul>
	<button type="button" class="primary" onclick={() => hypothesesDialog?.close()}>Fermer</button>
</dialog>
