<script lang="ts">
	import Curves from '$lib/components/disinfection/Curves.svelte';
	import Station from '$lib/components/disinfection/Station.svelte';
	import Slider from '$lib/components/Slider.svelte';
	import { LEGIONELLA, MODEL_LIMITS, ORGANISMS, PROCESSES, REFERENCES } from '$lib/disinfection/content';
	import { evaluate } from '$lib/disinfection/engine';
	import { SCENARIOS, WATERS, evaluateGoals, scenarioById } from '$lib/disinfection/scenarios';
	import type { OrganismId, ProbeMode, SafetyFlags, Settings } from '$lib/disinfection/types';
	import { n } from '$lib/sim/format';

	const ATELIERS = [
		{ id: 1, title: 'Rôle' },
		{ id: 2, title: 'Chloration' },
		{ id: 3, title: 'pH' },
		{ id: 4, title: 'Microorganismes' },
		{ id: 5, title: 'Procédés' },
		{ id: 6, title: 'Analyses et sécurité' }
	];

	const CHAIN = [
		'Eau brute',
		'Prétraitement',
		'Clarification',
		'Filtration',
		'Affinage facultatif',
		'Désinfection finale',
		'Stockage',
		'Distribution'
	];

	const SAFETY_CASES = [
		{
			id: 'leak',
			title: 'Fuite de chlore gazeux',
			text: 'Une alarme et une odeur piquante signalent une fuite dans le local de stockage.',
			right: [
				{ id: 'evacuate', label: 'Évacuer la zone' },
				{ id: 'isolate', label: 'Interdire l’accès' },
				{ id: 'alert', label: 'Alerter les secours et le personnel formé' }
			],
			wrong: [
				{ id: 'approach', label: 'Fermer la bouteille moi-même' },
				{ id: 'waterOnLeak', label: 'Arroser la fuite' }
			]
		},
		{
			id: 'splash',
			title: 'Projection d’eau de Javel',
			text: 'De l’hypochlorite a été projeté sur la peau. Tout se passe dans le simulateur.',
			right: [
				{ id: 'rinse', label: 'Rincer abondamment à l’eau' },
				{ id: 'clothes', label: 'Retirer les vêtements souillés sans étendre le produit' },
				{ id: 'call', label: 'Alerter les secours ou un centre antipoison' }
			],
			wrong: [
				{ id: 'acid', label: 'Neutraliser avec un acide' },
				{ id: 'wipe', label: 'Essuyer sans rincer' }
			]
		},
		{
			id: 'eyes',
			title: 'Projection dans les yeux',
			text: 'Une goutte a atteint l’œil. Le geste simulé suit la logique du rinçage et de l’alerte.',
			right: [
				{ id: 'rinseEye', label: 'Rincer abondamment à l’eau' },
				{ id: 'callEye', label: 'Alerter les secours' },
				{ id: 'noNeutral', label: 'Ne pas neutraliser avec un autre produit' }
			],
			wrong: [
				{ id: 'drops', label: 'Mettre un collyre au hasard' },
				{ id: 'rub', label: 'Frotter l’œil' }
			]
		},
		{
			id: 'air',
			title: 'Ventilation insuffisante',
			text: 'Le local sent le chlore et l’extraction est en défaut.',
			right: [
				{ id: 'leave', label: 'Quitter le local' },
				{ id: 'report', label: 'Signaler le défaut au personnel formé' }
			],
			wrong: [
				{ id: 'stay', label: 'Rester pour aérer malgré l’odeur' },
				{ id: 'hide', label: 'Masquer l’alarme' }
			]
		},
		{
			id: 'storage',
			title: 'Stockage incompatible',
			text: 'Un bidon d’hypochlorite est contre un acide. Les mélanger peut dégager du chlore gazeux.',
			right: [
				{ id: 'separate', label: 'Écarter l’hypochlorite des acides et de l’ammoniaque' },
				{ id: 'tell', label: 'Signaler le stockage au personnel formé' }
			],
			wrong: [
				{ id: 'closer', label: 'Rapprocher encore les bidons' },
				{ id: 'mix', label: 'Mélanger les fonds de bidon' }
			]
		}
	];

	let atelier = $state(1);
	let mode = $state<'libre' | 'scenario'>('scenario');
	let scenarioId = $state('nominal');
	let settings = $state<Settings>(structuredClone(scenarioById('nominal').settings));
	let phCompare = $state(8.6);
	let organism = $state<OrganismId>('crypto');
	let processA = $state('hypochlorite');
	let processB = $state('uv');
	let safetyCase = $state('leak');
	let safety = $state<SafetyFlags>({ evacuate: false, isolate: false, alert: false, approach: false, waterOnLeak: false });
	let extra = $state<Record<string, boolean>>({});
	let history = $state<{ id: number; text: string }[]>([]);
	let seen = '';
	let historyNo = 0;
	let baseline = $state<{ free: number; ph: number; hocl: number; bacteria: number } | null>(null);
	let docs = $state<HTMLDialogElement | null>(null);

	const scenario = $derived(scenarioById(scenarioId));
	const evaluation = $derived(evaluate(settings));
	const compared = $derived(evaluate({ ...settings, ph: phCompare }));
	const goals = $derived(mode === 'scenario' ? evaluateGoals(scenarioId, evaluation, safety) : []);
	const met = $derived(goals.filter((goal) => goal.ok).length);
	const activeCase = $derived(SAFETY_CASES.find((item) => item.id === safetyCase) ?? SAFETY_CASES[0]);
	const organismView = $derived(evaluation.organisms.find((item) => item.id === organism) ?? evaluation.organisms[0]);
	const organismCard = $derived(ORGANISMS.find((item) => item.id === organism) ?? ORGANISMS[0]);

	function loadScenario(id: string) {
		scenarioId = id;
		settings = structuredClone(scenarioById(id).settings);
		safety = { evacuate: false, isolate: false, alert: false, approach: false, waterOnLeak: false };
		extra = {};
		baseline = null;
		atelier = scenarioById(id).atelier;
		if (id === 'securite') safetyCase = 'leak';
	}

	function applyWater(id: string) {
		const water = WATERS.find((item) => item.id === id);
		if (!water) return;
		settings = { ...settings, ...water.patch, filtrationAid: id === 'claire' ? 30 : 0, uvAid: false, ozoneAid: false, membraneAid: false };
	}

	function memorize() {
		const bacteria = evaluation.organisms[0];
		baseline = {
			free: evaluation.balance.freeMgL,
			ph: evaluation.settings.ph,
			hocl: evaluation.balance.hoclFraction,
			bacteria: bacteria.remaining
		};
	}

	function toggleSafety(id: string) {
		if (id === 'evacuate' || id === 'isolate' || id === 'alert' || id === 'approach' || id === 'waterOnLeak') {
			safety = { ...safety, [id]: !safety[id as keyof SafetyFlags] };
			return;
		}
		extra = { ...extra, [id]: !extra[id] };
	}

	function safetyOn(id: string) {
		if (id in safety) return safety[id as keyof SafetyFlags];
		return Boolean(extra[id]);
	}

	function caseUnderstood(item: (typeof SAFETY_CASES)[number]) {
		const rights = item.right.every((action) => safetyOn(action.id));
		const wrongs = item.wrong.every((action) => !safetyOn(action.id));
		return rights && wrongs;
	}

	$effect(() => {
		const signature = JSON.stringify(settings);
		const text = evaluation.explanations[0] ?? '';
		if (signature === seen) return;
		if (seen) {
			historyNo += 1;
			history = [{ id: historyNo, text }, ...history].slice(0, 8);
		}
		seen = signature;
	});
