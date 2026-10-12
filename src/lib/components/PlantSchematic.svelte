<script lang="ts">
	import { turbidityColor } from '$lib/sim/chemistry';
	import { n } from '$lib/sim/format';
	import { UNITS } from '$lib/sim/catalog';
	import type { Alarm, Evaluation, UnitId } from '$lib/sim/types';

	let {
		evaluation,
		selected,
		focus,
		onSelect
	}: {
		evaluation: Evaluation;
		selected: UnitId | null;
		focus: UnitId | null;
		onSelect: (id: UnitId) => void;
	} = $props();

	const unitW = 136;
	const pitch = 168;
	const origin = 64;
	const flow = $derived(Math.max(evaluation.productionM3h, 0));
	const duration = $derived(`${Math.max(0.55, 3.4 - flow / 140).toFixed(2)}s`);

	function level(id: UnitId) {
		return evaluation.stages[id];
	}

	function alarmLevel(id: UnitId): Alarm['level'] | null {
		const levels = evaluation.alarms.filter((alarm) => alarm.unit === id).map((alarm) => alarm.level);
		if (levels.includes('critical')) return 'critical';
		if (levels.includes('warn')) return 'warn';
		if (levels.includes('info')) return 'info';
		return null;
	}

	function pipeColor(id: UnitId) {
		return turbidityColor(level(id).turbidityNtu);
	}

	function select(id: UnitId, event?: KeyboardEvent) {
		if (event && event.key !== 'Enter' && event.key !== ' ') return;
		event?.preventDefault();
		onSelect(id);
	}

	const flocs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
</script>

