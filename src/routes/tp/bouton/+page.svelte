<script lang="ts">
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
</script>

<svelte:head>
	<title>Bouton</title>
</svelte:head>

<div class="app">
	<header class="top">
		<div class="brand">
			<p class="mark">Bouton</p>
			<h1>C’est vrai</h1>
			<ProjectSwitch current="tp" />
		</div>
	</header>
	<iframe
		class="sound-instant"
		title="C’est vrai"
		width="110"
		height="200"
		src="https://www.myinstants.com/instant/cest-vrai-54735/embed/"
		frameborder="0"
		scrolling="no"
	></iframe>
</div>
