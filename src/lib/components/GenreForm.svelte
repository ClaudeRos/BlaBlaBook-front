<!-- Composant réutilisable pour créer/modifier un genre -->

<script>
  import { goto } from '$app/navigation';
  import { API_URL } from '$lib/config';

  // Props
  let { genreId = null, initialGenre = null } = $props();

  // État
  let errorMessage = $state('');
  let loading = $state(false);

  // Données du genre
  let name = $state(initialGenre?.name || '');


  // Calculer si on est en mode édition
  const isEditMode = $derived(genreId !== null);

  async function handleSubmit(event) {
    event.preventDefault();
    errorMessage = '';

    // Validation
    if (!name.trim()) {
      errorMessage = 'Le nom du genre littéraire est requis.';
      return;
    }

    loading = true;

    const genre = {
      name: name.trim()
    };

    try {
      const url = isEditMode 
        ? `${API_URL}/genre/${genreId}`
        : `${API_URL}/genre`;
      
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(genre)
      });

      if (response.ok) {
        goto('/admin/categories');
      } else {
        const error = await response.json();
        errorMessage = error.message || `Le genre littéraire n'a pas pu être ${isEditMode ? 'modifié' : 'créé'}.`;
      }
    } catch (error) {
      console.error('Erreur:', error);
      errorMessage = `Une erreur est survenue lors de la ${isEditMode ? 'modification' : 'création'} du genre littéraire.`;
    } finally {
      loading = false;
    }
  }
</script>

<div class="form-container">
  <header class="form-header">
    <h1>
      {#if isEditMode}
        Modifier le genre "{initialGenre?.name}"
      {:else}
        Créer un nouveau genre littéraire
      {/if}
    </h1>
  </header>

  {#if errorMessage}
    <p class="error-message">{errorMessage}</p>
  {/if}

  <form onsubmit={handleSubmit}>
    <div class="form-field">
      <label for="name">Nom du genre littéraire</label>
      <input id="name" type="text" bind:value={name} required />
    </div>

    <button type="submit" disabled={loading}>
      {#if loading}
        {isEditMode ? 'Enregistrement...' : `Création...`}
      {:else}
        {isEditMode ? 'Enregistrer les modifications' : `Créer le genre littéraire`}
      {/if}
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

  label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--couleur-marron);
  }

  input[type="text"] {
    padding: 0.75rem;
    border-radius: 0.25rem;
    border: 1px solid #ccc;
    font-family: var(--font-global);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }

  input[type="text"]:focus {
    outline: none;
    border-color: var(--couleur-bleu-vert);
    box-shadow: 0 0 0 3px rgba(99, 166, 166, 0.1);
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
  }
</style>