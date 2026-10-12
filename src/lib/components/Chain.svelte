<script lang="ts">
	import { turbidityColor } from '$lib/sim/chemistry';
	import { n } from '$lib/sim/format';

	let { points }: { points: { label: string; ntu: number }[] } = $props();
</script>

<ol class="chain">
	{#each points as point, index (point.label)}
		<li>
			<span>{point.label}</span>
			<strong style:color={turbidityColor(point.ntu)}>{n(point.ntu, point.ntu < 10 ? 1 : 0)}</strong>
			<em>NTU</em>
		</li>
		{#if index < points.length - 1}
			<li class="chain-arrow" aria-hidden="true">→</li>
		{/if}
	{/each}
</ol>
