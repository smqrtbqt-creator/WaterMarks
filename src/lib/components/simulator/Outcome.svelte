<script lang="ts">
	import { n } from '$lib/sim/format';
	import { ironTotal, manganeseTotal, type Simulation } from '$lib/simulator/engine';
	import type { StudyCase, Water } from '$lib/simulator/types';
	import type { Judgement } from '$lib/simulator/validation';

	let {
		study,
		simulation,
		judgement,
		lines,
		memory
	}: {
		study: StudyCase;
		simulation: Simulation;
		judgement: Judgement;
		lines: string[];
		memory: Water | null;
	} = $props();

	const readers: Record<string, { label: string; unit: string; digits: number; read: (water: Water) => number }> = {
		ph: { label: 'pH', unit: '', digits: 2, read: (water) => water.ph },
		turbidityNtu: { label: 'Turbidité', unit: 'NTU', digits: 2, read: (water) => water.turbidityNtu },
		ironDissolvedMgL: { label: 'Fer dissous', unit: 'mg/L', digits: 3, read: (water) => water.ironDissolvedMgL },
		ironParticulateMgL: { label: 'Fer particulaire', unit: 'mg/L', digits: 3, read: (water) => water.ironParticulateMgL },
		ironTotal: { label: 'Fer total', unit: 'mg/L', digits: 3, read: ironTotal },
		manganeseDissolvedMgL: { label: 'Manganèse dissous', unit: 'mg/L', digits: 3, read: (water) => water.manganeseDissolvedMgL },
		mnTotal: { label: 'Manganèse total', unit: 'mg/L', digits: 3, read: manganeseTotal },
		nitrateMgL: { label: 'Nitrates', unit: 'mg/L', digits: 1, read: (water) => water.nitrateMgL },
		hardnessF: { label: 'Dureté', unit: '°f', digits: 1, read: (water) => water.hardnessF },
		calciumF: { label: 'Calcium', unit: '°f', digits: 1, read: (water) => water.calciumF },
		magnesiumF: { label: 'Magnésium', unit: '°f', digits: 1, read: (water) => water.magnesiumF },
		alkalinityF: { label: 'Alcalinité', unit: '°f', digits: 1, read: (water) => water.alkalinityF },
		h2sMgL: { label: 'H₂S dans l’eau', unit: 'mg/L', digits: 3, read: (water) => water.h2sMgL },
		h2sStrippedMgL: { label: 'H₂S transféré à l’air', unit: 'mg/L', digits: 3, read: (water) => water.h2sStrippedMgL },
		h2sOxidizedMgL: { label: 'H₂S oxydé', unit: 'mg/L', digits: 3, read: (water) => water.h2sOxidizedMgL },
		tocMgL: { label: 'COT', unit: 'mg/L', digits: 2, read: (water) => water.tocMgL },
		microbial: { label: 'Indicateur microbien', unit: '0–100', digits: 1, read: (water) => water.microbial },
		pesticideUgL: { label: 'Pesticide', unit: 'µg/L', digits: 3, read: (water) => water.pesticideUgL },
		chlorineFreeMgL: { label: 'Chlore libre', unit: 'mg/L', digits: 2, read: (water) => water.chlorineFreeMgL }
	};

	const focus = $derived(study.focus.map((id) => readers[id]).filter(Boolean));
	const tableRows = [
		'ph',
		'turbidityNtu',
		'ironTotal',
		'mnTotal',
		'nitrateMgL',
		'hardnessF',
		'calciumF',
		'magnesiumF',
		'alkalinityF',
		'h2sMgL',
		'h2sStrippedMgL',
		'h2sOxidizedMgL',
		'tocMgL',
		'microbial',
		'pesticideUgL',
		'chlorineFreeMgL'
	].map((id) => readers[id]);
	const enabledSteps = $derived(simulation.steps.filter((step) => step.enabled));
	const bypassed = $derived(simulation.steps.filter((step) => !step.enabled).length);

	function width(value: number, max: number) {
		if (max <= 0) return 0;
		return Math.max(0, Math.min(100, (value / max) * 100));
	}
