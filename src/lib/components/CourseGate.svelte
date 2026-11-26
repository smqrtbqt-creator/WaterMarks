<script lang="ts">
	import { courseSnapshot, ensureCourseClock } from '$lib/game/courseClock.svelte';
	import { formatCourseRemaining } from '$lib/game/courseHours';

	let { children } = $props();

	ensureCourseClock();
	const hours = $derived(courseSnapshot());
	const remaining = $derived(Math.max(0, hours.remainingSeconds));
	const clockHours = $derived(String(Math.floor(remaining / 3600)).padStart(2, '0'));
	const clockMinutes = $derived(String(Math.floor((remaining % 3600) / 60)).padStart(2, '0'));
	const clockSeconds = $derived(String(remaining % 60).padStart(2, '0'));
</script>

<p class="course-timer" class:closed={!hours.open} aria-live="polite">
	Je dois travailler pendant les horaires de cours.
	<span class="course-clock">{clockHours}:{clockMinutes}:{clockSeconds}</span>
	{#if hours.open}
		Les modules ferment à 8 h. Fermeture dans {formatCourseRemaining(hours.remainingSeconds)}.
	{:else}
		Les modules sont inaccessibles de 8 h à 17 h. Reprise dans {formatCourseRemaining(hours.remainingSeconds)}.
	{/if}
</p>

{#if hours.open}
	{@render children()}
{:else}
	<p class="lede">Les modules reprennent à 17 h.</p>
{/if}
