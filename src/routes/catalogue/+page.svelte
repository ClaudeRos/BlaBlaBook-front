<script>
	let { data } = $props();
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/auth.js';
	import { booklistStatus, updateBookStatus, getBookStatus } from '$lib/stores/booklistStore.js';
	import { API_URL } from '$lib/config';

	let loadingBooks = $state(new Set());

	function decodeJWT(token) {
		try {
			const payload = token.split('.')[1];
			const decoded = JSON.parse(atob(payload));
			return decoded;
		} catch (error) {
			console.error('Erreur décodage JWT:', error);
			return null;
		}
	}

	async function checkAllBooksStatus() {
		const token = localStorage.getItem('token');
		if (!token) return;

		const decodedToken = decodeJWT(token);
		if (!decodedToken) return;

		getBookStatus('dummy', new Map());

		let currentStoreMap = new Map();
		const unsubscribe = booklistStatus.subscribe((map) => {
			currentStoreMap = map;
		});
		unsubscribe();

		console.log(
			`DEBUG: ${data.books.length} livres sur la page, store taille: ${currentStoreMap.size}`
		);
		console.log(`DEBUG: IDs en cache:`, Array.from(currentStoreMap.keys()).slice(0, 5));

		const booksToCheck = data.books.filter((book) => !currentStoreMap.has(String(book.id)));

		console.log(`DEBUG: ${booksToCheck.length} livres à vérifier`);

		if (booksToCheck.length === 0) {
			console.log('Tous les statuts sont déjà en cache');
			return;
		}

		const promises = booksToCheck.map(async (book) => {
			try {
				const response = await fetch(
					`${API_URL}/user/${decodedToken.id}/book/${book.id}/status`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json'
						}
					}
				);

				if (response.ok) {
					const result = await response.json();
					updateBookStatus(String(book.id), {
						inBooklist: result.inBooklist,
						toRead: result.toRead !== undefined ? result.toRead : true
					});
				}
			} catch (error) {
				console.error(`Erreur vérification statut livre ${book.id}:`, error);
			}
		});

		await Promise.all(promises);
	}

	async function toggleBookInBooklist(book) {
		if (!$user) {
			goto('/connexion');
			return;
		}

		const token = localStorage.getItem('token');
		if (!token) {
			goto('/connexion');
			return;
		}

		const decodedToken = decodeJWT(token);
		if (!decodedToken) {
			goto('/connexion');
			return;
		}

		let currentStatus = { inBooklist: false, toRead: true };
		booklistStatus.subscribe((map) => {
			currentStatus = getBookStatus(String(book.id), map);
		})();

		loadingBooks.add(book.id);
		loadingBooks = new Set(loadingBooks);

		try {
			if (currentStatus.inBooklist) {
				const response = await fetch(
					`${API_URL}/user/${decodedToken.id}/book/${book.id}`,
					{
						method: 'DELETE',
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json'
						}
					}
				);

				if (response.ok) {
					updateBookStatus(String(book.id), { inBooklist: false, toRead: true });
				}
			} else {
				const response = await fetch(
					`${API_URL}/user/${decodedToken.id}/book/${book.id}`,
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ toRead: true })
					}
				);

				if (response.ok) {
					updateBookStatus(String(book.id), { inBooklist: true, toRead: true });
				}
			}
		} catch (error) {
			console.error('Erreur:', error);
		} finally {
			loadingBooks.delete(book.id);
			loadingBooks = new Set(loadingBooks);
		}
	}

	onMount(() => {
		// Vérifier les statuts seulement si connecté
		if ($user) {
			checkAllBooksStatus();
		}
	});
</script>

<h1>Catalogue</h1>

