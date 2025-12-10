<!-- page Formulaire d'édition d'un livre -->

<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import MultiSelectCombobox from '$lib/components/MultiSelectCombobox.svelte';
	import test from 'node:test';
  import { API_URL } from '$lib/config';

  let auteurs = $state([]);
  let genres = $state([]);
  let auteursSelectionnes = $state([]);
  let genresSelectionnes = $state([]);
  let errorMessage = $state('');
  let loading = $state(true);
  let newCoverFile = $state(null);
  let coverPreview = $state(null);
  
  let { data } = $props();
  let book = $state(data.book);
  let formattedDate = $state(book.release_date ? book.release_date.split('T')[0] : '');
  
  onMount(async () => {
    try {
      // Charger les auteurs et les genres en parallèle
      const [authorsResponse, genresResponse, bookResponse ] = await Promise.all([
        fetch(`${API_URL}/authors`),
        fetch(`${API_URL}/genres`),
        fetch(`${API_URL}/book/${book.id}`) // ID du livre à éditer
      ]);

      // Vérifier les réponses
      if (!authorsResponse.ok) {
        throw new Error('Erreur lors de la récupération des auteurs.');
      }
      if (!genresResponse.ok) {
        throw new Error('Erreur lors de la récupération des genres.');
      }

      // Parser les données
      const authorsData = await authorsResponse.json();
      const genresData = await genresResponse.json();
      const bookData = await bookResponse.json();

      // Formatter pour les MultiSelectCombobox
      auteurs = authorsData.map(author => ({
        label: `${author.firstname} ${author.name}`,
        value: author.id
      }));

      genres = genresData.map(genre => ({
        label: genre.name,
        value: genre.id
      }));

      // Pré-remplir les sélections avec les données du livre
      // (si ton backend renvoie déjà les auteurs et genres dans data.book)
      if (book.authors && book.authors.length > 0) {
        auteursSelectionnes = auteurs.filter(a => book.authors.some(b => b.id === a.value));
      }
    
      if (book.genres && book.genres.length > 0) {
        genresSelectionnes = genres.filter(g => bookData.genres.some(bg => bg.id === g.value)
      );
      }

      // console.log('Auteurs sélectionnés:', auteursSelectionnes);
      // console.log('Genres sélectionnés:', genresSelectionnes);

    } catch (err) {
      console.error(err);
      errorMessage = err.message || 'Une erreur est survenue.';
    } finally {
      loading = false;
    }
  });


  function updateDate(event) {
    book.release_date = event.target.value + 'T00:00:00.000Z';
  }

  function handleCoverChange(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
      newCoverFile = files[0];
      coverPreview = URL.createObjectURL(newCoverFile);
    } else {
      newCoverFile = null;
      coverPreview = null;
    }
  }
  
  async function sauvegarder(event) {
    event.preventDefault();
    
    const formData = new FormData();
    
    // Envoie tous les champs du formulaire
    formData.append('title', book.title);
    formData.append('synopsis', book.synopsis);
    formData.append('release_date', book.release_date);
    console.log(auteursSelectionnes,"heu");
    
    formData.append('author_ids', JSON.stringify(auteursSelectionnes.map((a)=>a.value)));
    formData.append('genre_ids', JSON.stringify(genresSelectionnes.map((g)=>g.value)));
    
    // Seulement si une nouvelle cover est uploadée
    if (newCoverFile) {
      formData.append('cover', newCoverFile);
    }

    const response = await fetch(`${API_URL}/book/${book.id}`, {
      method: 'PATCH',
      body: formData
    });

    if (response.ok) {
      alert('Livre modifié avec succès !');
    }
  }

</script>

<h1>Modifier le livre {book.title}</h1>

<form onsubmit={sauvegarder} class="flex flex-col w-1/3">

  <div class="form-field">
    <label for="title">Titre :</label>
    <input id="title" type="text" bind:value={book.title} required/>
  </div>

  <div class="form-field">
    <label for="author">Auteur(s) :</label>
    {#if loading}
      <p>Chargement des auteurs...</p> 
    {:else if errorMessage}
      <p>{errorMessage}</p>
    {:else}    
      <MultiSelectCombobox
        data={auteurs}
        onSelectionChange={(value)=> auteursSelectionnes = value}
        bind:value={auteursSelectionnes}
      /> 
    {/if}  
  </div>

  <div class="form-field">
    <label for="release-date">Date de parution :</label>
    <input id="release-date" type="date" bind:value={formattedDate} onchange={updateDate} />
  </div>

  <div class="form-field">
    <label for="genre">Genre littéraire :</label>
    {#if loading}
      <p>Chargement...</p> 
    {:else if errorMessage}
      <p class="error">{errorMessage}</p>
    {:else}    
      <MultiSelectCombobox
        data={genres}
        onSelectionChange={(value)=> genresSelectionnes = value}
        bind:value={genresSelectionnes}
      /> 
    {/if} 
  </div>

  <div class="form-field">
    <label for="cover">Couverture :</label>
    {#if coverPreview}
      <!-- Affiche la preview de la nouvelle image sélectionnée -->
      <img src={coverPreview} alt="Nouvelle couverture sélectionnée" class="max-w-xs max-h-64 object-contain" />
    {:else if book.cover}
      <!-- Sinon affiche la couverture actuelle -->
      <img src={`${API_URL}${book.cover}`} alt="Couverture actuelle" class="max-w-xs max-h-64 object-contain" />
    {/if}
    <input id="cover" type="file" accept="image/*" onchange={handleCoverChange} />
    {#if newCoverFile}
      <p>Fichier sélectionné : {newCoverFile.name}</p>
    {/if}
  </div>

  <button type="submit">Enregistrer</button>
</form>
