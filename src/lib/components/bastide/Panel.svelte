<script lang="ts">
	import Slider from '$lib/components/Slider.svelte';
	import { factNumber } from '$lib/bastide/catalog';
	import { lessons } from '$lib/bastide/catalog';
	import type { Accumulators, Evaluation, Settings, StageId } from '$lib/bastide/types';
	import { STAGES } from '$lib/bastide/types';
	import { n } from '$lib/sim/format';

	let {
		settings = $bindable(),
		acc = $bindable(),
		evaluation,
		selected,
		onLesson
	}: {
		settings: Settings;
		acc: Accumulators;
		evaluation: Evaluation;
		selected: StageId;
		onLesson: () => void;
	} = $props();

	const meta = $derived(STAGES.find((stage) => stage.id === selected) ?? STAGES[0]);
	const result = $derived(evaluation.stages.find((stage) => stage.id === selected) ?? evaluation.stages[0]);
	const lesson = $derived(lessons[selected]);
	const unitM3 = factNumber('tank-unit-m3');
	const nominalM3h = factNumber('production-mean-m3h');
	const phPractice = factNumber('ph-practice');
	const statusText = { ok: 'Satisfaisant', watch: 'Vigilance', fail: 'À revoir' };

	const fill = $derived(Math.min(100, (evaluation.tankM3 / Math.max(evaluation.tankCapacityM3, 1)) * 100));
	const perTank = $derived(settings.tanksOnline === 2 ? evaluation.tankM3 / 2 : evaluation.tankM3);

	function pair(label: string, before: string, after: string) {
		return { label, before, after };
	}

	const rows = $derived.by(() => {
		const before = result.before;
		const after = result.after;
		const turb = (value: number) => `${n(value, value < 10 ? 2 : 0)} NTU`;
		return [
			pair('Débit', `${n(before.flowM3h, 0)} m³/h`, `${n(after.flowM3h, 0)} m³/h`),
			pair('Turbidité', turb(before.turbidityNtu), turb(after.turbidityNtu)),
			pair('pH', n(before.ph, 2), n(after.ph, 2)),
			pair('Matières en suspension', `${n(before.ssMgL, 1)} mg/L`, `${n(after.ssMgL, 1)} mg/L`),
			pair('Matières grossières', n(before.debris, 0), n(after.debris, 0)),
			pair('Charge organique', n(before.organic, 0), n(after.organic, 0)),
			pair('Risque microbiologique', n(before.microbial, 0), n(after.microbial, 0)),
			pair('Chlore', `${n(before.chlorineMgL, 2)} mg/L`, `${n(after.chlorineMgL, 2)} mg/L`)
		];
	});

	function setTanks(count: 1 | 2) {
		settings.tanksOnline = count;
		acc.tankM3 = Math.min(acc.tankM3, unitM3 * count);
	}
</script>

