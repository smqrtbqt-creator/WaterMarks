<script lang="ts">
	import { base } from '$app/paths';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
</script>

<svelte:head>
	<title>Modules</title>
</svelte:head>

<div class="app modules">
	<header class="top">
		<div class="brand">
			<p class="mark">Activités</p>
			<h1>Modules</h1>
			<ProjectSwitch current="modules" />
		</div>
	</header>
	<p class="lede">On règle, on prélève, on lit le sens de la réaction. Rien n’est noté.</p>
	<ul class="module-grid">
		<li>
			<a href="{base}/modules/pompage">
				<span>01</span>
				<strong>Station de pompage</strong>
				<p>Débit, hauteur et réservoir. Le niveau suit la différence entre production et demande.</p>
			</a>
		</li>
		<li>
			<a href="{base}/modules/bassin">
				<span>02</span>
				<strong>Bassin versant</strong>
				<p>Prélever à plusieurs endroits, par temps sec, sous la pluie ou après un épandage.</p>
			</a>
		</li>
		<li>
			<a href="{base}/modules/gibbs">
				<span>03</span>
				<strong>Énergie de Gibbs</strong>
				<p>Niveaux de G des réactifs et des produits. On peut inverser le sens.</p>
			</a>
		</li>
	</ul>
</div>
