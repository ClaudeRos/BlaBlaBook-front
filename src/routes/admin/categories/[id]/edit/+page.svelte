<!-- page Formulaire d'édition d'un genre littéraire -->

<script>
  import GenreForm from '$lib/components/GenreForm.svelte';
  let { data } = $props();
</script>

<GenreForm 
  genreId={data.genre.id} 
  initialGenre={data.genre} 
/>