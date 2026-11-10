<script lang="ts">
	let { speaker, role, line }: { speaker: string; role: string; line: string } = $props();
</script>

<aside class="role-alert" aria-live="polite">
	<p class="mark">{role}</p>
	<p><strong>{speaker}.</strong> « {line} »</p>
</aside>
