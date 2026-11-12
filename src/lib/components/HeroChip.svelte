<script lang="ts">
	import { base } from '$app/paths';
	import { HERO_NAME, damageOf, hpOf, levelOf } from '$lib/game/flaque';
	import { flaque } from '$lib/game/flaque.svelte';
	import { n } from '$lib/sim/format';

	const hits = $derived(damageOf(flaque.save));
</script>

<p class="hero-chip">
	<a href="{base}/modules/arene">
		{HERO_NAME} · niveau {levelOf(flaque.save)} · {hpOf(flaque.save)} PV · {n(hits, hits < 1 ? 1 : 0)} dégâts
	</a>
</p>
