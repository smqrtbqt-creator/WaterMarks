<script lang="ts">
	import { base } from '$app/paths';
	import { docLinks } from '$lib/links';
	import { tpDocuments, type TpDocument } from '$lib/tpDocuments';

	function hrefOf(href: string) {
		return href.startsWith('/') ? `${base}${href}` : href;
	}

	const groups = $derived.by(() => {
		const order: string[] = [];
		const byClass = new Map<string, TpDocument[]>();
		for (const item of tpDocuments) {
			const list = byClass.get(item.classe);
			if (list) list.push(item);
			else {
				byClass.set(item.classe, [item]);
				order.push(item.classe);
			}
		}
		return order.map((classe) => ({ classe, items: byClass.get(classe) ?? [] }));
	});
</script>

<section class="brief">
	<div>
		<h2>Tous les documents</h2>
		<p>Fiches, modèles et données, rangés par classe. Chaque bouton ouvre le document.</p>
	</div>
</section>

{#each groups as group (group.classe)}
	<section class="tp-class" aria-label={group.classe}>
		<h2>{group.classe}</h2>
		<ul class="resource-list">
			{#each group.items as item (item.href)}
				<li class="lab-card resource-card">
					<h3>{item.title}</h3>
					{#if item.detail}
						<p class="lab-note">{item.detail}</p>
					{/if}
					<a class="primary" href={hrefOf(item.href)} target="_blank" rel="noopener noreferrer">
						Ouvrir
						<span class="resource-sr">{item.title}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/each}

<section class="tp-class" aria-label="Données">
	<h2>Données</h2>
	<ul class="resource-list">
		{#each docLinks as item (item.href)}
			<li class="lab-card resource-card">
				<p class="mark">{item.source}</p>
				<h3>{item.title}</h3>
				<p class="lab-note">{item.detail}</p>
				<a class="primary" href={item.href} target="_blank" rel="noopener noreferrer">
					Télécharger
					<span class="resource-sr">{item.title}</span>
				</a>
			</li>
		{/each}
	</ul>
</section>
