<script lang="ts">
	import Slider from '$lib/components/Slider.svelte';
	import { turbidityColor } from '$lib/sim/chemistry';
	import type { Simulation } from '$lib/simulator/engine';
	import { MODULES, MOLECULES } from '$lib/simulator/treatments';
	import { MODULE_ORDER, type ModuleId, type TrainSettings } from '$lib/simulator/types';

	let {
		settings = $bindable(),
		simulation,
		running,
		reduced,
		activeId,
		showSource
	}: {
		settings: TrainSettings;
		simulation: Simulation;
		running: boolean;
		reduced: boolean;
		activeId: ModuleId | null;
		showSource: boolean;
	} = $props();

	let selected = $state<ModuleId | 'control'>('oxidation');
	const info = $derived(selected === 'control' ? null : MODULES[selected]);

	function toggle(id: ModuleId) {
		settings.enabled = { ...settings.enabled, [id]: !settings.enabled[id] };
	}

	function tint(water: Simulation['profile'][number]['water']) {
		return turbidityColor(water.turbidityNtu + water.ironDissolvedMgL * 5 + water.ironParticulateMgL * 8);
	}
</script>

<section class="panel lab-card lab-plant" aria-labelledby="lab-plant-title">
	<p class="mark">Zone C · station</p>
	<h2 id="lab-plant-title">Filière à composer</h2>
	<p class="lab-note">Activez seulement les étapes utiles. L’eau traverse les étapes en service dans l’ordre hydraulique.</p>
	<div class="lab-flow" class:is-running={running && !reduced} role="group" aria-label="Modules de traitement">
		{#each MODULE_ORDER as id, index (id)}
			<div class="lab-step" class:on={settings.enabled[id]} class:hot={activeId === id}>
				<button type="button" aria-pressed={selected === id} onclick={() => (selected = id)}>{MODULES[id].short}</button>
				<button type="button" class="lab-switch" aria-pressed={settings.enabled[id]} onclick={() => toggle(id)}>
					{settings.enabled[id] ? 'En service' : 'Arrêt'}
				</button>
			</div>
			<span class="lab-pipe" aria-hidden="true"><i></i></span>
			{#if index === MODULE_ORDER.length - 1}
				<div class="lab-step on" class:hot={running && !reduced && activeId === null}>
					<button type="button" aria-pressed={selected === 'control'} onclick={() => (selected = 'control')}>Contrôle</button>
				</div>
			{/if}
		{/each}
	</div>
	<div class="lab-profile" aria-hidden="true">
		{#each simulation.profile as point (point.id)}
			<span style:background={tint(point.water)} title={point.title}></span>
		{/each}
	</div>
	<p class="lab-note">Chaque pastille est la teinte calculée après une étape en service. Animation en pause si vous la coupez ou si les animations sont réduites.</p>

	{#if showSource}
		<label class="lab-check">
			<input type="checkbox" bind:checked={settings.sourceInvestigated} />
			La recherche de l’origine de la contamination est engagée
		</label>
	{/if}

	{#if selected === 'control'}
		<div class="lab-detail">
			<h3>Contrôle final</h3>
			<p>Lecture de l’eau de sortie. Cette étape ne traite rien et ne conclut pas à la potabilité.</p>
		</div>
	{:else if info}
		<div class="lab-detail">
			<h3>{info.title}</h3>
			<p>{info.principle}</p>
			<div class="lab-controls">
				{#if selected === 'aeration'}
					<Slider label="Intensité" min={0} max={100} step={5} bind:value={settings.airIntensity} />
					<Slider label="Temps de contact" min={0} max={40} step={1} unit="min" bind:value={settings.airContactMin} />
					<Slider label="Débit d’air" min={0} max={200} step={5} unit="m³/h" bind:value={settings.airFlow} />
				{:else if selected === 'neutralization'}
					<label>Réactif
						<select bind:value={settings.neutralReagent}>
							<option value="soda">Soude</option>
							<option value="lime">Chaux</option>
							<option value="calcite">Calcaire</option>
						</select>
					</label>
					<Slider label="Dose ou contact" min={0} max={80} step={1} unit="mg/L ou min" numeric bind:value={settings.neutralDose} />
					<Slider label="pH cible" min={6.2} max={8.6} step={0.1} digits={1} bind:value={settings.neutralTargetPh} />
				{:else if selected === 'oxidation'}
					<label>Oxydant
						<select bind:value={settings.oxidant}>
							<option value="chlorine">Chlore</option>
							<option value="permanganate">Permanganate</option>
							<option value="ozone">Ozone</option>
						</select>
					</label>
					<Slider label="Dose" min={0} max={8} step={0.1} digits={1} unit="mg/L" numeric bind:value={settings.oxidantDose} />
					<Slider label="Temps de contact" min={0} max={60} step={1} unit="min" bind:value={settings.oxidantContactMin} />
				{:else if selected === 'coagulation'}
					<label>Coagulant
						<select bind:value={settings.coagulant}>
							<option value="alum">Sulfate d’alumine</option>
							<option value="ferric">Chlorure ferrique</option>
						</select>
					</label>
					<Slider label="Dose" min={0} max={80} step={1} unit="mg/L" numeric bind:value={settings.coagulantDose} />
					<Slider label="Mélange" min={0} max={100} step={5} bind:value={settings.coagMix} />
					<Slider label="Temps de contact" min={0} max={40} step={1} unit="min" bind:value={settings.coagContactMin} />
				{:else if selected === 'settling'}
					<Slider label="Temps de séjour" min={0} max={90} step={1} unit="min" bind:value={settings.settlingMin} />
				{:else if selected === 'filtration'}
					<label>Média
						<select bind:value={settings.filterMedia}>
							<option value="sand">Sable</option>
							<option value="manganese">Sable manganifère</option>
							<option value="dual">Bicouche</option>
							<option value="bio">Biologique</option>
						</select>
					</label>
					<Slider label="Vitesse" min={2} max={20} step={1} unit="m/h" bind:value={settings.filterRate} />
					<Slider label="Encrassement" min={0} max={100} step={5} unit="%" bind:value={settings.filterState} />
				{:else if selected === 'remineralization'}
					<label>Voie
						<select bind:value={settings.reminMedia}>
							<option value="lime-co2">Chaux et CO₂</option>
							<option value="calcite">Calcaire de contact</option>
						</select>
					</label>
					{#if settings.reminMedia === 'lime-co2'}
						<Slider label="Chaux" min={0} max={80} step={1} unit="mg/L" numeric bind:value={settings.reminLime} />
						<Slider label="CO₂" min={0} max={80} step={1} unit="mg/L" numeric bind:value={settings.reminCo2} />
					{:else}
						<Slider label="Temps de contact" min={0} max={40} step={1} unit="min" bind:value={settings.reminContactMin} />
					{/if}
				{:else if selected === 'softening'}
					<Slider label="Capacité restante" min={0} max={100} step={5} unit="%" bind:value={settings.softenerCapacity} />
					<button type="button" onclick={() => (settings.softenerCapacity = 100)}>Régénérer la résine</button>
				{:else if selected === 'nitrate'}
					<label>Technologie
						<select bind:value={settings.nitrateTech}>
							<option value="biological">Dénitrification biologique</option>
							<option value="resin">Résine sélective</option>
						</select>
					</label>
					<Slider label="Débit relatif" min={0} max={100} step={5} bind:value={settings.nitrateRate} />
					<Slider label="Capacité restante" min={0} max={100} step={5} unit="%" bind:value={settings.nitrateCapacity} />
				{:else if selected === 'carbon'}
					<label>Charbon
						<select bind:value={settings.carbonType}>
							<option value="gac">Grains</option>
							<option value="pac">Poudre</option>
						</select>
					</label>
					<label>Molécule
						<select bind:value={settings.moleculeId}>
							{#each Object.values(MOLECULES) as molecule}
								<option value={molecule.id}>{molecule.name}</option>
							{/each}
						</select>
					</label>
					<Slider label="Temps de contact" min={0} max={40} step={1} unit="min" bind:value={settings.carbonContactMin} />
					<Slider label="Saturation" min={0} max={100} step={5} unit="%" bind:value={settings.carbonSaturation} />
				{:else if selected === 'membrane'}
					<label>Type
						<select bind:value={settings.membrane}>
							<option value="uf">Ultrafiltration</option>
							<option value="nf">Nanofiltration</option>
							<option value="ro">Osmose inverse</option>
						</select>
					</label>
					<Slider label="Pression" min={0} max={16} step={0.5} digits={1} unit="bar" bind:value={settings.membranePressure} />
					<Slider label="Récupération" min={50} max={95} step={1} unit="%" bind:value={settings.membraneRecovery} />
				{:else if selected === 'ozone'}
					<Slider label="Dose" min={0} max={5} step={0.1} digits={1} unit="mg/L" numeric bind:value={settings.ozoneDose} />
					<Slider label="Temps de contact" min={0} max={30} step={1} unit="min" bind:value={settings.ozoneContactMin} />
					<Slider label="Transfert" min={0} max={100} step={5} unit="%" bind:value={settings.ozoneTransfer} />
				{:else if selected === 'uv'}
					<Slider label="Dose affichée" min={0} max={80} step={1} unit="mJ/cm²" bind:value={settings.uvDose} />
					<Slider label="Débit" min={5} max={200} step={5} unit="m³/h" bind:value={settings.uvFlow} />
				{:else if selected === 'chlorine'}
					<Slider label="Dose" min={0} max={5} step={0.1} digits={1} unit="mg/L" numeric bind:value={settings.chlorineDose} />
					<Slider label="Demande en chlore" min={0} max={4} step={0.1} digits={1} unit="mg/L" numeric bind:value={settings.chlorineDemand} />
					<Slider label="Temps de contact" min={0} max={90} step={1} unit="min" bind:value={settings.chlorineContactMin} />
				{:else}
					<p class="lab-note">Ce module n’a pas de dose. Il retire surtout les débris grossiers.</p>
				{/if}
			</div>
			<p class="lab-note">Plages pédagogiques, distinctes d’une consigne d’usine.</p>
		</div>
	{/if}
</section>
