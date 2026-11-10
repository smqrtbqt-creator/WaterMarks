<script lang="ts">
	import { base } from '$app/paths';
	import HeroChip from '$lib/components/HeroChip.svelte';
	import RoleAlert from '$lib/components/RoleAlert.svelte';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import { ENIGMAS } from '$lib/game/flaque';
	import { flaque } from '$lib/game/flaque.svelte';
	import { n } from '$lib/sim/format';
	import { NITRATE_REFERENCE_MG_L, PLACES, sample, type PlaceId, type WeatherId } from '$lib/modules/watershed';

	let weather = $state<WeatherId>('sec');
	let selected = $state<PlaceId>('confluence');
	let log = $state<{ place: string; weather: string; nitrate: number; turbidity: number }[]>([]);

	const place = $derived(PLACES.find((item) => item.id === selected) ?? PLACES[0]);
	const reading = $derived(sample(place, weather));
	const weatherLabel = $derived(weather === 'sec' ? 'Temps sec' : weather === 'pluie' ? 'Pluie' : 'Après épandage');
	const enigma = ENIGMAS.find((item) => item.id === 'ruisseau');
	const alertLine = $derived.by(() => {
		if (weather === 'pluie') {
			return `Il pleut sur ${place.name}. Turbidité ${n(reading.turbidity, 1)} NTU, nitrates ${n(reading.nitrate, 0)} mg/L. L’eau se trouble et les nitrates se diluent.`;
		}
		if (weather === 'epandage' && place.id === 'champ' && reading.nitrate > NITRATE_REFERENCE_MG_L) {
			return `Le ruisseau des champs est à ${n(reading.nitrate, 0)} mg/L. C’est au-dessus de 50, la limite de l’eau destinée à la consommation. Ce prélèvement ne dit pas que la rivière est potable.`;
		}
		if (weather === 'epandage') return `L’épandage ne charge pas ${place.name}. Seul le ruisseau des champs encaisse les nitrates.`;
		if (place.id === 'confluence') return 'Tu es pile à la jonction. Les deux cours d’eau se rencontrent ici, pas avant.';
		if (place.id === 'aval') return 'C’est le point le plus bas, avant la prise d’eau. Un seul prélèvement ne décrit pas le bassin.';
		if (place.id === 'champ') return `Temps sec, et ce nom ne désigne que ce trait : ${n(reading.nitrate, 0)} mg/L de nitrates sur le ruisseau des champs.`;
		return `La source, en forêt : ${n(reading.nitrate, 0)} mg/L. L’amont est encore calme.`;
	});

	function take() {
		log = [
			{ place: place.name, weather: weatherLabel, nitrate: reading.nitrate, turbidity: reading.turbidity },
			...log
		].slice(0, 8);
		if (weather === 'epandage' && place.id === 'champ' && reading.nitrate > NITRATE_REFERENCE_MG_L) {
			flaque.solve('ruisseau');
		}
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
			<HeroChip />
		</div>
	</header>

	<RoleAlert speaker="Noé Berges" role="Garde du bassin" line={alertLine} />

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
				<path d="M40 230 L480 270" fill="none" stroke="#1d6d8a" stroke-width="12" stroke-linecap="round" />
				<path d="M120 40 L280 120 L480 270" fill="none" stroke="#1d6d8a" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M480 270 L640 370 L780 444" fill="none" stroke="#1d6d8a" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
			{#each PLACES as item (item.id)}
				<button
					type="button"
					class="sample-point"
					data-side={item.side}
					style:left="{(item.x / 820) * 100}%"
					style:top="{(item.y / 460) * 100}%"
					aria-pressed={selected === item.id}
					onclick={() => (selected = item.id)}
				>
					<span class="sample-name">{item.name}</span>
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
			<p class="enigma-line">
				{enigma?.ask}
				{flaque.save.solved.includes('ruisseau') ? ` Objet : ${enigma?.itemName}.` : ''}
			</p>
			<p class="disclaimer">Un seul point ne décrit pas le bassin. La pluie augmente ici la turbidité et dilue les nitrates. L’épandage relève les nitrates du ruisseau des champs.</p>
			<p><a href="{base}/modules">Retour aux modules</a></p>
		</div>
	</div>
</div>
