<script lang="ts">
	import { base } from '$app/paths';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import { tpDocuments } from '$lib/tpDocuments';
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

	<section class="brief">
		<div>
			<h2>Fiches et protocoles</h2>
			<p>Fiches, protocoles et autres documents utilisés pendant les séances.</p>
		</div>
	</section>

	{#if tpDocuments.length === 0}
		<p class="lab-note">Aucun document de TP pour le moment.</p>
	{:else}
		<ul class="resource-list">
			{#each tpDocuments as item (item.href)}
				<li class="lab-card resource-card">
					<h2>{item.title}</h2>
					{#if item.detail}
						<p class="lab-note">{item.detail}</p>
					{/if}
					<a class="primary" href={item.href.startsWith('/') ? `${base}${item.href}` : item.href} target="_blank" rel="noopener noreferrer">
						Ouvrir
						<span class="resource-sr">{item.title}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
