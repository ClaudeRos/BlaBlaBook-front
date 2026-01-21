<!-- Composant réutilisable pour créer/modifier un auteur -->

<script>
  import { goto } from '$app/navigation';
  import { API_URL } from '$lib/config';

  // Props
  let { authorId = null, initialAuthor = null } = $props();

  // État
  let errorMessage = $state('');
  let loading = $state(false);

  // Données de l'auteur
  let firstname = $state(initialAuthor?.firstname || '');
  let name = $state(initialAuthor?.name || '');
  let bio = $state(initialAuthor?.bio || '');

  // Calculer si on est en mode édition
  const isEditMode = $derived(authorId !== null);

  async function handleSubmit(event) {
    event.preventDefault();
    errorMessage = '';

    // Validation
    if (!firstname.trim()) {
      errorMessage = 'Le prénom est requis.';
      return;
    }

    if (!name.trim()) {
      errorMessage = 'Le nom est requis.';
      return;
    }

    if (!bio.trim()) {
      errorMessage = 'La biographie est requise.';
      return;
    }

    loading = true;

    const author = {
      firstname: firstname.trim(),
      name: name.trim(),
      bio: bio.trim()
    };

    try {
      const url = isEditMode 
        ? `${API_URL}/author/${authorId}`
        : `${API_URL}/author`;
      
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(author)
      });

      if (response.ok) {
        goto('/admin/auteurs');
      } else {
        const error = await response.json();
        errorMessage = error.message || `L'auteur n'a pas pu être ${isEditMode ? 'modifié' : 'créé'}.`;
      }
    } catch (error) {
      console.error('Erreur:', error);
      errorMessage = `Une erreur est survenue lors de la ${isEditMode ? 'modification' : 'création'} de l'auteur.`;
    } finally {
      loading = false;
    }
  }
</script>

<div class="form-container">
  <header class="form-header">
    <h1>
      {#if isEditMode}
        Modifier l'auteur "{initialAuthor?.firstname} {initialAuthor?.name}"
      {:else}
        Créer un nouvel auteur
      {/if}
    </h1>
  </header>

  {#if errorMessage}
    <p class="error-message">{errorMessage}</p>
  {/if}

  <form onsubmit={handleSubmit}>
    <div class="form-field">
      <label for="firstname">Prénom</label>
      <input id="firstname" type="text" bind:value={firstname} required />
    </div>

    <div class="form-field">
      <label for="name">Nom</label>
      <input id="name" type="text" bind:value={name} required />
    </div>

    <div class="form-field">
      <label for="bio">Biographie</label>
      <textarea id="bio" bind:value={bio} rows="5" required></textarea>
    </div>

    <button type="submit" disabled={loading}>
      {#if loading}
        {isEditMode ? 'Enregistrement...' : `Création...`}
      {:else}
        {isEditMode ? 'Enregistrer les modifications' : `Créer l'auteur`}
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

  input[type="text"],
  textarea {
    padding: 0.75rem;
    border-radius: 0.25rem;
    border: 1px solid #ccc;
    font-family: var(--font-global);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }

  input[type="text"]:focus,
  textarea:focus {
    outline: none;
    border-color: var(--couleur-bleu-vert);
    box-shadow: 0 0 0 3px rgba(99, 166, 166, 0.1);
  }

  textarea {
    resize: vertical;
    min-height: 100px;
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