</script>

<svelte:head>
	<title>Désinfection de l’eau — niveau 1</title>
</svelte:head>

<div class="app disinfection">
	<header class="top">
		<div class="brand">
			<p class="mark">Niveau 1 · simulation</p>
			<h1>Désinfection</h1>
			<p class="plant-switch">
				<a href="/">Rivière Blanche</a>
				<a href="/bastide">La Bastide</a>
				<a href="/laboratoire">Laboratoire</a>
			</p>
		</div>
		<nav class="scenarios" aria-label="Ateliers">
			{#each ATELIERS as item (item.id)}
				<button type="button" class="scenario" aria-pressed={atelier === item.id} onclick={() => (atelier = item.id)}>
					<span>Atelier {item.id}</span>
					{item.title}
				</button>
			{/each}
		</nav>
		<div class="clock">
			<p>{mode === 'scenario' ? `${met}/${goals.length}` : 'Libre'}</p>
			<div class="speeds">
				<button type="button" class="ghost" aria-pressed={mode === 'scenario'} onclick={() => (mode = 'scenario')}>Scénarios</button>
				<button type="button" class="ghost" aria-pressed={mode === 'libre'} onclick={() => (mode = 'libre')}>Mode libre</button>
				<button type="button" class="text" onclick={() => docs?.showModal()}>Modèle et sources</button>
			</div>
		</div>
	</header>

	<p class="disclaimer">
		Atelier virtuel pour débutants. Les doses et les indices ne sont pas des consignes d’usine, et une eau claire à l’écran n’est pas une eau potable.
		Aucune manipulation réelle de chlore ou d’eau de Javel n’est demandée.
	</p>

	{#if mode === 'scenario'}
		<nav class="scenarios" aria-label="Situations">
			{#each SCENARIOS as item (item.id)}
				<button type="button" class="scenario" aria-pressed={item.id === scenarioId} onclick={() => loadScenario(item.id)}>
					<span>Atelier {item.atelier}</span>
					{item.title}
				</button>
			{/each}
		</nav>
		<section class="brief">
			<div>
				<p class="kicker">Situation</p>
				<h2>{scenario.title}</h2>
				<p>{scenario.summary}</p>
			</div>
			<div class="goals">
				<ul>
					{#each goals as goal (goal.id)}
						<li class:ok={goal.ok}>
							<span>{goal.ok ? 'Atteint' : 'En cours'} · {goal.basis === 'regulatory_reference' ? 'référence citée' : 'hypothèse'}</span>
							<strong>{goal.label}</strong>
						</li>
					{/each}
				</ul>
			</div>
		</section>
	{/if}

	{#if atelier === 1}
		<section class="stage disinfection-block">
			<h2>La désinfection ferme la barrière microbiologique</h2>
			<p>Elle ne remplace pas la clarification ni la filtration, et elle ne retire pas à elle seule les polluants chimiques.</p>
			<ol class="chain-steps">
				{#each CHAIN as step, index (step)}
					<li class:current={step === 'Désinfection finale'}>{index + 1}. {step}</li>
				{/each}
			</ol>
			<div class="inline-choices" role="group" aria-label="Eaux brutes simulées">
				{#each WATERS as water (water.id)}
					<button type="button" class="ghost" onclick={() => applyWater(water.id)}>{water.title}</button>
				{/each}
			</div>
			<p class="note">{WATERS[0].note}</p>
			<dl class="readout">
				<div><dt>Turbidité</dt><dd>{n(settings.turbidityNtu, 1)} NTU</dd></div>
				<div><dt>pH</dt><dd>{n(settings.ph, 2)}</dd></div>
				<div><dt>Température</dt><dd>{n(settings.temperatureC, 0)} °C</dd></div>
				<div><dt>Demande en chlore</dt><dd>{n(settings.demandMgL, 2)} mg/L</dd></div>
				<div><dt>Indicateur bactérien</dt><dd>{n(settings.bacteria, 0)}</dd></div>
				<div><dt>Virus</dt><dd>{n(settings.virus, 0)}</dd></div>
				<div><dt>Giardia</dt><dd>{n(settings.giardia, 0)}</dd></div>
				<div><dt>Cryptosporidium</dt><dd>{n(settings.crypto, 0)}</dd></div>
			</dl>
			<div class="organism-grid">
				{#each ORGANISMS as item (item.id)}
					<article>
						<p class="kicker">{item.example}</p>
						<h3>{item.name}</h3>
						<p>{item.route}</p>
						<p>{item.chlorine}</p>
						<p class="note">{item.limit}</p>
					</article>
				{/each}
				<article>
					<p class="kicker">Autre voie</p>
					<h3>{LEGIONELLA.name}</h3>
					<p>{LEGIONELLA.route}</p>
					<p class="note">{LEGIONELLA.limit}</p>
				</article>
			</div>
		</section>
	{/if}

	{#if atelier === 2 || atelier === 3 || atelier === 4}
		<div class="workspace">
			<section class="stage">
				<Station
					turbidityNtu={evaluation.effectiveTurbidityNtu}
					freeMgL={evaluation.balance.freeMgL}
					probeMgL={evaluation.probeMgL}
					ph={settings.ph}
					doseMgL={settings.doseMgL}
					contactMin={settings.contactMin}
				/>
				<div class="metrics-row">
					<p><span>Injecté</span><strong>{n(evaluation.balance.injectedMgL, 2)} mg/L</strong></p>
					<p><span>Consommé</span><strong>{n(evaluation.balance.consumedMgL, 2)} mg/L</strong></p>
					<p><span>Libre</span><strong>{n(evaluation.balance.freeMgL, 2)} mg/L</strong></p>
					<p><span>Combiné</span><strong>{n(evaluation.balance.combinedMgL, 2)} mg/L</strong></p>
					<p><span>Total</span><strong>{n(evaluation.balance.totalMgL, 2)} mg/L</strong></p>
					<p><span>HOCl</span><strong>{n(evaluation.balance.hoclFraction * 100, 0)} %</strong></p>
				</div>
				<div class="fraction" aria-label="Répartition estimée HOCl et OCl moins">
					<span style:width="{evaluation.balance.hoclFraction * 100}%">HOCl</span>
					<span style:width="{evaluation.balance.oclFraction * 100}%">OCl⁻</span>
				</div>
				<Curves {settings} />
				{#if baseline}
					<p class="note">
						Depuis la mémorisation : chlore libre {n(evaluation.balance.freeMgL - baseline.free, 2)} mg/L, pH {n(evaluation.settings.ph - baseline.ph, 2)},
						HOCl {n((evaluation.balance.hoclFraction - baseline.hocl) * 100, 0)} points, indicateur bactérien {n(evaluation.organisms[0].remaining - baseline.bacteria, 1)}.
					</p>
				{/if}
			</section>
			<aside class="inspector" aria-label="Réglages de désinfection">
				<h2>{atelier === 3 ? 'Comparer deux pH' : atelier === 4 ? organismCard.name : 'Piloter la cuve'}</h2>
				{#if atelier === 3}
					<p class="lede">Les deux situations partagent la dose, le temps, la demande et la turbidité. Seul le pH change.</p>
					<Slider numeric label="pH situation A" bind:value={settings.ph} min={6} max={9} step={0.1} digits={1} />
					<Slider numeric label="pH situation B" bind:value={phCompare} min={6} max={9} step={0.1} digits={1} />
					<dl class="readout">
						<div><dt>HOCl A / B</dt><dd>{n(evaluation.balance.hoclFraction * 100, 0)} % → {n(compared.balance.hoclFraction * 100, 0)} %</dd></div>
						<div><dt>Libre A / B</dt><dd>{n(evaluation.balance.freeMgL, 2)} → {n(compared.balance.freeMgL, 2)} mg/L</dd></div>
						<div><dt>Bactéries A / B</dt><dd>{n(evaluation.organisms[0].remaining, 1)} → {n(compared.organisms[0].remaining, 1)}</dd></div>
					</dl>
					<p class="note">{compared.explanations[0]}</p>
				{:else if atelier === 4}
					<div class="inline-choices" role="group" aria-label="Contaminant">
						{#each ORGANISMS as item (item.id)}
							<button type="button" class="ghost" aria-pressed={organism === item.id} onclick={() => (organism = item.id)}>{item.name}</button>
						{/each}
					</div>
					<p>{organismCard.route}</p>
					<p>{organismCard.chlorine}</p>
					<p class="note">Indicateur restant : {n(organismView.remaining, 1)} / 100. Réduction simulée : {n(organismView.log10Reduction, 2)} log.</p>
					<Slider numeric label="Dose de chlore" bind:value={settings.doseMgL} min={0} max={5} step={0.05} digits={2} unit="mg/L" />
					<Slider numeric label="Filtration amont" bind:value={settings.filtrationAid} min={0} max={100} step={5} unit="%" />
					<div class="inline-choices">
						<button type="button" class="ghost" aria-pressed={settings.uvAid} onclick={() => (settings.uvAid = !settings.uvAid)}>UV-C</button>
						<button type="button" class="ghost" aria-pressed={settings.ozoneAid} onclick={() => (settings.ozoneAid = !settings.ozoneAid)}>Ozone</button>
						<button type="button" class="ghost" aria-pressed={settings.membraneAid} onclick={() => (settings.membraneAid = !settings.membraneAid)}>Membrane</button>
					</div>
					<p class="note">{organismCard.limit}</p>
				{:else}
					<Slider numeric label="Dose de chlore" bind:value={settings.doseMgL} min={0} max={5} step={0.05} digits={2} unit="mg/L" />
					<Slider numeric label="pH" bind:value={settings.ph} min={6} max={9} step={0.1} digits={1} />
					<Slider numeric label="Temps de contact" bind:value={settings.contactMin} min={0} max={90} step={1} unit="min" />
					<Slider numeric label="Température" bind:value={settings.temperatureC} min={2} max={30} step={1} unit="°C" />
					<Slider numeric label="Demande en chlore" bind:value={settings.demandMgL} min={0} max={3} step={0.05} digits={2} unit="mg/L" />
					<Slider numeric label="Potentiel de chlore combiné" bind:value={settings.combinedPotentialMgL} min={0} max={1.5} step={0.05} digits={2} unit="mg/L" />
					<Slider numeric label="Turbidité d’entrée" bind:value={settings.turbidityNtu} min={0} max={30} step={0.1} digits={1} unit="NTU" />
					<Slider numeric label="Charge organique" bind:value={settings.organic} min={0} max={100} step={1} />
					<Slider numeric label="Filtration amont" bind:value={settings.filtrationAid} min={0} max={100} step={5} unit="%" />
				{/if}
				<h3>Pourquoi ça évolue</h3>
				<ul class="alarms">
					{#each evaluation.explanations as line, index (index)}
						<li>{line}</li>
					{/each}
				</ul>
				{#if evaluation.alerts.length}
					<h3>Alertes</h3>
					<ul class="alarms">
						{#each evaluation.alerts as alert (alert.id)}
							<li class:alarm-critical={alert.level === 'fail'}>{alert.title}. {alert.text}</li>
						{/each}
					</ul>
				{/if}
				<div class="inline-choices">
					<button type="button" class="primary" onclick={memorize}>Mémoriser l’état</button>
					<button type="button" class="ghost" onclick={() => (mode === 'scenario' ? loadScenario(scenarioId) : (settings = structuredClone(scenarioById('nominal').settings)))}>Recommencer</button>
				</div>
				{#if history.length}
					<h3>Historique</h3>
					<ul class="alarms">
						{#each history as item (item.id)}
							<li class="alarm-info">{item.text}</li>
						{/each}
					</ul>
				{/if}
			</aside>
		</div>
	{/if}

	{#if atelier === 5}
		<section class="stage disinfection-block">
			<h2>Comparer deux procédés</h2>
			<p>Inactivation, oxydation et séparation physique ne se remplacent pas. Les UV et l’ozone ne protègent pas le réseau après leur passage.</p>
			<div class="compare-pick">
				<label>Procédé A
					<select bind:value={processA}>
						{#each PROCESSES as item (item.id)}
							<option value={item.id}>{item.name}</option>
						{/each}
					</select>
				</label>
				<label>Procédé B
					<select bind:value={processB}>
						{#each PROCESSES as item (item.id)}
							<option value={item.id}>{item.name}</option>
						{/each}
					</select>
				</label>
			</div>
			<div class="table-wrap">
				<table>
					<caption>Comparaison pédagogique, sans dose d’exploitation</caption>
					<thead>
						<tr>
							<th scope="col">Critère</th>
							<th scope="col">{PROCESSES.find((item) => item.id === processA)?.name}</th>
							<th scope="col">{PROCESSES.find((item) => item.id === processB)?.name}</th>
						</tr>
					</thead>
					<tbody>
						{#each ['family', 'principle', 'targets', 'advantages', 'drawbacks', 'operators', 'byproducts', 'residual', 'maintenance', 'when'] as key (key)}
							<tr>
								<th scope="row">{key === 'family' ? 'Famille' : key === 'principle' ? 'Principe' : key === 'targets' ? 'Cibles et limites' : key === 'advantages' ? 'Atouts' : key === 'drawbacks' ? 'Limites' : key === 'operators' ? 'Risques opérateurs' : key === 'byproducts' ? 'Sous-produits' : key === 'residual' ? 'Effet rémanent' : key === 'maintenance' ? 'Surveillance' : 'Pertinence'}</th>
								<td>{PROCESSES.find((item) => item.id === processA)?.[key as 'principle']}</td>
								<td>{PROCESSES.find((item) => item.id === processB)?.[key as 'principle']}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	{#if atelier === 6}
		<section class="workspace">
			<section class="stage disinfection-block">
				<h2>Analyseur continu et DPD</h2>
				<p>Le DPD simulé est la référence du module. L’analyseur peut dériver, devenir incohérent ou perdre son signal.</p>
				<div class="metrics-row">
					<p><span>DPD de référence</span><strong>{n(evaluation.dpdMgL, 2)} mg/L</strong></p>
					<p><span>Analyseur</span><strong>{evaluation.probeMgL === null ? 'Signal perdu' : `${n(evaluation.probeMgL, 2)} mg/L`}</strong></p>
					<p><span>pH</span><strong>{n(settings.ph, 2)}</strong></p>
					<p><span>Turbidité utile</span><strong>{n(evaluation.effectiveTurbidityNtu, 2)} NTU</strong></p>
				</div>
				<div class="inline-choices" role="group" aria-label="État de la sonde">
					{#each [['calibrated', 'Étalonnée'], ['drift', 'Dérive'], ['inconsistent', 'Incohérente'], ['lost', 'Signal perdu']] as item (item[0])}
						<button
							type="button"
							class="ghost"
							aria-pressed={settings.probeMode === item[0]}
							onclick={() => (settings.probeMode = item[0] as ProbeMode)}
						>{item[1]}</button>
					{/each}
				</div>
				<button type="button" class="ghost" aria-pressed={settings.useDpdAsReference} onclick={() => (settings.useDpdAsReference = !settings.useDpdAsReference)}>
					Décider avec le DPD de référence
				</button>
				<p class="note">Étalonner, ici, aligne la sonde sur la référence simulée. Sur une installation, la vérification suit le fabricant et le contrôle métrologique. Les analyses microbiologiques de laboratoire ne sont pas instantanées : elles ne sont pas remplacées par le voyant de l’analyseur.</p>
				{#if evaluation.alerts.length}
					<ul class="alarms">
						{#each evaluation.alerts as alert (alert.id)}
							<li class:alarm-critical={alert.level === 'fail'}>{alert.title}. {alert.text}</li>
						{/each}
					</ul>
				{/if}
			</section>
			<aside class="inspector">
				<h2>Sécurité virtuelle</h2>
				<div class="inline-choices" role="group" aria-label="Situations de sécurité">
					{#each SAFETY_CASES as item (item.id)}
						<button type="button" class="ghost" aria-pressed={safetyCase === item.id} onclick={() => (safetyCase = item.id)}>{item.title}</button>
					{/each}
				</div>
				<p>{activeCase.text}</p>
				<div class="choice-list">
					{#each [...activeCase.right, ...activeCase.wrong] as action (action.id)}
						<button type="button" class="ghost" aria-pressed={safetyOn(action.id)} onclick={() => toggleSafety(action.id)}>{action.label}</button>
					{/each}
				</div>
				<p class="note">
					{caseUnderstood(activeCase)
						? 'Conduite retenue : protéger les personnes et alerter. Aucun geste de réparation de fuite n’est enseigné.'
						: 'Choisissez la protection des personnes. Une action qui approche la fuite ou mélange des produits fait échouer la situation.'}
				</p>
			</aside>
		</section>
	{/if}

	<footer>
		Conformité affichée : pédagogique seulement. E. coli : limite citée 0/100 mL. Chlore libre : pas de seuil chiffré dans l’arrêté, seulement l’absence d’odeur ou de saveur désagréable et de changement anormal.
	</footer>
</div>

<dialog bind:this={docs}>
	<h2>Modèle et références</h2>
	<div class="sheet">
		{#each MODEL_LIMITS as line, index (index)}
			<p>{line}</p>
		{/each}
		{#each REFERENCES as item (item.title)}
			<article>
				<h3><a href={item.url}>{item.title}</a></h3>
				<p>{item.note}</p>
			</article>
		{/each}
	</div>
	<button type="button" class="primary" onclick={() => docs?.close()}>Fermer</button>
</dialog>
