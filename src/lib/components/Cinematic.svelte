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
		cast?: 'marceline' | 'noe' | 'irma';
	} = $props();
</script>

<div class="cinematic" role="dialog" aria-modal="true" aria-labelledby="cinematic-title">
	<div class="cinematic-card">
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
		<div>
			<p class="mark" id="cinematic-title">{role}</p>
			<h2>{speaker}</h2>
			<p>{line}</p>
			<button type="button" class="primary" onclick={onclose}>{action}</button>
		</div>
	</div>
</div>
