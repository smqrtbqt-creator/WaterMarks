<script lang="ts">
	import { base } from '$app/paths';
	import { docLinks } from '$lib/links';
	import { tpDocuments } from '$lib/tpDocuments';

	function hrefOf(href: string) {
		return href.startsWith('/') ? `${base}${href}` : href;
	}
</script>

<section class="brief">
	<div>
		<h2>Tous les documents</h2>
		<p>Fiches, modèles et données des séances. Chaque bouton ouvre le document.</p>
	</div>
</section>

<ul class="resource-list">
	{#each tpDocuments as item (item.href)}
		<li class="lab-card resource-card">
			<h2>{item.title}</h2>
			{#if item.detail}
				<p class="lab-note">{item.detail}</p>
			{/if}
			<a class="primary" href={hrefOf(item.href)} target="_blank" rel="noopener noreferrer">
				Ouvrir
				<span class="resource-sr">{item.title}</span>
			</a>
		</li>
	{/each}
	{#each docLinks as item (item.href)}
		<li class="lab-card resource-card">
			<p class="mark">{item.source}</p>
			<h2>{item.title}</h2>
			<p class="lab-note">{item.detail}</p>
			<a class="primary" href={item.href} target="_blank" rel="noopener noreferrer">
				Télécharger
				<span class="resource-sr">{item.title}</span>
			</a>
		</li>
	{/each}
</ul>
