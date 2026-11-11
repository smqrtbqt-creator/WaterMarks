<script lang="ts">
	import { base } from '$app/paths';
	import Cinematic from '$lib/components/Cinematic.svelte';
	import HeroChip from '$lib/components/HeroChip.svelte';
	import RoleAlert from '$lib/components/RoleAlert.svelte';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import Slider from '$lib/components/Slider.svelte';
	import { ENIGMAS } from '$lib/game/flaque';
	import { flaque } from '$lib/game/flaque.svelte';
	import { n } from '$lib/sim/format';
	import {
		CALCITE_KS,
		IRON_K,
		gibbsReading,
		qrCalcite,
		qrDenitrification,
		qrIron
	} from '$lib/modules/gibbs';

	let activity = $state<'denit' | 'calcite' | 'fer'>('denit');
	let temp = $state(15);
	let no3 = $state(0.5);
	let hco3 = $state(2);
	let n2 = $state(0.8);
	let co2 = $state(1);
	let ca = $state(40);
	let co3 = $state(0.15);
	let fe2 = $state(5);
	let fe3 = $state(1);
	let o2 = $state(0.21);
	let ph = $state(7);
	let intro = $state(true);
	let armed = $state(false);
	let watched = $state<'denit' | 'calcite' | 'fer'>('denit');

	const qr = $derived.by(() => {
		if (activity === 'denit') return qrDenitrification(no3 / 1000, n2, hco3 / 1000, co2 / 1000);
		if (activity === 'calcite') return qrCalcite(ca / 40080, co3 / 60000);
		return qrIron(fe2 / 1e6, fe3 / 1e6, o2, ph);
	});
	const k = $derived(activity === 'denit' ? 1 : activity === 'calcite' ? CALCITE_KS : IRON_K);
	const reading = $derived(gibbsReading(qr, k, temp));
	/** drop < 0 : ΔrG < 0, les produits sont plus bas à l’écran (y vers le bas). */
	const drop = $derived(Math.max(-1, Math.min(1, reading.deltaGkj / 25)));
	const yReact = $derived(110 + drop * 42);
	const yProd = $derived(110 - drop * 42);
	const names = $derived(
		activity === 'denit'
			? { left: 'NO₃⁻, CH₂O', right: 'N₂, HCO₃⁻, CO₂' }
			: activity === 'calcite'
				? { left: 'CaCO₃(s)', right: 'Ca²⁺, CO₃²⁻' }
				: { left: 'Fe²⁺, O₂, H⁺', right: 'Fe³⁺' }
	);
	const bascule = ENIGMAS.find((enigma) => enigma.id === 'bascule');
	const reactionName = $derived(activity === 'denit' ? 'La dénitrification' : activity === 'calcite' ? 'La calcite' : 'Le fer dissous');
	const alertLine = $derived(
		reading.sense === 'equilibre'
			? `${reactionName} : Q et K se tiennent. ΔᵣG vaut ${n(reading.deltaGkj, 1)} kJ/mol. La réaction est à l’équilibre.`
			: reading.sense === 'direct'
				? `${reactionName} : les produits sont plus bas. ΔᵣG vaut ${n(reading.deltaGkj, 1)} kJ/mol. Le sens écrit est favorisé. Le signe ne dit pas la vitesse, ni que l’eau est potable.`
				: `${reactionName} : les réactifs sont plus bas. ΔᵣG vaut ${n(reading.deltaGkj, 1)} kJ/mol. Le sens inverse est favorisé.`
	);
	const senseText = $derived(
		reading.sense === 'direct'
			? 'Les produits sont plus bas. ΔᵣG est négatif : le sens écrit est favorisé.'
			: reading.sense === 'inverse'
				? 'Les réactifs sont plus bas. ΔᵣG est positif : le sens inverse est favorisé.'
				: 'Réactifs et produits sont au même niveau. La réaction est à l’équilibre.'
	);

	const sup: Record<string, string> = {
		'-': '⁻',
		'0': '⁰',
		'1': '¹',
		'2': '²',
		'3': '³',
		'4': '⁴',
		'5': '⁵',
		'6': '⁶',
		'7': '⁷',
		'8': '⁸',
		'9': '⁹'
	};

	$effect(() => {
		if (flaque.loaded && flaque.seen('gibbs')) intro = false;
	});

	function closeIntro() {
		flaque.seeIntro('gibbs');
		intro = false;
	}

	$effect(() => {
		if (activity !== watched) {
			watched = activity;
			armed = reading.sense === 'direct';
			return;
		}
		if (reading.sense === 'direct') armed = true;
		if (armed && reading.sense === 'inverse') flaque.solve('bascule');
	});

	function sci(value: number) {
		if (!Number.isFinite(value) || value <= 0) return '—';
		const exp = Math.floor(Math.log10(value));
		if (exp === 0) return n(value, 2);
		const mant = value / 10 ** exp;
		const e = [...String(exp)].map((char) => sup[char] ?? char).join('');
		return `${n(mant, 2)}×10${e}`;
	}
