<script lang="ts">
	import { base } from '$app/paths';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import { gemeauDocs, gemeauParts } from '$lib/gemeau';

	function hrefOf(href: string) {
		return href.startsWith('/') ? `${base}${href}` : href;
	}
</script>

<svelte:head>
	<title>BTSA GEMEAU 1</title>
</svelte:head>

<div class="app tp-docs">
	<header class="top">
		<div class="brand">
			<p class="mark">BTSA GEMEAU · 1re année</p>
			<h1>Qualité de l’eau et chimie des solutions</h1>
			<ProjectSwitch current="gemeau" />
		</div>
	</header>

	<p class="lede">
		Progression de la classe. Chaque ligne est une notion à travailler. Cette page ne fixe pas de seuil réglementaire.
	</p>

	{#each gemeauParts as part (part.id)}
		<section class="gemeau-part" aria-labelledby="gemeau-{part.id}">
			<h2 id="gemeau-{part.id}">{part.id}. {part.title}</h2>
			<ul>
				{#each part.items as item (item)}
					<li>{item}</li>
				{/each}
			</ul>
			{#each gemeauDocs.filter((doc) => doc.partId === part.id) as doc (doc.href)}
				<article class="gemeau-doc">
					<h3>{doc.title}</h3>
					<p>{doc.detail}</p>
					<a class="primary" href={hrefOf(doc.href)} target="_blank" rel="noopener noreferrer">
						Ouvrir
						<span class="resource-sr">{doc.title}</span>
					</a>
				</article>
			{/each}
		</section>
	{/each}
</div>