<svg class="schematic" viewBox="0 0 1280 540" role="group" aria-label="Station de traitement">
	<defs>
		<pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
			<circle cx="1" cy="1" r="0.8" fill="rgba(186,214,210,0.16)" />
		</pattern>
		<linearGradient id="river" x1="0" x2="0" y1="0" y2="1">
			<stop offset="0" stop-color={turbidityColor(evaluation.rawTurbidityNtu)} stop-opacity="0.15" />
			<stop offset="1" stop-color={turbidityColor(evaluation.rawTurbidityNtu)} stop-opacity="0.85" />
		</linearGradient>
	</defs>
	<rect width="1280" height="540" fill="url(#dots)" />

	<path
		d="M0 70 C40 90 30 150 18 190 C40 230 8 280 24 330 C10 390 36 430 20 500 L0 500 Z"
		fill="url(#river)"
	/>
	<text class="river-name" x="18" y="48">Rivière</text>

	{#each UNITS as unit, index (unit.id)}
		{#if index < UNITS.length - 1}
			{@const x1 = origin + index * pitch + unitW}
			{@const x2 = origin + (index + 1) * pitch}
			<path
				class="stream"
				class:still={flow < 8}
				d="M {x1} 250 H {x2}"
				stroke={pipeColor(unit.id)}
				style:animation-duration={duration}
			/>
		{/if}
	{/each}

	{#each UNITS as unit, index (unit.id)}
		{@const x = origin + index * pitch}
		{@const active = selected === unit.id}
		{@const flag = alarmLevel(unit.id)}
		<g
			class="unit"
			class:active
			class:thirsty={unit.id === 'storage' && evaluation.storage.deficitM3h > 2}
			transform="translate({x} 48)"
			role="button"
			tabindex="0"
			aria-pressed={active}
			aria-label="{unit.title}. {unit.duty}. {n(level(unit.id).turbidityNtu, 1)} NTU"
			onclick={() => onSelect(unit.id)}
			onkeydown={(event) => select(unit.id, event)}
		>
			<rect class="shell" width={unitW} height="390" rx="22" />
			<text class="idx" x="16" y="28">{unit.index}</text>
			{#if flag}
				<circle class="flag flag-{flag}" cx="118" cy="22" r="6" />
			{/if}
			{#if focus === unit.id && !active}
				<text class="hint" x="70" y="50" text-anchor="middle">ouvrir</text>
			{/if}

			{#if unit.id === 'intake'}
				<rect class="water" x="16" y="78" width="108" height="150" rx="12" fill={pipeColor('intake')} />
				{#each [0, 1, 2, 3, 4] as bar (bar)}
					<rect x={30 + bar * 16} y="92" width="3" height="122" rx="1" fill="rgba(8,18,22,0.45)" />
				{/each}
				<circle cx="70" cy="268" r="18" class="metal" />
				<circle cx="70" cy="268" r="6" fill={pipeColor('intake')} />
			{:else if unit.id === 'coagulation'}
				<rect class="water" x="16" y="70" width="108" height="168" rx="40" fill={pipeColor('coagulation')} />
				{#each flocs as dot (dot)}
					{@const show = evaluation.coag.flocIndex > 0.72 ? dot < 5 : evaluation.coag.flocIndex > 0.4 ? dot < 8 : true}
					{#if show}
						<circle
							cx={34 + (dot % 4) * 24}
							cy={96 + Math.floor(dot / 4) * 36}
							r={evaluation.coag.flocIndex > 0.72 ? 9 : evaluation.coag.flocIndex > 0.4 ? 5 : 2.2}
							fill="rgba(255,248,230,0.78)"
						/>
					{/if}
				{/each}
				<line x1="70" y1="48" x2="70" y2="210" class="shaft" />
			{:else if unit.id === 'settling'}
				<rect class="water" x="16" y="70" width="108" height="180" rx="8" fill={pipeColor('settling')} />
				<polygon
					points="16,250 124,250 108,{250 - evaluation.settling.sludgePercent * 1.15} 32,{250 - evaluation.settling.sludgePercent * 1.15}"
					fill="rgba(78,52,32,0.75)"
				/>
				<path d="M28 86 L70 210 L112 86" fill="none" class="shaft" />
			{:else if unit.id === 'filtration'}
				{#each [0, 1, 2, 3] as cell (cell)}
					<rect
						x={18 + cell * 28}
						y="74"
						width="22"
						height="176"
						rx="6"
						fill={pipeColor('filtration')}
						opacity={0.45 + evaluation.filter.headlossBar / 5}
					/>
					<rect
						x={18 + cell * 28}
						y={74 + (1 - Math.min(evaluation.filter.headlossBar / 2.2, 1)) * 120}
						width="22"
						height="8"
						fill="rgba(255,244,220,0.8)"
					/>
				{/each}
			{:else if unit.id === 'remineralization'}
				<rect class="water" x="16" y="96" width="108" height="140" rx="10" fill={turbidityColor(level('remineralization').turbidityNtu)} />
				<rect x="48" y="52" width="44" height="48" rx="6" class="metal" />
				<text class="mini" x="70" y="80" text-anchor="middle">CaO</text>
				{#each [0, 1, 2, 3, 4] as bubble (bubble)}
					<circle
						cx={36 + bubble * 18}
						cy={200 - bubble * 12}
						r={3 + (bubble % 2)}
						fill="rgba(255,255,255,0.45)"
					/>
				{/each}
			{:else if unit.id === 'disinfection'}
				<rect class="water" x="16" y="78" width="108" height="160" rx="10" fill={turbidityColor(level('disinfection').turbidityNtu)} />
				<path d="M28 96 H112 V124 H28 V152 H112 V180 H28 V208 H112" class="shaft" />
			{:else}
				{@const h = 150 * evaluation.storage.ratio}
				<rect class="metal" x="28" y="70" width="84" height="180" rx="8" />
				<rect
					x="34"
					y={244 - h}
					width="72"
					height={h}
					fill={turbidityColor(level('storage').turbidityNtu)}
				/>
				<rect class="city" x="22" y="268" width="16" height="28" />
				<rect class="city" x="44" y="258" width="18" height="38" />
				<rect class="city" x="68" y="272" width="14" height="24" />
				<rect class="city" x="88" y="264" width="22" height="32" />
			{/if}

			<text class="unit-ntu" x="16" y="318" fill={pipeColor(unit.id)}>
				{n(level(unit.id).turbidityNtu, level(unit.id).turbidityNtu < 10 ? 1 : 0)} NTU
			</text>
			<text class="unit-title" x="16" y="344">{unit.title}</text>
			<text class="unit-duty" x="16" y="364">{unit.duty}</text>
		</g>
	{/each}
</svg>
