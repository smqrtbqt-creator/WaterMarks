<script lang="ts">
	import { n } from '$lib/sim/format';
	import type { Trial } from '$lib/bastide/types';

	let {
		trials,
		onRestore,
		onClear
	}: {
		trials: Trial[];
		onRestore: (trial: Trial) => void;
		onClear: () => void;
	} = $props();

	let open = $state(true);
	let picked = $state<number[]>([]);

	const pair = $derived.by(() => {
		const chosen = picked
			.map((id) => trials.find((trial) => trial.id === id))
			.filter((trial): trial is Trial => Boolean(trial));
		if (chosen.length === 2) return chosen;
		if (trials.length >= 2) return [trials[trials.length - 2], trials[trials.length - 1]];
		return [];
	});

	function toggle(id: number) {
		if (picked.includes(id)) picked = picked.filter((item) => item !== id);
		else picked = [...picked, id].slice(-2);
	}

	function gap(left: number, right: number, digits: number, unit: string) {
		const delta = right - left;
		const sign = delta > 0 ? '+' : '';
		return `${sign}${n(delta, digits)} ${unit}`;
	}
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
			<p class="note">Lancez un essai, enregistrez-le, changez des réglages, puis comparez.</p>
		{:else}
			<div class="table-wrap">
				<table>
					<caption>Essais du scénario en cours</caption>
					<thead>
						<tr>
							<th scope="col">Comparer</th>
							<th scope="col">Essai</th>
							<th scope="col">Turbidité</th>
							<th scope="col">pH</th>
							<th scope="col">Chlore</th>
							<th scope="col">Risque</th>
							<th scope="col">Réactifs</th>
							<th scope="col">Écarts pédagogiques</th>
							<th scope="col"></th>
						</tr>
					</thead>
					<tbody>
						{#each trials as trial (trial.id)}
							<tr>
								<td>
									<input
										type="checkbox"
										checked={picked.includes(trial.id)}
										aria-label={`Comparer ${trial.label}`}
										onchange={() => toggle(trial.id)}
									/>
								</td>
								<th scope="row">{trial.label}</th>
								<td>{n(trial.turbidityNtu, 2)} NTU</td>
								<td>{n(trial.ph, 2)}</td>
								<td>{n(trial.chlorineMgL, 2)} mg/L</td>
								<td>{n(trial.microbial, 0)}</td>
								<td>{n(trial.reagentScore, 0)}</td>
								<td>{trial.failures.length ? trial.failures.join(', ') : 'aucun'}</td>
								<td><button type="button" class="text" onclick={() => onRestore(trial)}>Réappliquer</button></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if pair.length === 2}
				{@const first = pair[0]}
				{@const second = pair[1]}
				{@const appeared = second.failures.filter((item) => !first.failures.includes(item))}
				{@const cleared = first.failures.filter((item) => !second.failures.includes(item))}
				<div class="compare-gap">
					<h3>Écart de {second.label} par rapport à {first.label}</h3>
					<ul>
						<li>Turbidité : {gap(first.turbidityNtu, second.turbidityNtu, 2, 'NTU')}</li>
						<li>pH : {gap(first.ph, second.ph, 2, '')}</li>
						<li>Chlore après séjour : {gap(first.chlorineMgL, second.chlorineMgL, 2, 'mg/L')}</li>
						<li>Risque microbiologique : {gap(first.microbial, second.microbial, 0, '')}</li>
						<li>Indice de réactifs : {gap(first.reagentScore, second.reagentScore, 0, '')}</li>
						<li>Consommation relative : {gap(first.reagentGh, second.reagentGh, 0, '')}</li>
					</ul>
					<p class="note">
						{#if appeared.length}Nouveaux écarts : {appeared.join(', ')}. {/if}
						{#if cleared.length}Écarts levés : {cleared.join(', ')}. {/if}
						{#if !appeared.length && !cleared.length}
							{second.failures.length ? `Mêmes écarts : ${second.failures.join(', ')}.` : 'Aucun écart pédagogique sur ces deux essais.'}
						{/if}
					</p>
				</div>
			{/if}
		{/if}
	{/if}
</section>
