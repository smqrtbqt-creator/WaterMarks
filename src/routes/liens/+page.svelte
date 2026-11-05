<script lang="ts">
	import { docLinks } from '$lib/links';
</script>

<svelte:head>
	<title>Liens — documents de séance</title>
</svelte:head>

<div class="app links">
	<header class="top">
		<div class="brand">
			<p class="mark">Documents · séances</p>
			<h1>Liens</h1>
			<p class="plant-switch">
				<a href="/">Rivière Blanche</a>
				<a href="/bastide">La Bastide</a>
				<a href="/desinfection">Désinfection</a>
				<a href="/laboratoire">Laboratoire</a>
				<a href="/info-agricole/">Information agricole</a>
				<a href="/redox/">Redox</a>
				<a href="/alcalinite/">Alcalinité</a>
				<a href="/alcalinite/equilibre">Filière forage</a>
				<a href="/liens" aria-current="page">Liens</a>
				<a href="/documents-tp">Documents de TP</a>
			</p>
		</div>
	</header>

	<section class="brief">
		<div>
			<h2>Documents et données</h2>
			<p>
				Ces adresses s’ouvrent dans un nouvel onglet. Un fichier CSV se télécharge ou s’affiche selon le
				navigateur.
			</p>
		</div>
	</section>

	{#if docLinks.length === 0}
		<p class="lab-note">Aucun document pour le moment.</p>
	{:else}
		<ul class="resource-list">
			{#each docLinks as item (item.href)}
				<li class="lab-card resource-card">
					<p class="mark">{item.source}</p>
					<h2>{item.title}</h2>
					<p class="lab-note">{item.detail}</p>
					<p class="resource-url">{item.href}</p>
					<a class="primary" href={item.href} target="_blank" rel="noopener noreferrer">
						Consulter
						<span class="resource-sr">{item.title}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