</script>

<section class="panel lab-card" aria-labelledby="lab-result-title">
	<p class="mark">Zone D · résultats</p>
	<h2 id="lab-result-title">Avant / après</h2>
	<p class="lab-status {judgement.status}" role="status">{judgement.title}</p>
	{#if judgement.gasAlert}
		<p class="lab-alert">
			Le sulfure d’hydrogène est toxique. L’odeur d’œuf pourri n’est pas une mesure de sa concentration. S’il passe dans l’air, ce transfert doit être maîtrisé : l’aération ne le détruit pas.
		</p>
	{/if}
	<ul class="lab-goals">
		{#each judgement.goals as goal}
			<li class:ok={goal.ok}>{goal.ok ? 'Atteint' : 'Non atteint'} — {goal.label}</li>
		{/each}
	</ul>
	<div class="lab-bars" aria-label="Graphique avant et après">
		{#each focus as item (item.label)}
			{@const before = item.read(simulation.before)}
			{@const after = item.read(simulation.after)}
			{@const max = Math.max(before, after, 0.001)}
			<div>
				<span>{item.label} {item.unit}</span>
				<div class="track" title="Avant {n(before, item.digits)}">
					<i style:width="{width(before, max)}%"></i>
				</div>
				<div class="track after" title="Après {n(after, item.digits)}">
					<i style:width="{width(after, max)}%"></i>
				</div>
			</div>
		{/each}
	</div>
	<p class="lab-note">Barre du haut : eau brute. Barre du bas : eau de sortie. Volume d’essai : {n(simulation.volumeM3, 0)} m³, fixé pour comparer.</p>
	<table>
		<thead>
			<tr>
				<th>Paramètre</th>
				<th>Avant</th>
				<th>Après</th>
				{#if memory}<th>Essai mémorisé</th>{/if}
			</tr>
		</thead>
		<tbody>
			{#each tableRows as item}
				<tr>
					<td>{item.label} {item.unit}</td>
					<td>{n(item.read(simulation.before), item.digits)}</td>
					<td>{n(item.read(simulation.after), item.digits)}</td>
					{#if memory}<td>{n(item.read(memory), item.digits)}</td>{/if}
				</tr>
			{/each}
			<tr>
				<td>Langelier d’atelier</td>
				<td colspan={memory ? 3 : 2}>{n(simulation.lsi, 2)} — {simulation.stability}</td>
			</tr>
		</tbody>
	</table>
	<h3>Étapes en service</h3>
	<ul class="lab-list">
		{#each enabledSteps as step (step.id)}
			<li><strong>{step.title}.</strong> {step.summary}</li>
		{/each}
	</ul>
	<p class="lab-note">{bypassed} étape{bypassed > 1 ? 's' : ''} en court-circuit.</p>
	<h3>Réactifs</h3>
	{#if simulation.reagents.length === 0}
		<p class="lab-note">Aucun réactif : les étapes dosées sont arrêtées.</p>
	{:else}
		<ul class="lab-list">
			{#each simulation.reagents as reagent}
				<li>{reagent.label} — {reagent.detail}</li>
			{/each}
		</ul>
	{/if}
	<p>Indice de réactifs : {n(simulation.reagentIndex, 0)}. Ce n’est pas un coût en euros.</p>
	{#if simulation.issues.length}
		<h3>Données corrigées</h3>
		<ul class="lab-list">
			{#each simulation.issues as issue}
				<li>{issue}</li>
			{/each}
		</ul>
	{/if}
	<div class="lab-feedback">
		{#each judgement.lines as line}
			<p>{line}</p>
		{/each}
	</div>
	<details>
		<summary>Synthèse du parcours</summary>
		<ul class="lab-list">
			{#each lines as line}
				<li>{line}</li>
			{/each}
		</ul>
	</details>
</section>
