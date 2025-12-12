<!-- page Formulaire d'édition d'un livre -->

<script>
  import BookForm from '$lib/components/BookForm.svelte';
  let { data } = $props();
</script>

<BookForm 
  bookId={data.book.id} 
  initialBook={data.book} 
/>