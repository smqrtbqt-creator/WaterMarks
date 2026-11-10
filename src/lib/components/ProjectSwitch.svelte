<script lang="ts">
	import { base } from '$app/paths';

	let { current = '' }: { current?: string } = $props();

	const links = [
		{ id: 'tp', href: `${base}/tp`, label: 'TP' },
		{ id: 'modules', href: `${base}/modules`, label: 'Modules' },
		{ id: 'home', href: `${base}/`, label: 'Rivière Blanche' },
		{ id: 'bastide', href: `${base}/bastide`, label: 'La Bastide' },
		{ id: 'desinfection', href: `${base}/desinfection`, label: 'Désinfection' },
		{ id: 'laboratoire', href: `${base}/laboratoire`, label: 'Laboratoire' },
		{ id: 'info', href: `${base}/info-agricole/`, label: 'Information agricole' },
		{ id: 'redox', href: `${base}/redox/`, label: 'Redox' },
		{ id: 'alcalinite', href: `${base}/alcalinite/`, label: 'Alcalinité' },
		{ id: 'forage', href: `${base}/alcalinite/equilibre`, label: 'Filière forage' },
		{ id: 'liens', href: `${base}/liens`, label: 'Liens' },
		{ id: 'secours', href: `${base}/secours-info/`, label: 'Premiers secours' }
	];
</script>

<p class="plant-switch">
	{#each links as link (link.id)}
		{#if !(current === 'home' && link.id === 'home')}
			<a href={link.href} aria-current={link.id === current ? 'page' : undefined}>
				{current === 'home' && link.id === 'bastide' ? 'La Bastide, Limoges' : link.label}
			</a>
		{/if}
	{/each}
</p>
