<script lang="ts">
	import { turbidityColor } from '$lib/sim/chemistry';
	import { n } from '$lib/sim/format';
	import type { StageId, StageResult, Status } from '$lib/bastide/types';

	let {
		stages,
		selected,
		tankM3,
		tankCapacityM3,
		onSelect
	}: {
		stages: StageResult[];
		selected: StageId;
		tankM3: number;
		tankCapacityM3: number;
		onSelect: (id: StageId) => void;
	} = $props();

	const statusText: Record<Status, string> = {
		ok: 'Satisfaisant',
		watch: 'Vigilance',
		fail: 'À revoir'
	};

	function metric(stage: StageResult): string {
		const water = stage.after;
		if (stage.id === 'screen') return `${n(water.debris, 0)} débris`;
		if (stage.id === 'ozone' || stage.id === 'uv') return `${n(water.microbial, 0)} risque`;
		if (stage.id === 'carbon') return `${n(water.taste, 0)} goût`;
		if (stage.id === 'remineralization' || stage.id === 'finish') return `pH ${n(water.ph, 2)}`;
		if (stage.id === 'storage') return `${n(tankM3, 0)} m³`;
		return `${n(water.turbidityNtu, water.turbidityNtu < 10 ? 1 : 0)} NTU`;
	}
</script>

<div class="bastide-line" role="group" aria-label="Chaîne de traitement, de l’eau brute au château d’eau">
	{#each stages as stage, index (stage.id)}
		{#if index > 0}
			<span class="bastide-arrow" aria-hidden="true"></span>
		{/if}
		<button
			type="button"
			class="bastide-unit"
			data-status={stage.status}
			aria-pressed={selected === stage.id}
			onclick={() => onSelect(stage.id)}
		>
			<svg viewBox="0 0 72 46" aria-hidden="true">
				<rect x="4" y="28" width="64" height="12" rx="3" fill={turbidityColor(stage.after.turbidityNtu)} />
				{#if stage.id === 'intake'}
					<path d="M8 26 C18 10 28 10 36 26" fill="none" stroke="currentColor" stroke-width="1.6" />
					<path d="M36 26 C46 12 56 12 66 26" fill="none" stroke="currentColor" stroke-width="1.6" />
				{:else if stage.id === 'screen'}
					<path d="M16 8 v18 M28 8 v18 M40 8 v18 M52 8 v18" stroke="currentColor" stroke-width="2" />
				{:else if stage.id === 'coagulation'}
					<circle cx="24" cy="16" r="3" fill="currentColor" />
					<circle cx="36" cy="12" r="4.5" fill="currentColor" />
					<circle cx="50" cy="18" r="3.2" fill="currentColor" />
				{:else if stage.id === 'settling'}
					<circle cx="22" cy="10" r="2.2" fill="currentColor" />
					<circle cx="36" cy="16" r="2.2" fill="currentColor" />
					<circle cx="50" cy="22" r="2.2" fill="currentColor" />
				{:else if stage.id === 'sand'}
					<path d="M14 10 h44 M14 16 h44 M14 22 h44" stroke="currentColor" stroke-width="2" />
				{:else if stage.id === 'ozone'}
					<circle cx="28" cy="16" r="4" fill="none" stroke="currentColor" />
					<circle cx="42" cy="12" r="3" fill="none" stroke="currentColor" />
					<circle cx="48" cy="20" r="2.4" fill="none" stroke="currentColor" />
				{:else if stage.id === 'carbon'}
					<circle cx="22" cy="16" r="3" fill="currentColor" />
					<circle cx="34" cy="12" r="3" fill="currentColor" />
					<circle cx="46" cy="18" r="3" fill="currentColor" />
					<circle cx="56" cy="13" r="2.4" fill="currentColor" />
				{:else if stage.id === 'uv'}
					<rect x="30" y="6" width="12" height="20" rx="6" fill="none" stroke="currentColor" stroke-width="1.6" />
					<path d="M18 16 h8 M46 16 h8" stroke="currentColor" stroke-width="1.4" />
				{:else if stage.id === 'remineralization'}
					<path d="M24 8 v14 M18 14 h12 M48 8 v14" stroke="currentColor" stroke-width="1.6" />
				{:else if stage.id === 'finish'}
					<path d="M28 8 h16 l-3 8 h-10 z M30 16 v8 h12 v-8" fill="none" stroke="currentColor" stroke-width="1.4" />
				{:else}
					<rect x="16" y="8" width="14" height="18" rx="2" fill="none" stroke="currentColor" />
					<rect x="40" y="8" width="14" height="18" rx="2" fill="none" stroke="currentColor" />
					<rect
						x="18"
						y={26 - Math.max(4, (tankM3 / Math.max(tankCapacityM3, 1)) * 16)}
						width="10"
						height={Math.max(4, (tankM3 / Math.max(tankCapacityM3, 1)) * 16)}
						fill="currentColor"
						opacity="0.8"
					/>
				{/if}
			</svg>
			<span class="bastide-status">{statusText[stage.status]}</span>
			<strong>{stage.title}</strong>
			<em>{metric(stage)}</em>
		</button>
	{/each}
</div>
