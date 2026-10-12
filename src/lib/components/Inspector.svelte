<script lang="ts">
	import Chain from './Chain.svelte';
	import Slider from './Slider.svelte';
	import { COAGULANTS, turbidityColor } from '$lib/sim/chemistry';
	import { plant, UNITS } from '$lib/sim/catalog';
	import { formatClock, n } from '$lib/sim/format';
	import type { Accumulators, Evaluation, RawModifiers, Scenario, Settings, UnitId } from '$lib/sim/types';

	let {
		settings = $bindable(),
		evaluation,
		scenario,
		selected,
		acc,
		modifiers,
		onClose,
		onPurge,
		onBackwash,
		onToggleFlood,
		onToggleDegraded,
		onClearEvents,
		onSelect,
		samples
	}: {
		settings: Settings;
		evaluation: Evaluation;
		scenario: Scenario;
		selected: UnitId | null;
		acc: Accumulators;
		modifiers: RawModifiers;
		onClose: () => void;
		onPurge: () => void;
		onBackwash: () => void;
		onToggleFlood: () => void;
		onToggleDegraded: () => void;
		onClearEvents: () => void;
		onSelect: (id: UnitId) => void;
		samples: { hours: number; reservoirRatio: number; productionM3h: number; demandM3h: number }[];
	} = $props();

	const unit = $derived(UNITS.find((item) => item.id === selected) ?? null);
	const spec = $derived(COAGULANTS[settings.coagulant]);

	const chain = $derived([
		{ label: 'Brute', ntu: evaluation.rawTurbidityNtu },
		{ label: 'Coagulée', ntu: evaluation.coag.turbidityNtu },
		{ label: 'Décantée', ntu: evaluation.settling.turbidityNtu },
		{ label: 'Filtrée', ntu: evaluation.filter.turbidityNtu }
	]);

	const dots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
	const lsiPct = $derived(Math.min(100, Math.max(0, ((evaluation.remin.lsi + 2) / 3.4) * 100)));
	const goalLeft = $derived((( -0.2 + 2) / 3.4) * 100);
	const goalRight = $derived(((0.35 + 2) / 3.4) * 100);
</script>

