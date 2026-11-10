<script lang="ts">
	import { base } from '$app/paths';
	import { damageOf, hpOf, levelOf } from '$lib/game/flaque';
	import { flaque } from '$lib/game/flaque.svelte';
</script>

<p class="hero-chip">
	<a href="{base}/modules/arene">
		Goutte · niveau {levelOf(flaque.save)} · {hpOf(flaque.save)} PV · {damageOf(flaque.save)} dégâts
	</a>
</p>
