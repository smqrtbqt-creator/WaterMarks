<script lang="ts">
	import { base } from '$app/paths';
	import HeroChip from '$lib/components/HeroChip.svelte';
	import RoleAlert from '$lib/components/RoleAlert.svelte';
	import ProjectSwitch from '$lib/components/ProjectSwitch.svelte';
	import { ENIGMAS } from '$lib/game/flaque';
	import { flaque } from '$lib/game/flaque.svelte';
</script>

<svelte:head>
	<title>Modules</title>
</svelte:head>

<div class="app modules">
	<header class="top">
		<div class="brand">
			<p class="mark">Activités</p>
			<h1>Modules</h1>
			<ProjectSwitch current="modules" />
			<HeroChip />
		</div>
	</header>
	<RoleAlert
		speaker="Têtard mouillé"
		role="Héros de la flaque"
		line="Marceline crie à la bâche, Noé garde le bassin, Irma lit Q et K, Sifflard arbitre les monstres. Je ne monte d’un niveau que si l’énigme est vraie, et ça reste enregistré."
	/>
	<p class="lede">
		Le têtard mouillé ne gagne un niveau et un objet qu’en résolvant une énigme.
		Dans l’arène, on tape des monstres d’eau : ça n’offre rien. Plus on tape vite, plus le coup pèse.
		{#if flaque.save.solved.length < ENIGMAS.length}
			Le kraken du réservoir est le dernier. Il faut les cinq énigmes, pas une de moins.
		{/if}
		{ENIGMAS.filter((enigma) => flaque.save.solved.includes(enigma.id)).length} / {ENIGMAS.length} énigmes résolues.
	</p>
	<ul class="module-grid">
		<li>
			<a href="{base}/modules/pompage">
				<span>01</span>
				<strong>Station de pompage</strong>
				<p>Débit, hauteur et réservoir. Le niveau suit la différence entre production et demande.</p>
			</a>
		</li>
		<li>
			<a href="{base}/modules/bassin">
				<span>02</span>
				<strong>Bassin versant</strong>
				<p>Prélever à plusieurs endroits, par temps sec, sous la pluie ou après un épandage.</p>
			</a>
		</li>
		<li>
			<a href="{base}/modules/gibbs">
				<span>03</span>
				<strong>Énergie de Gibbs</strong>
				<p>Niveaux de G des réactifs et des produits. On peut inverser le sens.</p>
			</a>
		</li>
		<li>
			<a href="{base}/modules/arene">
				<span>04</span>
				<strong>Arène de la flaque</strong>
				<p>Des monstres de plus en plus pénibles. Les coups ne font pas monter le têtard.</p>
			</a>
		</li>
	</ul>
</div>
