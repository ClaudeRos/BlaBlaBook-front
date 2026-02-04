<!-- page par défaut (tableau de bord) -->
<script>
    import { user } from '$lib/stores/auth.js';
	import { onMount } from 'svelte';
  
    onMount(() => {
        console.log($user);
    })
</script>