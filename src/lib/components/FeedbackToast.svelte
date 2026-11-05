<script lang="ts">
	import type { Toast } from '$lib/feedback';

	let {
		toasts = $bindable([]),
		ttlMs = 3800
	}: {
		toasts: Toast[];
		ttlMs?: number;
	} = $props();

	const timers = new Map<number, ReturnType<typeof setTimeout>>();

	$effect(() => {
		for (const toast of toasts) {
			if (timers.has(toast.id)) continue;
			const id = toast.id;
			const handle = setTimeout(() => {
				toasts = toasts.filter((item) => item.id !== id);
				timers.delete(id);
			}, ttlMs);
			timers.set(id, handle);
		}
		return () => {
			for (const handle of timers.values()) clearTimeout(handle);
			timers.clear();
		};
	});

	function dismiss(id: number) {
		const handle = timers.get(id);
		if (handle) clearTimeout(handle);
		timers.delete(id);
		toasts = toasts.filter((item) => item.id !== id);
	}
</script>

{#if toasts.length}
	<div class="feedback-stack" aria-live="polite" aria-relevant="additions">
		{#each toasts as toast (toast.id)}
			<div class="feedback-toast feedback-{toast.kind}" role="status">
				<p>{toast.text}</p>
				<button type="button" class="feedback-close" aria-label="Fermer" onclick={() => dismiss(toast.id)}>
					×
				</button>
			</div>
		{/each}
	</div>
{/if}
