<!-- Composant réutilisable pour créer/modifier un livre -->

<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { API_URL } from '$lib/config';
  import MultiSelectCombobox from '$lib/components/MultiSelectCombobox.svelte';
	import { Book } from 'lucide-svelte';

  // Props
  let { bookId = null, initialBook = null } = $props();

  // État
  let auteurs = $state([]);
  let genres = $state([]);
  let auteursSelectionnes = $state([]);
  let genresSelectionnes = $state([]);
  let errorMessage = $state('');
  let loading = $state(true);

  // Données du livre
  let title = $state(initialBook?.title || '');
  let synopsis = $state(initialBook?.synopsis || '');
  let releaseDate = $state(
    initialBook?.release_date 
      ? initialBook.release_date.split('T')[0] 
      : ''
  );
  let currentCover = $state(initialBook?.cover || null);
  let coverFile = $state(null);
  let coverPreview = $state(null);
  let fileInput;

  // Calculer si on est en mode édition
  const isEditMode = $derived(bookId !== null);

  onMount(async () => {
    try {
      const [authorsResponse, genresResponse] = await Promise.all([
        fetch(`${API_URL}/authors`),
        fetch(`${API_URL}/genres`)
      ]);

      if (!authorsResponse.ok) {
        throw new Error('Erreur lors de la récupération des auteurs.');
      }
      if (!genresResponse.ok) {
        throw new Error('Erreur lors de la récupération des genres.');
      }

      const authorsData = await authorsResponse.json();
      const genresData = await genresResponse.json();
      console.log(authorsData);
      

      auteurs = authorsData.authors.map(author => ({
        label: `${author.firstname} ${author.name}`,
        value: author.id
      }));

      genres = genresData.genres.map(genre => ({
        label: genre.name,
        value: genre.id
      }));

      // Pré-remplir les sélections en mode édition
      if (isEditMode && initialBook) {
        if (initialBook.authors && initialBook.authors.length > 0) {
          auteursSelectionnes = auteurs.filter(a => initialBook.authors.some(b => b.id === a.value));
        }
    
        if (initialBook.genres && initialBook.genres.length > 0) {
          genresSelectionnes = genres.filter(g => initialBook.genres.some(bg => bg.id === g.value));
        }
      }

    } catch (err) {
      console.error(err);
      errorMessage = err.message || 'Une erreur est survenue.';
    } finally {
      loading = false;
    }
  });

  function handleFilenameChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      coverFile = file;
    
      const reader = new FileReader();
      reader.onload = (e) => {
        coverPreview = e.target?.result;
      };
      reader.readAsDataURL(file);
    } else {
      coverFile = null;
      coverPreview = null;
    }
  }

  function truncateFilename(filename, maxLength = 30) {
    if (filename.length <= maxLength) return filename;
  
    const extension = filename.substring(filename.lastIndexOf('.'));
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);
  
    return `${truncatedName}...${extension}`;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    errorMessage = '';

    const token = localStorage.getItem('token');  

    // Validation
    if (!title.trim()) {
      errorMessage = 'Le titre est requis.';
      return;
    }

    if (!synopsis.trim()) {
      errorMessage = 'Le synopsis est requis.';
      return;
    }

    if (!isEditMode && !coverFile) {
      errorMessage = 'La couverture est requise.';
      return;
    }

    if (auteursSelectionnes.length === 0) {
      errorMessage = 'Au moins un auteur est requis.';
      return;
    }

    if (genresSelectionnes.length === 0) {
      errorMessage = 'Au moins un genre est requis.';
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('synopsis', synopsis);
    if (releaseDate) formData.append('release_date', releaseDate + 'T00:00:00.000Z');
    formData.append('author_ids', JSON.stringify(auteursSelectionnes.map(a => a.value)));
    formData.append('genre_ids', JSON.stringify(genresSelectionnes.map(g => g.value)));
    
    if (coverFile) {
      formData.append('cover', coverFile);
    }

    try {
      const url = isEditMode 
        ? `${API_URL}/book/${bookId}`
        : `${API_URL}/book`;
      
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        goto('/admin/livres');
      } else {
        const error = await response.json();
        errorMessage = error.message || `Le livre n'a pas pu être ${isEditMode ? 'modifié' : 'créé'}.`;
      }
    } catch (error) {
      console.error('Erreur:', error);
      errorMessage = `Une erreur est survenue lors de la ${isEditMode ? 'modification' : 'création'} du livre.`;
    }
  }
