<script lang="ts">
	import { n } from '$lib/sim/format';
	import type { Trial } from '$lib/sim/types';

	let {
		trials,
		onRestore,
		onClear
	}: {
		trials: Trial[];
		onRestore: (trial: Trial) => void;
		onClear: () => void;
	} = $props();

	let open = $state(false);
	let seen = $state(0);

	$effect(() => {
		if (trials.length > seen) open = true;
		seen = trials.length;
	});
</script>

<section class="trials" class:open>
	<header>
		<button type="button" class="text" aria-expanded={open} onclick={() => (open = !open)}>
			Essais enregistrés <span>{trials.length}</span>
		</button>
		{#if trials.length}
			<button type="button" class="text" onclick={onClear}>Effacer</button>
		{/if}
	</header>
	{#if open}
		{#if trials.length === 0}
			<p class="note">Enregistrez un instant pour comparer deux réglages côte à côte.</p>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Essai</th>
							<th>Coagulée</th>
							<th>Efficacité</th>
							<th>Décantée</th>
							<th>Filtrée</th>
							<th>pH</th>
							<th>LSI</th>
							<th>Cl</th>
							<th>Réservoir</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each trials as trial (trial.id)}
							<tr>
								<th scope="row">{trial.label}</th>
								<td>{n(trial.coagTurbidity, 1)}</td>
								<td>{n(trial.coagEfficiency, 0)} %</td>
								<td>{n(trial.settledTurbidity, 1)}</td>
								<td>{n(trial.deliveredTurbidity, 2)}</td>
								<td>{n(trial.ph, 2)}</td>
								<td>{n(trial.lsi, 2)}</td>
								<td>{n(trial.chlorine, 2)}</td>
								<td>{n(trial.reservoirRatio * 100, 0)} %</td>
								<td><button type="button" class="text" onclick={() => onRestore(trial)}>Réappliquer</button></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</section>
