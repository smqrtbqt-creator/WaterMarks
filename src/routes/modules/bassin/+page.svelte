<script lang="ts">
	import { base } from '$app/paths';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import { n } from '$lib/sim/format';
	import { NITRATE_REFERENCE_MG_L, PLACES, sample, type PlaceId, type WeatherId } from '$lib/modules/watershed';

	let weather = $state<WeatherId>('sec');
	let selected = $state<PlaceId>('confluence');
	let log = $state<{ place: string; weather: string; nitrate: number; turbidity: number }[]>([]);

	const place = $derived(PLACES.find((item) => item.id === selected) ?? PLACES[0]);
	const reading = $derived(sample(place, weather));
	const weatherLabel = $derived(weather === 'sec' ? 'Temps sec' : weather === 'pluie' ? 'Pluie' : 'Après épandage');

	function take() {
		log = [
			{ place: place.name, weather: weatherLabel, nitrate: reading.nitrate, turbidity: reading.turbidity },
			...log
		].slice(0, 8);
	}
</script>

<svelte:head>
	<title>Bassin versant</title>
</svelte:head>

<div class="app modules">
	<header class="top">
		<div class="brand">
			<p class="mark">Module · sans quiz</p>
			<h1>Prélèvement</h1>
			<ProjectSwitch current="modules" />
		</div>
	</header>

	<div class="weather" role="group" aria-label="Météo du bassin">
		{#each [
			['sec', 'Temps sec'],
			['pluie', 'Pluie'],
			['epandage', 'Après épandage']
		] as item (item[0])}
			<button type="button" class="ghost" aria-pressed={weather === item[0]} onclick={() => (weather = item[0] as WeatherId)}>
				{item[1]}
			</button>
		{/each}
	</div>

	<div class="module-layout">
		<div class="catchment">
			<svg viewBox="0 0 820 460" aria-hidden="true">
				<rect width="820" height="460" fill="#07161c" rx="16" />
				<path d="M90 90 C180 140 200 200 250 230 C300 250 360 250 430 290 C520 340 600 340 760 360" fill="none" stroke="#1d6d8a" stroke-width="16" stroke-linecap="round" />
				<path d="M250 230 C340 180 400 160 470 160" fill="none" stroke="#1d6d8a" stroke-width="10" stroke-linecap="round" />
			</svg>
			{#each PLACES as item (item.id)}
				<button
					type="button"
					class="sample-point"
					style:left="{(item.x / 820) * 100}%"
					style:top="{(item.y / 460) * 100}%"
					aria-pressed={selected === item.id}
					onclick={() => (selected = item.id)}
				>
					{item.name}
				</button>
			{/each}
		</div>

		<div class="module-panel">
			<p class="mark">{place.where}</p>
			<h2>{place.name}</h2>
			<p>{weatherLabel}. Valeurs simulées pour voir que le lieu et la météo changent le prélèvement.</p>
			<dl class="readout">
				<div><dt>Nitrates</dt><dd>{n(reading.nitrate, 0)} mg/L</dd></div>
				<div><dt>Turbidité</dt><dd>{n(reading.turbidity, 1)} NTU</dd></div>
				<div><dt>Conductivité</dt><dd>{n(reading.conductivity, 0)} µS/cm</dd></div>
			</dl>
			<p>
				{#if reading.nitrate > NITRATE_REFERENCE_MG_L}
					Les nitrates simulés dépassent 50 mg/L.
				{:else}
					Les nitrates simulés sont sous 50 mg/L.
				{/if}
				Cette valeur de 50 mg/L est la limite de l’eau destinée à la consommation humaine. Un prélèvement de rivière ne dit pas que l’eau est potable.
			</p>
			<button type="button" class="primary" onclick={take}>Noter ce prélèvement</button>
			{#if log.length}
				<ul class="sample-log">
					{#each log as row, index (index)}
						<li>{row.place} · {row.weather} · {n(row.nitrate, 0)} mg/L NO₃ · {n(row.turbidity, 1)} NTU</li>
					{/each}
				</ul>
			{/if}
			<p class="disclaimer">Un seul point ne décrit pas le bassin. La pluie augmente ici la turbidité et dilue les nitrates. L’épandage relève les nitrates du ruisseau agricole.</p>
			<p><a href="{base}/modules">Retour aux modules</a></p>
		</div>
	</div>
</div>
