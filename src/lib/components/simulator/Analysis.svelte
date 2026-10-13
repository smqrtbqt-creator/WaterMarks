<script lang="ts">
	import { turbidityColor } from '$lib/sim/chemistry';
	import { n } from '$lib/sim/format';
	import type { StudyCase, Water } from '$lib/simulator/types';

	let { study, water }: { study: StudyCase; water: Water } = $props();

	const tint = $derived(water.turbidityNtu + water.ironDissolvedMgL * 6 + water.ironParticulateMgL * 8);
	const color = $derived(turbidityColor(tint));
	const specks = $derived(Math.round(Math.min(18, water.turbidityNtu * 1.6 + water.ironParticulateMgL * 4)));

	const statusLabel = {
		measured: 'Mesuré',
		simulated: 'Simulé',
		missing: 'Manquant'
	};
</script>

<section class="panel lab-card" aria-labelledby="lab-analysis-title">
	<p class="mark">Zone A · eau brute</p>
	<h2 id="lab-analysis-title">{study.title}</h2>
	<div class="lab-sample">
		<svg viewBox="0 0 120 150" role="img" aria-label="Échantillon d’eau brute">
			<title>Fiole d’eau brute</title>
			<path d="M34 18 h52 v18 l14 96 a16 16 0 0 1-16 16 H36 a16 16 0 0 1-16-16 L34 36 Z" fill="#10242c" stroke="rgba(196,224,220,0.45)" />
			<path d="M28 78 h64 l8 48 a12 12 0 0 1-12 12 H32 a12 12 0 0 1-12-12 Z" fill={color} />
			{#each Array(specks) as _, index (index)}
				<circle
					cx={36 + ((index * 17) % 48)}
					cy={96 + ((index * 13) % 28)}
					r={index % 3 === 0 ? 2.2 : 1.3}
					fill={water.ironDissolvedMgL > 0.4 ? '#8a4b28' : '#5c4632'}
					opacity="0.75"
				/>
			{/each}
		</svg>
		<div>
			<p><strong>Provenance.</strong> {study.origin}</p>
			<p><strong>Symptômes.</strong> {study.symptoms}</p>
			<p class="lab-note">La teinte suit la turbidité et le fer. Elle ne dit pas si l’eau est potable.</p>
		</div>
	</div>
	<table>
		<thead>
			<tr>
				<th>Paramètre</th>
				<th>Valeur</th>
				<th>Statut</th>
			</tr>
		</thead>
		<tbody>
			{#each study.rows as item (item.id)}
				<tr>
					<td>{item.label}</td>
					<td>{item.value === null ? '—' : `${n(item.value, item.digits)} ${item.unit}`}</td>
					<td><span class="lab-tag {item.status}">{statusLabel[item.status]}</span></td>
				</tr>
			{/each}
		</tbody>
	</table>
	<h3>Objectifs de l’atelier</h3>
	<ul class="lab-list">
		{#each study.goals as goal}
			<li>{goal}</li>
		{/each}
	</ul>
	<h3>Pas encore connu</h3>
	<ul class="lab-list">
		{#each study.unknowns as item}
			<li>{item}</li>
		{/each}
	</ul>
</section>
