<script lang="ts">
	import { n } from '$lib/sim/format';
	import type { StageResult, Status } from '$lib/bastide/types';

	let { stages }: { stages: StageResult[] } = $props();

	const width = 240;
	const height = 72;

	const statusText: Record<Status, string> = {
		ok: 'Satisfaisant',
		watch: 'Vigilance',
		fail: 'À revoir'
	};

	function line(values: number[], min: number, max: number): string {
		const span = Math.max(max - min, 0.001);
		return values
			.map((value, index) => {
				const x = (index / Math.max(values.length - 1, 1)) * width;
				const y = height - 6 - ((Math.min(max, Math.max(min, value)) - min) / span) * (height - 12);
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}

	const turbidity = $derived(stages.map((stage) => stage.after.turbidityNtu));
	const ph = $derived(stages.map((stage) => stage.after.ph));
	const chlorine = $derived(stages.map((stage) => stage.after.chlorineMgL));
	const microbial = $derived(stages.map((stage) => stage.after.microbial));
	const turbMax = $derived(Math.max(10, ...turbidity));
	const chlorineMax = $derived(Math.max(0.6, ...chlorine));
</script>

<div class="chart-grid">
	<figure>
		<figcaption>Turbidité</figcaption>
		<svg viewBox="0 0 {width} {height}" role="img" aria-label={`Turbidité simulée, de ${n(turbidity[0] ?? 0, 1)} à ${n(turbidity.at(-1) ?? 0, 2)} NTU`}>
			<polyline points={line(turbidity, 0, turbMax)} />
		</svg>
	</figure>
	<figure>
		<figcaption>pH</figcaption>
		<svg viewBox="0 0 {width} {height}" role="img" aria-label={`pH simulé, de ${n(ph[0] ?? 0, 2)} à ${n(ph.at(-1) ?? 0, 2)}`}>
			<polyline points={line(ph, 5.5, 10)} />
		</svg>
	</figure>
	<figure>
		<figcaption>Chlore résiduel</figcaption>
		<svg viewBox="0 0 {width} {height}" role="img" aria-label={`Chlore simulé en fin de chaîne ${n(chlorine.at(-1) ?? 0, 2)} mg par litre`}>
			<polyline points={line(chlorine, 0, chlorineMax)} />
		</svg>
	</figure>
	<figure>
		<figcaption>Risque microbiologique</figcaption>
		<svg viewBox="0 0 {width} {height}" role="img" aria-label={`Risque microbiologique simulé, de ${n(microbial[0] ?? 0, 0)} à ${n(microbial.at(-1) ?? 0, 0)}`}>
			<polyline points={line(microbial, 0, 100)} />
		</svg>
	</figure>
</div>

<div class="table-wrap bastide-table">
	<table>
		<caption>Valeurs simulées après chaque étape</caption>
		<thead>
			<tr>
				<th scope="col">Étape</th>
				<th scope="col">Turbidité</th>
				<th scope="col">pH</th>
				<th scope="col">Chlore</th>
				<th scope="col">Risque</th>
				<th scope="col">État</th>
			</tr>
		</thead>
		<tbody>
			{#each stages as stage (stage.id)}
				<tr>
					<th scope="row">{stage.title}</th>
					<td>{n(stage.after.turbidityNtu, stage.after.turbidityNtu < 10 ? 2 : 0)} NTU</td>
					<td>{n(stage.after.ph, 2)}</td>
					<td>{n(stage.after.chlorineMgL, 2)} mg/L</td>
					<td>{n(stage.after.microbial, 0)}</td>
					<td>{statusText[stage.status]}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