<section class="catalogue">
	{#each data.books as book}
		<div class="book-container">
			<a href="/livre/{book.id}">
				<img src={`${API_URL}${book.cover}`} alt={book.title} />
			</a>
			<div class="book-description">
				<div class="book">
					<p class="book-title"><a href="/livre/{book.id}">{book.title}</a></p>
					{#if book.authors?.length}
						{#each book.authors as author}
							<p class="book-author">{author.firstname} {author.name}</p>
						{/each}
					{/if}
					<p class="book-synopsis">
						{book.synopsis}
					</p>
				</div>

				<!-- Bouton qui redirige vers /connexion si non connecté -->
				<button
					class="add-button"
					class:in-booklist={$booklistStatus.get(String(book.id))?.inBooklist || false}
					onclick={() => toggleBookInBooklist(book)}
					disabled={loadingBooks.has(book.id)}
				>
					{#if loadingBooks.has(book.id)}
						<div class="loading-spinner"></div>
						Chargement...
					{:else if $booklistStatus.get(String(book.id))?.inBooklist}
						✓ Dans ma booklist
					{:else}
						Ajouter à ma booklist
					{/if}
				</button>
			</div>
		</div>
	{/each}
</section>

<div class="pagination">
	{#if data.page > 1}
		<button onclick={() => goto(`?page=${data.page - 1}`)}>Précédente</button>
	{/if}
	<span>Page {data.page} / {data.totalPages}</span>
	{#if data.page < data.totalPages}
		<button onclick={() => goto(`?page=${data.page + 1}`)}>Suivante</button>
	{/if}
</div>

<style>
	.book-container a {
		width: 35%;
		min-width: 120px;
	}

	.book-container a img {
		display: block;
		object-fit: cover;
		height: 85%;
		aspect-ratio: 2/3;
		border-radius: 10px;
		margin: 0.25rem;
	}

	h1 {
		text-align: center;
		font-family: var(--font-global);
		margin: 2rem 0 1rem 0;
	}

	.catalogue {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		gap: 1rem;
	}

	.book-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-start;
		width: 100%;
		max-width: 900px;
		gap: 1rem;
		margin-bottom: 0.5rem;
		padding: 0.5rem;
		border-radius: 10px;
	}

	.book-container img {
		width: 35%;
		min-width: 120px;
		height: auto;
		object-fit: cover;
		border-radius: 10px;
		margin: 0.25rem;
	}

	.book-title {
		font-weight: 700;
	}

	.book-author {
		font-style: italic;
	}

	.book-synopsis {
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.book-container:nth-child(odd) {
		background-color: var(--couleur-beige-rose);
	}

	.book-container:nth-child(even) {
		background-color: var(--couleur-beige-clair);
	}

	.book-container:nth-child(odd) .book {
		background-color: var(--couleur-beige-clair);
	}

	.book-container:nth-child(even) .book {
		background-color: var(--couleur-beige-rose);
	}

	.book-description {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.5rem;
	}

	.book {
		padding: 1rem;
		font-family: var(--font-global);
		line-height: 1.6;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
		border-radius: 20px;
	}

	.add-button {
		padding: 0.5rem 1rem;
		border-radius: 25px;
		border: none;
		background-color: var(--couleur-vieux-rose);
		color: var(--couleur-beige-clair);
		font-weight: bold;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		font-size: 0.9rem;
		width: auto;
	}

	/* Styles pour le bouton quand le livre est dans la booklist */
	.add-button.in-booklist {
		background-color: var(--couleur-beige-clair);
		color: var(--couleur-marron);
		border: 2px solid var(--couleur-marron);
		font-weight: bold;
	}

	/* Style pour les boutons désactivés */
	.add-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.add-button:disabled:hover {
		transform: none;
		box-shadow: none;
	}

	/* Spinner de chargement */
	.loading-spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-right: 0.5rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.pagination {
		text-align: center;
	}

	.pagination button {
		margin: 1rem 1rem 2.8rem 1rem;
	}

	/* Media Queries */

	@media (min-width: 768px) {
		.book-container img {
			width: 30%;
		}

		.book-synopsis {
			line-clamp: 7;
			-webkit-line-clamp: 7;
		}

		.book {
			padding: 1.5rem;
		}
		.add-button {
			font-size: 1rem;
			padding: 0.5rem 1.2rem;
		}
	}

	.book-container a {
		display: block;
	}

	.book-container a img {
		width: 100%;
		height: auto;
	}

	@media (min-width: 1024px) {
		.catalogue {
			gap: 2rem;
		}

		.book-container {
			gap: 2rem;
			align-items: center;
		}

		.book {
			padding: 2rem;
		}

		.add-button {
			align-self: flex-end;
		}
	}
</style>