<aside class="inspector" aria-label="Réglages de l’ouvrage">
	{#if !unit}
		<header class="inspector-head">
			<p class="kicker">Poste</p>
			<h2>Toute la filière</h2>
			<p class="lede">
				Choisissez un ouvrage sur le schéma. L’eau change de couleur avec la turbidité : du brun chargé au
				bleu clair.
			</p>
		</header>
		<section>
			<h3>Capteurs</h3>
			<ul class="sensor-list">
				{#each UNITS as item (item.id)}
					<li>
						<button type="button" onclick={() => onSelect(item.id)}>
							<span>{item.title}</span>
							<strong style:color={turbidityColor(evaluation.stages[item.id].turbidityNtu)}>
								{n(evaluation.stages[item.id].turbidityNtu, evaluation.stages[item.id].turbidityNtu < 10 ? 1 : 0)} NTU
							</strong>
						</button>
					</li>
				{/each}
			</ul>
		</section>
		{#if evaluation.insights.length}
			<section>
				<h3>Ce que les mesures montrent</h3>
				<ul class="insights">
					{#each evaluation.insights as line, index (index)}
						<li>{line}</li>
					{/each}
				</ul>
			</section>
		{/if}
		{#if evaluation.alarms.length}
			<section>
				<h3>Alarmes</h3>
				<ul class="alarms">
					{#each evaluation.alarms as alarm (alarm.id)}
						<li class="alarm-{alarm.level}">{alarm.message}</li>
					{/each}
				</ul>
			</section>
		{/if}
	{:else}
		<header class="inspector-head">
			<div class="head-row">
				<p class="kicker">{unit.index} — {unit.duty}</p>
				<button type="button" class="text" onclick={onClose}>Fermer</button>
			</div>
			<h2>{unit.title}</h2>
			<p class="lede">{unit.blurb}</p>
		</header>

		{#if unit.id === 'intake'}
			<Slider
				label="Débit de prélèvement"
				bind:value={settings.intakeFlowM3h}
				min={0}
				max={360}
				step={5}
				unit="m³/h"
				mark={{ at: plant.designFlowM3h, label: 'Régime de la filière : 200 m³/h' }}
			/>
			<dl class="readout">
				<div>
					<dt>Débit disponible</dt>
					<dd>{n(evaluation.availableRawFlowM3h, 0)} m³/h</dd>
				</div>
				<div>
					<dt>Turbidité brute</dt>
					<dd style:color={turbidityColor(evaluation.rawTurbidityNtu)}>{n(evaluation.rawTurbidityNtu, 0)} NTU</dd>
				</div>
				<div>
					<dt>pH brut</dt>
					<dd>{n(evaluation.rawPh, 2)}</dd>
				</div>
				<div>
					<dt>Température</dt>
					<dd>{n(scenario.raw.temperatureC, 0)} °C</dd>
				</div>
			</dl>
			<div class="actions">
				<button type="button" class:primary={modifiers.flood} class:ghost={!modifiers.flood} onclick={onToggleFlood}>
					{modifiers.flood ? 'Crue en cours' : 'Déclencher une crue'}
				</button>
				<button type="button" class:primary={modifiers.degraded} class:ghost={!modifiers.degraded} onclick={onToggleDegraded}>
					{modifiers.degraded ? 'Qualité dégradée' : 'Dégrader la qualité'}
				</button>
				<button type="button" class="text" onclick={onClearEvents}>Revenir à l’eau du scénario</button>
			</div>
			<p class="note">
				Le captage ne peut pas fournir plus que le débit disponible. Au-delà, la consigne est ignorée par la
				ressource.
			</p>
		{:else if unit.id === 'coagulation'}
			<div class="choices" role="radiogroup" aria-label="Coagulant">
				{#each Object.values(COAGULANTS) as coagulant (coagulant.id)}
					<button
						type="button"
						class="choice"
						role="radio"
						aria-checked={settings.coagulant === coagulant.id}
						class:selected={settings.coagulant === coagulant.id}
						onclick={() => (settings.coagulant = coagulant.id)}
					>
						<strong>{coagulant.name}</strong>
						<span>{coagulant.formula}</span>
					</button>
				{/each}
			</div>
			<p class="note">{spec.note}</p>
			<Slider
				label="Dosage du coagulant"
				bind:value={settings.coagulantDoseMgL}
				min={0}
				max={80}
				step={1}
				unit="mg/L"
			/>
			<Slider
				label="pH avant coagulation"
				bind:value={settings.phBeforeCoagulation}
				min={5}
				max={9}
				step={0.1}
				digits={1}
			/>
			<Slider
				label="Polymère"
				bind:value={settings.polymerDoseMgL}
				min={0}
				max={0.8}
				step={0.05}
				digits={2}
				unit="mg/L"
			/>
			<div class="beaker" style:background={turbidityColor(evaluation.coag.turbidityNtu)} aria-hidden="true">
				{#each dots as dot (dot)}
					{@const formed = evaluation.coag.flocIndex}
					{#if formed > 0.72 ? dot < 5 : formed > 0.4 ? dot < 8 : true}
						<span
							style:width="{formed > 0.72 ? 16 : formed > 0.4 ? 9 : 4}px"
							style:height="{formed > 0.72 ? 16 : formed > 0.4 ? 9 : 4}px"
							style:left="{12 + (dot % 4) * 22}%"
							style:top="{18 + Math.floor(dot / 4) * 24}%"
						></span>
					{/if}
				{/each}
				<p>{evaluation.coag.flocLabel}</p>
			</div>
			<div class="hero-metric">
				<p>Turbidité simulée après coagulation</p>
				<strong style:color={turbidityColor(evaluation.coag.turbidityNtu)}>
					{n(evaluation.coag.turbidityNtu, 1)} <span>NTU</span>
				</strong>
			</div>
			<div class="hero-metric secondary">
				<p>Efficacité théorique du scénario</p>
				<strong>{n(evaluation.coag.efficiency * 100, 0)} <span>%</span></strong>
			</div>
			<dl class="readout">
				<div>
					<dt>pH après coagulation</dt>
					<dd>{n(evaluation.coag.phOut, 2)}</dd>
				</div>
				<div>
					<dt>Alcalinité restante</dt>
					<dd>{n(evaluation.coag.alkalinityMgL, 0)} mg/L</dd>
				</div>
			</dl>
			<Chain points={chain} />
			<p class="disclaimer">
				Cette démonstration utilise une fonction artificielle pour illustrer les interactions. Elle ne
				représente pas une loi de coagulation réelle et ne doit pas servir au dimensionnement d’une
				installation.
			</p>
		{:else if unit.id === 'settling'}
			<Slider
				label="Débit traversant l’ouvrage"
				bind:value={settings.settlingFlowM3h}
				min={0}
				max={320}
				step={5}
				unit="m³/h"
				mark={{ at: plant.settlerDesignFlowM3h, label: 'Régime prévu : 200 m³/h' }}
			/>
			<div class="gauge">
				<div class="gauge-top">
					<span>Boues</span>
					<strong>{n(evaluation.settling.sludgePercent, 0)} %</strong>
				</div>
				<div class="gauge-bar">
					<span style:width="{evaluation.settling.sludgePercent}%"></span>
				</div>
			</div>
			<div class="hero-metric">
				<p>Turbidité en sortie</p>
				<strong style:color={turbidityColor(evaluation.settling.turbidityNtu)}>
					{n(evaluation.settling.turbidityNtu, 1)} <span>NTU</span>
				</strong>
			</div>
			<dl class="readout">
				<div>
					<dt>Rétention simulée</dt>
					<dd>{n(evaluation.settling.capture * 100, 0)} %</dd>
				</div>
				<div>
					<dt>Débit réel</dt>
					<dd>{n(evaluation.productionM3h, 0)} m³/h</dd>
				</div>
			</dl>
			<button type="button" class="primary" disabled={acc.purgeRemainingH > 0} onclick={onPurge}>
				{acc.purgeRemainingH > 0 ? `Purge en cours · ${formatClock(acc.purgeRemainingH)}` : 'Purger les boues'}
			</button>
			<Chain points={chain} />
			<p class="note">Une purge améliore le décanteur ensuite, et trouble l’eau pendant l’opération.</p>
		{:else if unit.id === 'filtration'}
			<Slider
				label="Débit de filtration"
				bind:value={settings.filtrationFlowM3h}
				min={0}
				max={320}
				step={5}
				unit="m³/h"
				mark={{ at: plant.filterDesignFlowM3h, label: 'Régime prévu : 200 m³/h' }}
			/>
			<div class="gauge">
				<div class="gauge-top">
					<span>Perte de charge</span>
					<strong>{n(evaluation.filter.headlossBar, 2)} bar</strong>
				</div>
				<div class="gauge-bar">
					<span style:width="{(Math.min(evaluation.filter.headlossBar, 2.4) / 2.4) * 100}%"></span>
				</div>
			</div>
			<dl class="readout">
				<div>
					<dt>Capacité disponible</dt>
					<dd>{n(evaluation.filter.capacityM3h, 0)} m³/h</dd>
				</div>
				<div>
					<dt>Turbidité filtrée</dt>
					<dd style:color={turbidityColor(evaluation.filter.turbidityNtu)}>
						{n(evaluation.filter.turbidityNtu, 2)} NTU
					</dd>
				</div>
			</dl>
			<button type="button" class="primary" disabled={acc.backwashRemainingH > 0} onclick={onBackwash}>
				{acc.backwashRemainingH > 0
					? `Lavage en cours · ${formatClock(acc.backwashRemainingH)}`
					: 'Lancer un lavage'}
			</button>
			<p class="note">
				Le lavage consomme environ {plant.backwashVolumeM3} m³ du réservoir et réduit la production le temps
				qu’il dure.
			</p>
			<Chain points={chain} />
		{:else if unit.id === 'remineralization'}
			<Slider label="Chaux" bind:value={settings.limeDoseMgL} min={0} max={140} step={1} unit="mg/L" />
			<Slider label="CO₂" bind:value={settings.co2DoseMgL} min={0} max={140} step={1} unit="mg/L" />
			<div class="hero-metric">
				<p>pH après reminéralisation</p>
				<strong>{n(evaluation.remin.ph, 2)}</strong>
			</div>
			<div class="gauge">
				<div class="gauge-top">
					<span>Indice de saturation simplifié</span>
					<strong>{n(evaluation.remin.lsi, 2)}</strong>
				</div>
				<div class="lsi">
					<span class="lsi-goal" style:left="{goalLeft}%" style:width="{goalRight - goalLeft}%"></span>
					<span class="lsi-dot" style:left="{lsiPct}%"></span>
				</div>
				<div class="lsi-legend">
					<span>Agressive</span>
					<span>{evaluation.remin.balance}</span>
					<span>Entartrante</span>
				</div>
			</div>
			<dl class="readout">
				<div>
					<dt>Calcium</dt>
					<dd>{n(evaluation.remin.calciumMgL, 0)} mg/L</dd>
				</div>
				<div>
					<dt>Alcalinité</dt>
					<dd>{n(evaluation.remin.alkalinityMgL, 0)} mg/L CaCO₃</dd>
				</div>
			</dl>
			<p class="note">
				La bande claire marque la zone d’équilibre de ce scénario. Un pH situé dans les valeurs habituelles
				peut quand même laisser l’indice en dehors.
			</p>
		{:else if unit.id === 'disinfection'}
			<Slider
				label="Dose de désinfectant"
				bind:value={settings.chlorineDoseMgL}
				min={0}
				max={2}
				step={0.05}
				digits={2}
				unit="mg/L"
			/>
			<div class="hero-metric">
				<p>Chlore résiduel simulé</p>
				<strong>{n(evaluation.disinfection.residualMgL, 2)} <span>mg/L</span></strong>
			</div>
			<dl class="readout">
				<div>
					<dt>pH à la désinfection</dt>
					<dd>{n(evaluation.disinfection.ph, 2)}</dd>
				</div>
				<div>
					<dt>Temps de contact</dt>
					<dd>{n(evaluation.disinfection.contactMin, 0)} min</dd>
				</div>
				<div>
					<dt>Part de chlore actif</dt>
					<dd>{n(evaluation.disinfection.hocl * 100, 0)} %</dd>
				</div>
				<div>
					<dt>CT simulé</dt>
					<dd class:bad={evaluation.disinfection.ct < plant.targetCt}>
						{n(evaluation.disinfection.ct, 1)} / {n(plant.targetCt, 0)}
					</dd>
				</div>
			</dl>
			<p class="status" class:bad={evaluation.disinfection.ct < plant.targetCt || evaluation.disinfection.residualMgL < 0.12}>
				{evaluation.disinfection.residualMgL < 0.12 || evaluation.disinfection.ct < plant.targetCt
					? 'Désinfection insuffisante dans ce modèle.'
					: 'Le couple résiduel / temps de contact dépasse la cible pédagogique.'}
			</p>
			<p class="note">
				La demande simulée vaut {n(evaluation.disinfection.demandMgL, 2)} mg/L. Elle augmente si l’eau filtrée
				reste turbide.
			</p>
		{:else}
			<div class="balance">
				<div>
					<span>Production</span>
					<strong>{n(evaluation.productionM3h, 0)}</strong>
					<em>m³/h</em>
				</div>
				<div>
					<span>Demande</span>
					<strong>{n(evaluation.demandM3h, 0)}</strong>
					<em>m³/h</em>
				</div>
			</div>
			{#if scenario.allowDemandControl}
				<Slider
					label="Demande du réseau"
					bind:value={settings.demandOverrideM3h}
					min={40}
					max={320}
					step={5}
					unit="m³/h"
				/>
			{/if}
			<div class="gauge">
				<div class="gauge-top">
					<span>Réservoir</span>
					<strong>{n(evaluation.storage.ratio * 100, 0)} % · {n(evaluation.storage.volumeM3, 0)} m³</strong>
				</div>
				<div class="gauge-bar reservoir">
					<span style:width="{evaluation.storage.ratio * 100}%"></span>
				</div>
			</div>
			<p class="status" class:bad={evaluation.storage.deficitM3h > 2}>
				{evaluation.storage.deficitM3h > 2
					? `Il manque ${n(evaluation.storage.deficitM3h, 0)} m³/h : le niveau baisse.`
					: evaluation.storage.deficitM3h < -2
						? `Excédent de ${n(-evaluation.storage.deficitM3h, 0)} m³/h : le niveau monte.`
						: 'Production et demande se tiennent.'}
			</p>
			{#if samples.length > 1}
				<svg class="spark" viewBox="0 0 160 48" role="img" aria-label="Évolution du réservoir">
					<polyline
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						points={samples
							.map((sample, index) => {
								const x = (index / Math.max(samples.length - 1, 1)) * 160;
								const y = 44 - sample.reservoirRatio * 40;
								return `${x},${y}`;
							})
							.join(' ')}
					/>
				</svg>
			{/if}
			{#if evaluation.bottleneck}
				<p class="note">{evaluation.bottleneck}</p>
			{/if}
			<p class="note">
				Pousser tous les débits au maximum peut couvrir la pointe et, en même temps, dégrader la décantation
				ou raccourcir le temps de contact.
			</p>
		{/if}
	{/if}
</aside>
