<!-- Formulaire de création d'un livre -->

<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import MultiSelectCombobox from '$lib/components/MultiSelectCombobox.svelte';
  // import FileUploader from "$lib/components/FileUploader.svelte";

  let auteurs = $state([]);
  let genres = $state([]);
  let auteursSelectionnes = $state([]);
  let genresSelectionnes = $state([]);
  let errorMessage = $state('');
  let loading = $state(true);

  // Données du nouveau livre
  let title = $state('');
  let synopsis = $state('');
  let releaseDate = $state('');
  let coverFile = $state(null);
  let coverPreview = $state(null);
  let fileInput;

  onMount(async () => {
    try {
      // Charger les auteurs et les genres en parallèle
      const [authorsResponse, genresResponse] = await Promise.all([
        fetch('http://localhost:3000/authors'),
        fetch('http://localhost:3000/genres')
      ]);

      if (!authorsResponse.ok) {
        throw new Error('Erreur lors de la récupération des auteurs.');
      }
      if (!genresResponse.ok) {
        throw new Error('Erreur lors de la récupération des genres.');
      }

      const authorsData = await authorsResponse.json();
      const genresData = await genresResponse.json();

      auteurs = authorsData.map(author => ({
        label: `${author.firstname} ${author.name}`,
        value: author.id
      }));

      genres = genresData.map(genre => ({
        label: genre.name,
        value: genre.id
      }));

      console.log('Auteurs:', auteurs);
      console.log('Genres:', genres);

    } catch (err) {
      console.error(err);
      errorMessage = err.message || 'Une erreur est survenue.';
    } finally {
      loading = false;
    }
  });

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      coverFile = file;
      console.log('Fichier sélectionné:', file.name);
        
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
      coverPreview = e.target?.result;
      };
      reader.readAsDataURL(file);
    } else {
      // Réinitialiser si aucun fichier
      coverFile = null;
      coverPreview = null;
    }
  }

  async function createBook(event) {
    event.preventDefault();

    // Validation côté client
    if (!title.trim()) {
      alert('Le titre est requis.');
      return;
    }

    if (!synopsis.trim()) {
      alert('Le synopsis est requis.');
      return;
    }

    if (!coverFile) {
      alert('La couverture est requise.');
      return;
    }

    if (auteursSelectionnes.length === 0) {
      alert('Au moins un auteur est requis.');
      return;
    }

    if (genresSelectionnes.length === 0) {
      alert('Au moins un genre est requis.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('synopsis', synopsis);
    if (releaseDate) formData.append('release_date', releaseDate + 'T00:00:00.000Z');
    formData.append('author_ids', JSON.stringify(auteursSelectionnes.map((a)=>a.value)));
    formData.append('genre_ids', JSON.stringify(genresSelectionnes.map((g)=>g.value)));
    formData.append('cover', coverFile);

    try {
      const response = await fetch('http://localhost:3000/book', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert('Livre créé avec succès !');
        goto('/admin/livres'); // Redirection vers la liste des livres
      } else {
        const error = await response.json();
        alert(`Erreur : ${error.message || 'Le livre n\'a pas pu être créé.'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Une erreur est survenue lors de la création du livre.');
    }
  }

  function truncateFilename(filename, maxLength = 30) {
    if (filename.length <= maxLength) return filename;
  
    const extension = filename.substring(filename.lastIndexOf('.'));
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);
  
    return `${truncatedName}...${extension}`;
  }

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
</script>

<div class="form-container">
  <header class="form-header">
    <h1>Créer un nouveau livre</h1>
  </header>

  {#if errorMessage}
    <p class="error-message">{errorMessage}</p>
  {/if}

  <form onsubmit={createBook}>
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
          onSelectionChange={(values) => auteursSelectionnes = values}
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
          <button
            type="button"
            class="custom-file-button"
            onclick={() => fileInput.click()}
          >
            Choisir une couverture
          </button>

          <span class="custom-file-label">
            {#if coverFile}
              {truncateFilename(coverFile.name)}
            {:else}
              Aucun fichier sélectionné
            {/if}
          </span>

          <input
            id="cover"
            type="file"
            accept="image/*"
            bind:this={fileInput}
            onchange={handleFilenameChange}
            required
          />
        </div>
        <!-- <FileUploader
          label="Choisir une couverture"
          accept="image/*"
          showPreview={true}
          onselect={(e) => coverFile.set(e.detail)}
        /> -->
        
        {#if coverPreview}
          <div class="cover-preview">
            <img src={coverPreview} alt="Aperçu de la couverture" />
          </div>
        {/if}
      </div>
    </div>

    <button type="submit" disabled={loading}>Créer le livre</button>
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
  }

  /* .file-info {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #666;
    font-style: italic;
  } */

  .cover-preview {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 1rem;
  }

  .cover-preview img {
    max-width: 150px;
    max-height: 225px;
    object-fit: contain;
    border: 2px solid var(--couleur-beige-rose);
    border-radius: 0.25rem;
    box-shadow: 0 4px 10px rgba(89, 68, 50, 0.2);
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

  /* Cache l’input natif */
.upload-section input[type="file"] {
  display: none;
}

/* Bouton personnalisé */
.custom-file-button {
  margin: 1rem;
  font-size: 0.9rem;
  padding: 0.5rem 1rem 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 1px 3px 10px 1px rgba(80, 79, 79, 0.25);
}

.custom-file-button:hover {
  background-color: var(--couleur-marron);
  transform: translateY(-1px);
  box-shadow: 1px 4px 12px 1px rgba(80, 79, 79, 0.35);
}

/* Label du fichier sélectionné */
.custom-file-label {
  display: inline-block;
  margin-left: 1rem;
  font-size: 0.9rem;
  color: #555;
  font-style: italic;
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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