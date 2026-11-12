<script lang="ts">
	let {
		speaker,
		role,
		line,
		action,
		onclose,
		cast = 'marceline'
	}: {
		speaker: string;
		role: string;
		line: string;
		action: string;
		onclose: () => void;
		cast?: 'marceline' | 'noe' | 'irma' | 'tournesol';
	} = $props();
</script>

<div class="cinematic" role="dialog" aria-modal="true" aria-labelledby="cinematic-title">
	<div class="cinematic-card" class:wide={cast === 'tournesol'}>
		{#if cast === 'tournesol'}
			<svg class="cinematic-face" viewBox="0 0 220 170" aria-hidden="true">
				<ellipse cx="110" cy="158" rx="96" ry="8" fill="#12303a" />
				<g transform="translate(6,86)">
					<rect x="22" y="28" width="54" height="26" rx="4" fill="#1d6d8a" />
					<rect x="52" y="12" width="30" height="22" rx="3" fill="#16485a" />
					<rect x="58" y="16" width="16" height="10" fill="#8ec8e6" />
					<rect x="78" y="20" width="18" height="6" rx="2" fill="#12303a" />
					<circle cx="30" cy="56" r="16" fill="#0c1c22" />
					<circle cx="30" cy="56" r="6" fill="#93aeb0" />
					<circle cx="82" cy="54" r="10" fill="#0c1c22" />
					<circle cx="82" cy="54" r="4" fill="#93aeb0" />
					<circle cx="40" cy="14" r="11" fill="#dff56a" />
					<circle cx="40" cy="14" r="4.5" fill="#c47a2a" />
					<rect x="38" y="24" width="4" height="12" fill="#1d6d4a" />
				</g>
				<g transform="translate(112,16)">
					<rect x="34" y="58" width="10" height="14" fill="#e7c2a0" />
					<path d="M16 70 H64 V132 H16 Z" fill="#e7eef0" />
					<path d="M16 72 L4 108 H20 L26 80 Z" fill="#d5e2e6" />
					<path d="M64 72 L78 104 H58 L52 80 Z" fill="#d5e2e6" />
					<rect x="24" y="132" width="10" height="18" fill="#1d4c5c" />
					<rect x="46" y="132" width="10" height="18" fill="#1d4c5c" />
					<circle cx="40" cy="38" r="24" fill="#e7c2a0" />
					<path d="M18 30 Q12 4 30 16" fill="none" stroke="#f4f7f8" stroke-width="5" stroke-linecap="round" />
					<path d="M28 14 Q40 -2 52 14" fill="none" stroke="#f4f7f8" stroke-width="5" stroke-linecap="round" />
					<path d="M50 16 Q70 2 62 32" fill="none" stroke="#f4f7f8" stroke-width="5" stroke-linecap="round" />
					<circle cx="31" cy="38" r="9" fill="none" stroke="#081216" stroke-width="2.2" />
					<circle cx="51" cy="38" r="9" fill="none" stroke="#081216" stroke-width="2.2" />
					<path d="M40 38 H42" stroke="#081216" stroke-width="2" />
					<circle cx="28" cy="35" r="2.2" fill="#081216" />
					<circle cx="48" cy="34" r="2.2" fill="#081216" />
					<path d="M28 50 Q40 55 52 49" fill="none" stroke="#f4f7f8" stroke-width="3" stroke-linecap="round" />
					<path d="M30 58 Q40 53 50 59" fill="none" stroke="#081216" stroke-width="2" stroke-linecap="round" />
					<text x="78" y="28" fill="#dff56a" font-size="22" font-family="Outfit, sans-serif">?</text>
				</g>
			</svg>
		{:else}
		<svg class="cinematic-face" viewBox="0 0 120 140" aria-hidden="true">
			<ellipse cx="60" cy="118" rx="34" ry="10" fill="#12303a" />
			<rect x="38" y="78" width="44" height="36" rx="10" fill="#1d4c5c" />
			<circle cx="60" cy="52" r="28" fill="#e7c2a0" />
			<circle cx="48" cy="50" r="4" fill="#081216" />
			<circle cx="72" cy="50" r="4" fill="#081216" />
			<path d="M48 64 Q60 74 72 64" fill="none" stroke="#081216" stroke-width="3" stroke-linecap="round" />
			{#if cast === 'noe'}
				<path d="M36 34 Q60 14 84 34" fill="none" stroke="#1d6d8a" stroke-width="8" stroke-linecap="round" />
				<rect x="78" y="78" width="12" height="28" rx="4" fill="#8ec8e6" />
			{:else if cast === 'irma'}
				<circle cx="48" cy="50" r="8" fill="none" stroke="#dff56a" stroke-width="2" />
				<circle cx="72" cy="50" r="8" fill="none" stroke="#dff56a" stroke-width="2" />
				<path d="M56 50 H64" stroke="#dff56a" stroke-width="2" />
				<path d="M40 96 H80" stroke="#dff56a" stroke-width="3" />
				<path d="M60 96 V108" stroke="#dff56a" stroke-width="3" />
			{:else}
				<path d="M34 36 Q60 8 92 34" fill="none" stroke="#dff56a" stroke-width="6" stroke-linecap="round" />
				<circle cx="92" cy="30" r="8" fill="#8ec8e6" />
				<rect x="18" y="86" width="16" height="8" rx="3" fill="#dff56a" transform="rotate(-30 26 90)" />
			{/if}
		</svg>
		{/if}
		<div>
			<p class="mark" id="cinematic-title">{role}</p>
			<h2>{speaker}</h2>
			<p>{line}</p>
			<button type="button" class="primary" onclick={onclose}>{action}</button>
		</div>
	</div>
</div>