<aside class="inspector" aria-label="Réglages de l’étape sélectionnée">
	<header class="inspector-head">
		<p class="kicker">{meta.index} · {statusText[result.status]}</p>
		<h2>{meta.title}</h2>
		<p class="lede">{lesson.objective}</p>
		<p class="note">{result.note}</p>
	</header>

	<section>
		<h3>Avant / après</h3>
		<dl class="readout">
			{#each rows as row (row.label)}
				<div>
					<dt>{row.label}</dt>
					<dd>{row.before} → {row.after}</dd>
				</div>
			{/each}
		</dl>
		<p class="note">Confiance du modèle pédagogique : {n(result.after.confidence * 100, 0)} %. Les grandeurs sans mesure de La Bastide restent des hypothèses.</p>
	</section>

	<section>
		<h3>Réglages</h3>
		{#if selected === 'intake'}
			<Slider numeric label="Part de Vienne" bind:value={settings.vienneSharePct} min={0} max={100} step={5} unit="%" />
			<Slider numeric label="Débit capté" bind:value={settings.intakeFlowM3h} min={100} max={2500} step={10} unit="m³/h" />
			<Slider numeric label="Écart de turbidité" bind:value={settings.rawTurbidityAddNtu} min={0} max={100} step={1} unit="NTU" />
			<Slider numeric label="Écart de température" bind:value={settings.rawTempOffsetC} min={-8} max={8} step={0.5} digits={1} unit="°C" />
			<Slider numeric label="Écart de pH" bind:value={settings.rawPhOffset} min={-1.5} max={1.5} step={0.1} digits={1} />
			<Slider numeric label="Écart de charge organique" bind:value={settings.rawOrganicAdd} min={0} max={50} step={1} />
		{:else if selected === 'screen'}
			<Slider numeric label="Efficacité du dégrillage" bind:value={settings.screenOpenPct} min={0} max={100} step={5} unit="%" />
		{:else if selected === 'coagulation'}
			<Slider
				numeric
				label="Chlorure ferrique"
				bind:value={settings.ferricMgL}
				min={0}
				max={60}
				step={0.5}
				digits={1}
				unit="mg/L"
				mark={evaluation.optimalFerricMgL <= 60
					? { at: evaluation.optimalFerricMgL, label: 'Repère illustratif' }
					: null}
			/>
			<Slider numeric label="Chaux de coagulation" bind:value={settings.limeCoagMgL} min={0} max={40} step={0.5} digits={1} unit="mg/L" />
			<Slider numeric label="Polyamine" bind:value={settings.polyamineMgL} min={0} max={2} step={0.05} digits={2} unit="mg/L" />
			<div class="inline-choices" role="group" aria-label="Traitement d’urgence pédagogique">
				<button type="button" class="ghost" aria-pressed={settings.preOzone} onclick={() => (settings.preOzone = !settings.preOzone)}>
					Pré-ozonation
				</button>
			</div>
			<Slider numeric label="Charbon actif en poudre" bind:value={settings.pacMgL} min={0} max={40} step={1} unit="mg/L" />
			<p class="note">Ces doses d’urgence sont pédagogiques. Le rapport cite la pré-ozone et le charbon en poudre, sans en donner les consignes.</p>
		{:else if selected === 'settling'}
			<Slider numeric label="Temps de séjour" bind:value={settings.settlingHours} min={0.3} max={4} step={0.1} digits={1} unit="h" />
			<Slider numeric label="Débit de filière" bind:value={settings.plantFlowM3h} min={100} max={2500} step={10} unit="m³/h" />
			<p class="note">
				Charge hydraulique {n(evaluation.hydraulicLoad, 2)} fois {n(nominalM3h, 0)} m³/h, moyenne calculée à partir de 30 000 m³/j. Ce n’est pas un débit de pointe mesuré.
			</p>
		{:else if selected === 'sand'}
			<Slider numeric label="Débit de filtration" bind:value={settings.sandFlowM3h} min={100} max={2500} step={10} unit="m³/h" />
			<Slider numeric label="Colmatage du filtre" bind:value={acc.sandState} min={0} max={100} step={1} unit="/ 100" />
			<button type="button" class="ghost" onclick={() => (acc.sandState = 8)}>Lavage pédagogique</button>
			<p class="note">Le lavage remet un filtre peu colmaté pour l’exercice. Aucune fréquence réelle de La Bastide n’est utilisée.</p>
		{:else if selected === 'ozone'}
			<Slider numeric label="Dose d’ozone" bind:value={settings.ozoneMgL} min={0} max={4} step={0.1} digits={1} unit="mg/L" />
			<Slider numeric label="Temps de contact" bind:value={settings.ozoneContactMin} min={1} max={20} step={0.5} digits={1} unit="min" />
		{:else if selected === 'carbon'}
			<Slider numeric label="Saturation du charbon" bind:value={acc.carbonState} min={0} max={100} step={1} unit="/ 100" />
			<button type="button" class="ghost" onclick={() => (acc.carbonState = 8)}>Renouveler la charge</button>
			<p class="note">Le renouvellement est un geste pédagogique, pas un calendrier d’exploitation. Le charbon cité vient de coques de noix de coco.</p>
		{:else if selected === 'uv'}
			<Slider numeric label="Intensité UV" bind:value={settings.uvIntensityPct} min={0} max={100} step={5} unit="%" />
			<Slider numeric label="État de la lampe" bind:value={settings.lampPct} min={0} max={100} step={5} unit="%" />
		{:else if selected === 'remineralization'}
			<Slider numeric label="Chaux" bind:value={settings.reminLimeMgL} min={0} max={80} step={1} unit="mg/L" />
			<Slider numeric label="CO₂" bind:value={settings.reminCo2MgL} min={0} max={80} step={1} unit="mg/L" />
			<p class="note">Cette étape est distincte de la soude. L’indice de Langelier affiché plus haut dans la note est pédagogique.</p>
		{:else if selected === 'finish'}
			<Slider numeric label="Soude" bind:value={settings.sodaMgL} min={0} max={40} step={0.5} digits={1} unit="mg/L" />
			<Slider numeric label="Chlore" bind:value={settings.chlorineMgL} min={0} max={2} step={0.05} digits={2} unit="mg/L" />
			<p class="note">
				Le rapport cite un ajustement vers {n(phPractice, 1)}. Ce repère n’est pas une limite, et la bande de chlore 0,10 à 0,40 mg/L est pédagogique.
			</p>
		{:else}
			<Slider numeric label="Demande du réseau" bind:value={settings.demandM3h} min={50} max={2000} step={10} unit="m³/h" />
			<div class="inline-choices" role="group" aria-label="Cuves en service">
				<button type="button" class="ghost" aria-pressed={settings.tanksOnline === 1} onclick={() => setTanks(1)}>Une cuve</button>
				<button type="button" class="ghost" aria-pressed={settings.tanksOnline === 2} onclick={() => setTanks(2)}>Deux cuves</button>
			</div>
			<div class="tank-row" aria-label="Niveau des cuves">
				{#each [0, 1] as index (index)}
					{@const online = settings.tanksOnline === 2 || index === 0}
					{@const volume = online ? perTank : 0}
					<div class="tank" class:offline={!online}>
						<div class="tank-body" aria-hidden="true">
							<div class="tank-fill" style:height={online && settings.tanksOnline === 2 ? `${fill}%` : online ? `${fill}%` : '0%'}></div>
						</div>
						<strong>Cuve {index + 1}</strong>
						<span>{online ? `${n(volume, 0)} / ${n(unitM3, 0)} m³` : 'Hors service'}</span>
					</div>
				{/each}
			</div>
			<p class="note">
				{n(unitM3, 0)} m³ × {factNumber('tank-count')} = {n(unitM3 * factNumber('tank-count'), 0)} m³.
				En service : {n(evaluation.tankCapacityM3, 0)} m³, dont {n(evaluation.tankM3, 0)} m³ stockés.
				Chlore après séjour : {n(evaluation.networkChlorineMgL, 2)} mg/L.
			</p>
		{/if}
	</section>

	<section>
		<h3>Réactifs pédagogiques</h3>
		<p class="note">
			Indice {n(evaluation.reagentScore, 0)}. Consommation relative {n(evaluation.reagentGh, 0)}, produit de l’indice par le débit. Ni un coût, ni un bilan de La Bastide.
		</p>
		<button type="button" class="text" onclick={onLesson}>Fiche de l’étape</button>
	</section>
</aside>
