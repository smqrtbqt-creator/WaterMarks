<script lang="ts">
	import { residualCurve } from '$lib/disinfection/engine';
	import { hoclFraction } from '$lib/disinfection/engine';
	import type { Settings } from '$lib/disinfection/types';
	import { n } from '$lib/sim/format';

	let { settings }: { settings: Settings } = $props();

	const curve = $derived(residualCurve(settings, 7));
	const phPoints = $derived(
		[6, 6.5, 7, 7.5, 8, 8.5, 9].map((ph) => ({
			ph,
			hocl: hoclFraction(ph, settings.temperatureC)
		}))
	);

	function line(values: number[], min: number, max: number, width: number, height: number) {
		const span = Math.max(max - min, 0.001);
		return values
			.map((value, index) => {
				const x = (index / Math.max(values.length - 1, 1)) * width;
				const y = height - 8 - ((Math.min(max, Math.max(min, value)) - min) / span) * (height - 16);
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}
</script>

<div class="chart-grid">
	<figure>
		<figcaption>Chlore injecté et chlore libre</figcaption>
		<svg viewBox="0 0 240 90" role="img" aria-label="Le chlore libre reste inférieur ou égal au chlore injecté lorsque la demande consomme une partie de la dose">
			<polyline points={line(curve.map((point) => point.injectedMgL), 0, Math.max(1, settings.doseMgL), 240, 90)} />
			<polyline class="second" points={line(curve.map((point) => point.freeMgL), 0, Math.max(1, settings.doseMgL), 240, 90)} />
		</svg>
	</figure>
	<figure>
		<figcaption>Part de HOCl selon le pH</figcaption>
		<svg viewBox="0 0 240 90" role="img" aria-label={`Part de HOCl au pH actuel ${n(hoclFraction(settings.ph, settings.temperatureC) * 100, 0)} pour cent`}>
			<polyline points={line(phPoints.map((point) => point.hocl), 0, 1, 240, 90)} />
		</svg>
	</figure>
</div>
<div class="table-wrap">
	<table>
		<caption>Chlore libre simulé selon le temps de contact, à dose et demande actuelles</caption>
		<thead>
			<tr>
				<th scope="col">Temps</th>
				{#each curve as point (point.minute)}
					<th scope="col">{n(point.minute, 0)} min</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			<tr>
				<th scope="row">Injecté</th>
				{#each curve as point (point.minute)}
					<td>{n(point.injectedMgL, 2)}</td>
				{/each}
			</tr>
			<tr>
				<th scope="row">Libre</th>
				{#each curve as point (point.minute)}
					<td>{n(point.freeMgL, 2)}</td>
				{/each}
			</tr>
		</tbody>
	</table>
</div>