</script>

<svelte:head>
	<title>Énergie de Gibbs</title>
</svelte:head>

<div class="app modules">
	<header class="top">
		<div class="brand">
			<p class="mark">Module</p>
			<h1>Énergie de Gibbs</h1>
			<ProjectSwitch current="modules" />
			<HeroChip />
		</div>
	</header>

	{#if intro}
		<Cinematic
			cast="irma"
			speaker="Irma Quotient"
			role="Chimiste de garde"
			line="Regarde qui est le plus bas. Produits plus bas : ΔᵣG est négatif, le sens écrit est favorisé. Réactifs plus bas : le sens inverse gagne. Le K de la dénitrification et celui du fer sont ceux de l’activité. Pour la calcite, 3,3×10⁻⁹ est l’ordre de grandeur à 25 °C, sans force ionique. Le signe ne dit pas la vitesse, ni que l’eau est potable."
			action="Je lis la balance"
			onclose={closeIntro}
		/>
	{/if}

	<RoleAlert speaker="Irma Quotient" role="Chimiste de garde" line={alertLine} />

	<div class="weather" role="group" aria-label="Réaction">
		<button type="button" class="ghost" aria-pressed={activity === 'denit'} onclick={() => (activity = 'denit')}>Dénitrification</button>
		<button type="button" class="ghost" aria-pressed={activity === 'calcite'} onclick={() => (activity = 'calcite')}>Calcite</button>
		<button type="button" class="ghost" aria-pressed={activity === 'fer'} onclick={() => (activity = 'fer')}>Fer</button>
	</div>

	<div class="module-layout">
		<div class="energy">
			<svg viewBox="0 0 420 230" role="img" aria-label="Diagramme d’énergie libre. {senseText} ΔᵣG {n(reading.deltaGkj, 1)} kilojoules par mole.">
				<defs>
					<marker id="gibbs-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
						<path d="M0 0 L8 3 L0 6 Z" fill="#8ec8e6" />
					</marker>
				</defs>
				<text x="16" y="24" fill="#93aeb0" font-size="14">G</text>
				<line x1="28" y1="36" x2="28" y2="186" stroke="rgba(196,224,220,0.35)" />
				<line x1="28" y1="186" x2="400" y2="186" stroke="rgba(196,224,220,0.35)" />
				<path
					d="M48 {yReact} H160 C190 {yReact} 214 {yProd} 250 {yProd} H372"
					fill="none"
					stroke="#dff56a"
					stroke-width="4"
					stroke-linecap="round"
				/>
				{#if Math.abs(yProd - yReact) > 8}
					<line
						x1="206"
						y1={Math.min(yReact, yProd)}
						x2="206"
						y2={Math.max(yReact, yProd)}
						stroke="#8ec8e6"
						stroke-width="2"
						marker-end="url(#gibbs-arrow)"
					/>
				{/if}
				<text x="104" y="208" text-anchor="middle" fill="#e8f3f1" font-size="14">Réactifs</text>
				<text x="310" y="208" text-anchor="middle" fill="#e8f3f1" font-size="14">Produits</text>
				<text x="104" y={yReact - 10} text-anchor="middle" fill="#93aeb0" font-size="12">{names.left}</text>
				<text x="310" y={yProd - 10} text-anchor="middle" fill="#93aeb0" font-size="12">{names.right}</text>
				<text x="210" y="22" text-anchor="middle" fill="#dff56a" font-size="15">ΔᵣG = {n(reading.deltaGkj, 1)} kJ/mol</text>
			</svg>
			<p class="sense">{senseText}</p>
		</div>

		<div class="module-panel">
			<Slider label="Température" bind:value={temp} min={5} max={30} step={1} unit="°C" />
			<p>K reste fixe. La température change la valeur de ΔᵣG, pas le sens.</p>
			{#if activity === 'denit'}
				<p class="eq">5 CH₂O + 4 NO₃⁻ → 2 N₂ + 4 HCO₃⁻ + CO₂ + 3 H₂O</p>
				<p class="species-kicker">Réactifs</p>
				<Slider label="Nitrates NO₃⁻" bind:value={no3} min={0.2} max={4} step={0.05} digits={2} unit="mmol/L" />
				<p class="fixed-species">CH₂O : activité 1</p>
				<p class="species-kicker">Produits</p>
				<Slider label="Hydrogénocarbonates HCO₃⁻" bind:value={hco3} min={0.4} max={6} step={0.1} digits={1} unit="mmol/L" />
				<Slider label="Diazote N₂" bind:value={n2} min={0.2} max={1} step={0.05} digits={2} unit="bar" />
				<Slider label="CO₂" bind:value={co2} min={0.2} max={5} step={0.1} digits={1} unit="mbar" />
				<p class="fixed-species">H₂O : activité 1</p>
				<p>K = 1 pour cette activité, afin de passer d’un sens à l’autre. Ce n’est pas le K d’une eau réelle.</p>
			{:else if activity === 'calcite'}
				<p class="eq">CaCO₃(s) ⇌ Ca²⁺ + CO₃²⁻</p>
				<p class="species-kicker">Réactif</p>
				<p class="fixed-species">CaCO₃(s) : activité 1</p>
				<p class="species-kicker">Produits</p>
				<Slider label="Calcium Ca²⁺" bind:value={ca} min={10} max={120} step={1} unit="mg/L" />
				<Slider label="Carbonate CO₃²⁻" bind:value={co3} min={0.05} max={4} step={0.05} digits={2} unit="mg/L" />
				<p>Ks = 3,3×10⁻⁹, ordre de grandeur de la calcite à 25 °C, sans force ionique. Si les produits montent au-dessus de Ks, le dépôt est favorisé.</p>
			{:else}
				<p class="eq">4 Fe²⁺ + O₂ + 4 H⁺ → 4 Fe³⁺ + 2 H₂O</p>
				<p class="species-kicker">Réactifs</p>
				<Slider label="Fer II Fe²⁺" bind:value={fe2} min={0.5} max={20} step={0.5} digits={1} unit="µmol/L" />
				<Slider label="Oxygène O₂" bind:value={o2} min={0.05} max={0.3} step={0.01} digits={2} unit="bar" />
				<Slider label="pH — réactif H⁺" bind:value={ph} min={6} max={8} step={0.1} digits={1} />
				<p class="species-kicker">Produit</p>
				<Slider label="Fer III Fe³⁺" bind:value={fe3} min={0.2} max={20} step={0.1} digits={1} unit="µmol/L" />
				<p class="fixed-species">H₂O : activité 1</p>
				<p>K = 10²⁶ est placé pour que ces curseurs fassent basculer le sens. Ce n’est pas la constante des potentiels standard, ni celle de cette eau. Le fer III reste dissous : la précipitation de l’hydroxyde n’est pas dans l’équation.</p>
			{/if}
			<dl class="readout">
				<div><dt>Q</dt><dd>{sci(reading.qr)}</dd></div>
				<div><dt>K</dt><dd>{sci(k)}</dd></div>
				<div><dt>ΔᵣG</dt><dd>{n(reading.deltaGkj, 1)} kJ/mol</dd></div>
			</dl>
			<p class="enigma-line">
				{bascule?.ask}
				{flaque.save.solved.includes('bascule') ? ` Objet : ${bascule?.itemName}.` : ''}
			</p>
			<p class="disclaimer">ΔᵣG = RT ln(Q/K). Le signe dit le sens favorisé. Il ne dit pas la vitesse, ni que l’eau est potable.</p>
			<p><a href="{base}/modules">Retour aux modules</a></p>
		</div>
	</div>
</div>
