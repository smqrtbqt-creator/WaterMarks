<script lang="ts">
	import { onMount } from 'svelte';
	import Analysis from '$lib/components/simulator/Analysis.svelte';
	import Diagnosis from '$lib/components/simulator/Diagnosis.svelte';
	import FeedbackToast from '$lib/components/FeedbackToast.svelte';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import Outcome from '$lib/components/simulator/Outcome.svelte';
	import Plant from '$lib/components/simulator/Plant.svelte';
	import { makeToast, type Toast } from '$lib/feedback';
	import { CASES, caseById } from '$lib/simulator/cases';
	import { MODEL_LIMITS, simulate } from '$lib/simulator/engine';
	import { defaultSettings } from '$lib/simulator/treatments';
	import { MODULE_ORDER, type ProblemId } from '$lib/simulator/types';
	import { judge, synthesis } from '$lib/simulator/validation';

	let studyId = $state(CASES[0].id);
	let settings = $state(defaultSettings(CASES[0].moleculeId));
	let selectedProblems = $state<ProblemId[]>([]);
	let diagnosisSent = $state(false);
	let help = $state(0);
	let hasRun = $state(false);
	let playing = $state(false);
	let reduced = $state(false);
	let tick = $state(0);
	let memory = $state<ReturnType<typeof simulate>['after'] | null>(null);
	let toasts = $state<Toast[]>([]);

	const study = $derived(caseById(studyId));
	const simulation = $derived(simulate(study.water, settings));
	const judgement = $derived(judge(study, simulation, settings));
	const lines = $derived(synthesis(study, simulation, settings, judgement, diagnosisSent));
	const enabledIds = $derived(MODULE_ORDER.filter((id) => settings.enabled[id]));
	const activeId = $derived(playing && !reduced && enabledIds.length ? enabledIds[tick % enabledIds.length] : null);

	$effect(() => {
		if (!playing || reduced) return;
		const timer = setInterval(() => {
			tick += 1;
		}, 900);
		return () => clearInterval(timer);
	});

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	function pushToast(kind: Toast['kind'], text: string) {
		toasts = [...toasts, makeToast(kind, text)].slice(-4);
	}

	function load(id: string) {
		const next = caseById(id);
		studyId = next.id;
		settings = defaultSettings(next.moleculeId);
		selectedProblems = [];
		diagnosisSent = false;
		help = 0;
		hasRun = false;
		playing = false;
		tick = 0;
		memory = null;
	}

	function announceJudgement() {
		const kind = judgement.status === 'atteint' ? 'ok' : judgement.status === 'partiel' ? 'info' : 'alarm';
		pushToast(kind, judgement.title);
		if (judgement.gasAlert) {
			pushToast('alarm', 'Attention H₂S : l’odeur ne mesure pas le danger. Maîtrisez le transfert à l’air.');
		}
	}

	function launch() {
		hasRun = true;
		playing = !reduced;
		tick = 0;
		announceJudgement();
	}
</script>

<svelte:head>
	<title>Laboratoire de traitement — WaterMarks</title>
</svelte:head>

<div class="app lab">
	<header class="top">
		<div class="brand">
			<p class="mark">BTSA GEMEAU · atelier</p>
			<h1>Laboratoire</h1>
			<ProjectSwitch current="laboratoire" />
		</div>
		<div class="lab-actions">
			<button type="button" class="primary" onclick={launch}>{playing ? 'Relancer' : 'Lancer la simulation'}</button>
			<button type="button" onclick={() => (playing = false)} disabled={!playing}>Pause</button>
			<button type="button" aria-pressed={reduced} onclick={() => ((reduced = !reduced), (playing = false))}>
				{reduced ? 'Animations réduites' : 'Réduire les animations'}
			</button>
			<button type="button" onclick={() => (memory = simulation.after)}>Mémoriser l’essai</button>
			<button type="button" onclick={() => load(studyId)}>Recommencer le cas</button>
		</div>
	</header>

	<nav class="scenarios" aria-label="Cas pratiques">
		{#each CASES as item (item.id)}
			<button type="button" class="scenario" aria-pressed={item.id === studyId} onclick={() => load(item.id)}>
				<span>{item.kicker}</span>
				{item.title}
			</button>
		{/each}
	</nav>

	<div class="lab-grid">
		<Analysis {study} water={simulation.before} />
		<Diagnosis {study} bind:selected={selectedProblems} bind:sent={diagnosisSent} bind:help {hasRun} />
	</div>
	<Plant bind:settings {simulation} running={playing} {reduced} {activeId} showSource={study.id === 'microbes'} />
	<Outcome {study} {simulation} {judgement} {lines} {memory} />

	<details class="panel lab-card">
		<summary>Limites du modèle</summary>
		<ul class="lab-list">
			{#each MODEL_LIMITS as limit}
				<li>{limit}</li>
			{/each}
		</ul>
	</details>

	<FeedbackToast bind:toasts />
</div>
