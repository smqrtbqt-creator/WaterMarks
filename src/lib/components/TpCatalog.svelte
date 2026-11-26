<script lang="ts">
	import { base } from '$app/paths';
	import { docLinks } from '$lib/links';
	import { themeOrder, tpDocuments } from '$lib/tpDocuments';

	function hrefOf(href: string) {
		return href.startsWith('/') ? `${base}${href}` : href;
	}

	type Card = {
		theme: string;
		title: string;
		detail: string;
		href: string;
		mark: string;
	};

	const groups = $derived.by(() => {
		const cards: Card[] = [
			...tpDocuments.map((item) => ({
				theme: item.theme,
				title: item.title,
				detail: item.detail,
				href: item.href,
				mark: item.classe
			})),
			...docLinks.map((item) => ({
				theme: item.theme,
				title: item.title,
				detail: item.detail,
				href: item.href,
				mark: item.source === item.theme ? '' : item.source
			}))
		];
		const order = [...themeOrder];
		for (const card of cards) {
			if (!order.includes(card.theme)) order.push(card.theme);
		}
		return order
			.map((theme) => ({ theme, items: cards.filter((card) => card.theme === theme) }))
			.filter((group) => group.items.length > 0);
	});
</script>

<section class="brief">
	<div>
		<h2>Tous les documents</h2>
		<p>Fiches, modèles et données, rangés par thème. Chaque bouton ouvre le document.</p>
	</div>
</section>

{#each groups as group (group.theme)}
	<section class="tp-class" aria-label={group.theme}>
		<h2>{group.theme}</h2>
		<ul class="resource-list">
			{#each group.items as item (item.href)}
				<li class="lab-card resource-card">
					{#if item.mark}
						<p class="mark">{item.mark}</p>
					{/if}
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
