<!-- page Formulaire d'édition d'un auteur -->

<script>
  import AuthorForm from '$lib/components/AuthorForm.svelte';
  let { data } = $props();
</script>

<AuthorForm 
  authorId={data.author.id} 
  initialAuthor={data.author} 
/>