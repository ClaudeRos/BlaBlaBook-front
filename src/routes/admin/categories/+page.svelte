<!-- page Liste des catégories  -->

<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { API_URL } from '$lib/config';

	let genresList = [];    
    let totalGenres = 0;
	let errorMessage = '';

	// function decodeJWT(token) {
	// 	try {
	// 		const payload = token.split('.')[1];
	// 		const decoded = JSON.parse(atob(payload));
	// 		return decoded;
	// 	} catch (error) {
	// 		console.error('Erreur décodage JWT:', error);
	// 		return null;
	// 	}
	// }

	async function loadGenres() {
		// const token = localStorage.getItem('token');
		// if (!token) {
		// 	goto('/authentification/connexion');
		// 	return;
		// }

		try {
			const res = await fetch(`${API_URL}/genres`, {
				// headers: { Authorization: `Bearer ${token}` }
			});

			if (!res.ok) throw new Error('Erreur lors de la récupération des catégories');

			const data = await res.json();

			genresList = data.genres || [];
			totalGenres = data.totalGenres || genresList.length;            

		} catch (err) {
			console.error(err);
			errorMessage = err.message || 'Une erreur est survenue';
		}
	}

	function addGenre() {
		goto(`/admin/categories/ajout`);
	}

	function editGenre(genre) {
		goto(`/admin/categories/${genre.id}/edit`);
	}

	async function removeGenre(genre) {
		// const token = localStorage.getItem('token');
		// if (!token) {
		// 	goto('/authentification/connexion');
		//     return;
		// }

	// 	// const decodedToken = decodeJWT(token);
	// 	// if (!decodedToken) return;

		try {
			console.log(`Suppression de la catégorie: ${genre.name}`);

			const response = await fetch(
				`${API_URL}/genre/${genre.id}`,
				{
					method: 'DELETE',
					headers: {
						// Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				}
			);

			if (response.ok) {
				// Supprimer la catégorie de la liste locale
				genresList = genresList.filter((g) => g.id !== genre.id);
				totalGenres = Math.max(0, totalGenres - 1);

                loadGenres();

				console.log('Catégorie supprimée');
			} else {
				console.error('Erreur lors de la suppression');
			}
		} catch (error) {
			console.error('Erreur:', error);
		}
	}

	onMount(() => {
		loadGenres();
	});

</script>

<section class="genrelist">
    <header class="page_title">
        <h1>Liste des catégories</h1>
		<button
			class="add-genre"
			aria-label="Ajouter une catégorie"
			onclick={() => addGenre()}
		>Ajouter une catégorie</button>
	</header>

	{#if errorMessage}
		<p class="error">{errorMessage}</p>
	{:else if totalGenres === 0}
		<p class="no-genre">Aucune catégorie trouvée.</p>
	{:else}
		{#each genresList as genre}
			<article class="genre">
				<div class="genre_data">
					<div class="genre_info">
						<!-- <p class="genre_name"><a href="/livre/{book.id}">{genre.name}</a></p> -->
                         <p class="genre_name">{genre.name}</p>
					</div>
				</div>
				<div class="buttons">
					<button
						class="edit-genre"
						aria-label="Modifier les informations de la catégorie"
						onclick={() => editGenre(genre)}
					>
                    	<span class="icon-wrapper">
							<span class="material-symbols--edit-rounded"></span>
						</span>
					</button>
					<button
						class="delete-genre"
						aria-label="Supprimer la catégorie"
						onclick={() => removeGenre(genre)}
					>
						<span class="icon-wrapper">
							<span class="material-symbols--delete-rounded"></span>
						</span>
					</button>
				</div>
			</article>
		{/each}
	{/if}
</section>

<style>
	.genrelist {
		display: flex;
		flex-direction: column;
		min-height: 80vh;
	}

	.page_title {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 1.8rem 1.8rem 1rem 1.8rem;
	}
/* 
	.genrelist-title {
		display: flex;
		gap: 0.7rem;
		align-items: baseline;
	} */

	.page_title h1 {
		font-size: 28px;
	}

	.no-genre {
		margin-left: 1rem;
	}

	.genre {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: nowrap;
		gap: 0.5rem;
		overflow: hidden;
	}

	.genre_data {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		min-width: 0;
		flex-shrink: 1;
	}

	.genre_info {
		min-width: 0;
	}

	.genre_name {
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.buttons {
		display: flex;
		flex-shrink: 0;
		gap: 0.5rem;
	}

	.icon-wrapper {
		display: flex;
	}

	.material-symbols--edit-rounded {
		display: inline-block;
		width: 2rem;
		height: 2rem;
		background-repeat: no-repeat;
		background-size: 100% 100%;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23626262' d='M4 21q-.425 0-.712-.288T3 20v-2.425q0-.4.15-.763t.425-.637L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.437.65T21 6.4q0 .4-.138.763t-.437.662l-12.6 12.6q-.275.275-.638.425t-.762.15zM17.6 7.8L19 6.4L17.6 5l-1.4 1.4z'/%3E%3C/svg%3E");
	}

	.material-symbols--delete-rounded {
		display: inline-block;
		width: 2rem;
		height: 2rem;
		background-repeat: no-repeat;
		background-size: 100% 100%;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23626262' d='M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zm3-4q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17'/%3E%3C/svg%3E");
	}

	article:nth-child(even) {
		background-color: var(--couleur-beige-clair);
	}

	.error {
		color: #d32f2f;
		background-color: #ffebee;
		padding: 1rem;
		border-radius: 8px;
		border-left: 4px solid #d32f2f;
		margin: 1rem;
		font-weight: 500;
	}

	/* MEDIA QUERIES */
	@media (max-width: 768px) {
		.genre {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 0.5rem;
			overflow: hidden;
		}

		.genre_data {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			flex-shrink: 1;
			min-width: 0;
		}

		.genre_info {
			min-width: 0;
		}

		.genre_name {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.buttons {
			flex-shrink: 0;
			display: flex;
			gap: 0.3rem;
		}
	}

	@media (min-width: 1025px) {
		/* .delete-booklist {
			margin-right: 1rem;
		} */
	}
</style>

