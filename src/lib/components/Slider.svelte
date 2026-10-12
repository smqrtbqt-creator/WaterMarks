<script lang="ts">
	import { n } from '$lib/sim/format';

	let {
		label,
		value = $bindable(),
		min,
		max,
		step,
		unit = '',
		digits = 0,
		mark = null
	}: {
		label: string;
		value: number;
		min: number;
		max: number;
		step: number;
		unit?: string;
		digits?: number;
		mark?: { at: number; label: string } | null;
	} = $props();

	const pct = $derived(((value - min) / (max - min)) * 100);
	const markPct = $derived(mark ? ((mark.at - min) / (max - min)) * 100 : 0);
</script>

<label class="slider">
	<span class="slider-top">
		<span>{label}</span>
		<strong>{n(value, digits)}{unit ? ` ${unit}` : ''}</strong>
	</span>
	<span class="slider-track" style:--pct="{pct}%">
		{#if mark}
			<span class="slider-mark" style:left="{markPct}%" title={mark.label}></span>
		{/if}
		<input
			type="range"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-label={label}
			{min}
			{max}
			{step}
			{value}
			oninput={(event) => (value = Number(event.currentTarget.value))}
		/>
	</span>
	{#if mark}
		<span class="slider-mark-label">{mark.label}</span>
	{/if}
</label>