</script>

<div class="form-container">
  <header class="form-header">
    <h1>
      {#if isEditMode}
        Modifier le livre "{initialBook?.title}"
      {:else}
        Créer un nouveau livre
      {/if}
    </h1>
  </header>

  {#if errorMessage}
    <p class="error-message">{errorMessage}</p>
  {/if}

  <form onsubmit={handleSubmit}>
    <div class="form-field">
      <label for="title">Titre</label>
      <input id="title" type="text" bind:value={title} required />
    </div>

    <div class="form-field">
      <label for="synopsis">Synopsis</label>
      <textarea id="synopsis" bind:value={synopsis} rows="5" required></textarea>
    </div>

    <div class="form-field">
      <label for="author">Auteur(s)</label>
      {#if loading}
        <p class="loading-text">Chargement des auteurs...</p> 
      {:else if errorMessage && auteurs.length === 0}
        <p class="error-text">{errorMessage}</p>
      {:else}    
        <MultiSelectCombobox
          data={auteurs}
          onSelectionChange={(value) => auteursSelectionnes = value}
          bind:value={auteursSelectionnes}
        /> 
      {/if}  
    </div>

    <div class="form-field">
      <label for="genre">Genre(s) littéraire(s)</label>
      {#if loading}
        <p class="loading-text">Chargement des genres...</p> 
      {:else if errorMessage && genres.length === 0}
        <p class="error-text">{errorMessage}</p>
      {:else}    
        <MultiSelectCombobox
          data={genres}
          onSelectionChange={(values) => genresSelectionnes = values}
          bind:value={genresSelectionnes}
        /> 
      {/if}  
    </div>

    <div class="form-field">
      <label for="release-date">Date de parution</label>
      <input id="release-date" type="date" bind:value={releaseDate} />
    </div>

    <div class="form-field">
      <label for="cover">Couverture</label>
      
      <div class="cover-container">
        <div class="upload-section">
          {#if isEditMode && currentCover}
            <div class="current-cover">
              <p class="cover-label">Couverture actuelle :</p>
              <img src={`${API_URL}${currentCover}`} alt={title} />
            </div>
            
            <div class="new-cover-upload">
              <p class="cover-label">Modifier la couverture (optionnel) :</p>
              <button
                type="button"
                class="custom-file-button"
                onclick={() => fileInput.click()}
              >
                Choisir une nouvelle couverture
              </button>
            </div>
          {:else}
            <button
              type="button"
              class="custom-file-button"
              onclick={() => fileInput.click()}
            >
              Choisir une couverture
            </button>
          {/if}

          <span class="custom-file-label">
            {#if coverFile}
              {truncateFilename(coverFile.name)}
            {:else if !isEditMode}
              Aucun fichier sélectionné
            {/if}
          </span>

          <input
            id="cover"
            type="file"
            accept="image/*"
            bind:this={fileInput}
            onchange={handleFilenameChange}
            required={!isEditMode}
          />
        </div>
        
        {#if coverPreview}
          <div class="cover-preview">
            <p class="cover-label">Aperçu :</p>
            <img src={coverPreview} alt="Aperçu de la nouvelle couverture" />
          </div>
        {/if}
      </div>
    </div>

    <button type="submit" disabled={loading}>
      {isEditMode ? 'Enregistrer les modifications' : 'Créer le livre'}
    </button>
  </form>
</div>

<style>
  .form-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    border-radius: 30px;
    background-color: white;
    box-shadow: 0 4px 20px rgba(89, 68, 50, 0.1);
  }

  .form-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--couleur-beige-clair);
  }

  .form-header h1 {
    color: var(--couleur-marron);
    font-size: 28px;
    font-weight: 600;
  }

  .error-message {
    color: var(--couleur-vieux-rose);
    background-color: #f9e6e6;
    padding: 1rem;
    border-radius: 0.25rem;
    text-align: center;
    margin-bottom: 1.5rem;
    font-weight: 500;
    border-left: 4px solid var(--couleur-vieux-rose);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Force le MultiSelectCombobox à prendre toute la largeur */
  .form-field :global(> *) {
    width: 100%;
  }

  label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--couleur-marron);
  }

  input[type="text"],
  input[type="date"],
  textarea {
    padding: 0.75rem;
    border-radius: 0.25rem;
    border: 1px solid #ccc;
    font-family: var(--font-global);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }

  input[type="text"]:focus,
  input[type="date"]:focus,
  textarea:focus {
    outline: none;
    border-color: var(--couleur-bleu-vert);
    box-shadow: 0 0 0 3px rgba(99, 166, 166, 0.1);
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  .cover-container {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
  }

  .upload-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .current-cover,
  .new-cover-upload {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cover-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--couleur-marron);
  }

  .current-cover img {
    max-width: 150px;
    max-height: 225px;
    object-fit: contain;
    border: 2px solid var(--couleur-beige-rose);
    border-radius: 0.25rem;
    box-shadow: 0 4px 10px rgba(89, 68, 50, 0.2);
  }

  .cover-preview {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    margin-right: 1rem;
  }

  .cover-preview img {
    max-width: 150px;
    max-height: 225px;
    object-fit: contain;
    border: 2px solid var(--couleur-bleu-vert);
    border-radius: 0.25rem;
    box-shadow: 0 4px 10px rgba(99, 166, 166, 0.3);
  }

  .loading-text,
  .error-text {
    padding: 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.9rem;
  }

  .loading-text {
    background-color: var(--couleur-beige-clair);
    color: var(--couleur-marron);
  }

  .error-text {
    background-color: #f9e6e6;
    color: var(--couleur-vieux-rose);
  }

  /* Cache l'input natif */
  .upload-section input[type="file"] {
    display: none;
  }

  /* Bouton personnalisé */
  .custom-file-button {
    margin: 1rem 0;
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 1px 3px 10px 1px rgba(80, 79, 79, 0.25);
    align-self: flex-start;
  }

  .custom-file-button:hover {
    background-color: var(--couleur-marron);
    transform: translateY(-1px);
    box-shadow: 1px 4px 12px 1px rgba(80, 79, 79, 0.35);
  }

  /* Label du fichier sélectionné */
  .custom-file-label {
    display: inline-block;
    font-size: 0.9rem;
    color: #555;
    font-style: italic;
    max-width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  button[type="submit"] {
    align-self: center;
    margin-top: 1rem;
    padding: 0.875rem 2.5rem;
    background-color: var(--couleur-vieux-rose);
    color: var(--couleur-beige-clair);
    border: none;
    border-radius: 20rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 1px 3px 10px 1px rgba(80, 79, 79, 0.3);
    transition: all 0.3s ease;
  }

  button[type="submit"]:hover:not(:disabled) {
    background-color: var(--couleur-marron);
    transform: translateY(-2px);
    box-shadow: 1px 5px 15px 1px rgba(80, 79, 79, 0.4);
  }

  button[type="submit"]:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    .form-container {
      margin: 1rem;
      padding: 1.5rem;
    }

    .form-header h1 {
      font-size: 24px;
    }

    .cover-container {
      flex-direction: column;
    }

    .cover-preview {
      align-self: center;
    }
  }
</style>