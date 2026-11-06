<script lang="ts">
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import TpCatalog from '$lib/components/TpCatalog.svelte';
</script>

<svelte:head>
	<title>Documents de TP</title>
</svelte:head>

<div class="app tp-docs">
	<header class="top">
		<div class="brand">
			<p class="mark">Travaux pratiques</p>
			<h1>Documents de TP</h1>
			<ProjectSwitch current="tp" />
		</div>
	</header>
	<TpCatalog />
</div>
