<script lang="ts">
	import { PROBLEMS, type ProblemId, type StudyCase } from '$lib/simulator/types';
	import { reviewDiagnosis } from '$lib/simulator/validation';

	let {
		study,
		selected = $bindable(),
		sent = $bindable(),
		help = $bindable(),
		hasRun
	}: {
		study: StudyCase;
		selected: ProblemId[];
		sent: boolean;
		help: number;
		hasRun: boolean;
	} = $props();

	const review = $derived(sent ? reviewDiagnosis(study.problems, selected) : null);

	function toggle(id: ProblemId) {
		selected = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
		sent = false;
	}
</script>

<section class="panel lab-card" aria-labelledby="lab-diagnosis-title">
	<p class="mark">Zone B · diagnostic</p>
	<h2 id="lab-diagnosis-title">Hypothèses</h2>
	<p class="lab-note">Plusieurs problèmes peuvent coexister. Le diagnostic ne bloque pas la station.</p>
	<div class="lab-choices" role="group" aria-label="Hypothèses de diagnostic">
		{#each PROBLEMS as problem (problem.id)}
			<button type="button" class="lab-choice" aria-pressed={selected.includes(problem.id)} onclick={() => toggle(problem.id)}>
				{problem.label}
			</button>
		{/each}
	</div>
	<button type="button" class="primary" onclick={() => (sent = true)}>Soumettre le diagnostic</button>
	{#if review}
		<div class="lab-feedback" aria-live="polite">
			{#each review.lines as line}
				<p>{line}</p>
			{/each}
		</div>
	{/if}
	<div class="lab-help">
		<button type="button" aria-pressed={help === 1} onclick={() => (help = help === 1 ? 0 : 1)}>Indice</button>
		<button type="button" aria-pressed={help === 2} onclick={() => (help = help === 2 ? 0 : 2)}>Principe</button>
		<button type="button" aria-pressed={help === 3} disabled={!hasRun} onclick={() => (help = 3)}>
			Correction
		</button>
	</div>
	{#if help > 0}
		<p class="lab-feedback">{study.hints[help - 1]}</p>
	{/if}
	{#if !hasRun}
		<p class="lab-note">La correction détaillée s’ouvre après un premier lancement.</p>
	{/if}
</section>
