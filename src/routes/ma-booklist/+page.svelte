<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { updateBookStatus } from '$lib/stores/booklistStore.js';
	import { API_URL } from '$lib/config';

	let booklist = [];
	let totalBooks = 0;
	let page = 1;
	let totalPages = 1;
	let errorMessage = '';

	const limit = 10;

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

	async function toggleReadStatus(book) {
		const token = localStorage.getItem('token');
		if (!token) {
			goto('/authentification/connexion');
			return;
		}

		const decodedToken = decodeJWT(token);
		if (!decodedToken) {
			goto('/authentification/connexion');
			return;
		}

		try {
			const response = await fetch(
				`${API_URL}/user/${decodedToken.id}/book/${book.book.id}`,
				{
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ toRead: !book.toRead })
				}
			);

			if (response.ok) {
				// Mettre à jour localement le statut du livre
				const bookIndex = booklist.findIndex((b) => b.book.id === book.book.id);
				if (bookIndex !== -1) {
					booklist[bookIndex].toRead = !booklist[bookIndex].toRead;
					booklist = [...booklist]; // Forcer la réactivité

					// Mettre à jour le store global
					updateBookStatus(String(book.book.id), {
						inBooklist: true,
						toRead: booklist[bookIndex].toRead
					});
				}
			} else {
				console.error('Erreur lors de la sauvegarde du statut');
			}
		} catch (error) {
			console.error('Erreur:', error);
		}
	}

	async function loadBooks(pageNumber = 1) {
		const token = localStorage.getItem('token');
		if (!token) {
			goto('/authentification/connexion');
			return;
		}

		try {
			const res = await fetch(`${API_URL}/userbooks?page=${pageNumber}&limit=${limit}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!res.ok) throw new Error('Erreur lors de la récupération des livres');

			const data = await res.json();

			booklist = data.userbooks || [];
			totalBooks = data.totalBooks || booklist.length;
			page = data.page;
			totalPages = data.totalPages;

			// Alimenter le store global avec les données de la booklist
			booklist.forEach((bookItem) => {
				updateBookStatus(bookItem.book.id, {
					inBooklist: true,
					toRead: bookItem.toRead
				});
			});
		} catch (err) {
			console.error(err);
			errorMessage = err.message || 'Une erreur est survenue';
		}
	}

	async function removeBook(book) {
		const token = localStorage.getItem('token');
		if (!token) return;

		const decodedToken = decodeJWT(token);
		if (!decodedToken) return;

		try {
			console.log(`Suppression du livre: ${book.book.title}`);

			const response = await fetch(
				`${API_URL}/user/${decodedToken.id}/book/${book.book.id}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				}
			);

			if (response.ok) {
				// Supprimer le livre de la liste locale
				booklist = booklist.filter((b) => b.book.id !== book.book.id);
				totalBooks = Math.max(0, totalBooks - 1);

				// Mettre à jour le store global
				updateBookStatus(String(book.book.id), { inBooklist: false, toRead: true });

				console.log('Livre supprimé');
			} else {
				console.error('Erreur lors de la suppression');
			}
		} catch (error) {
			console.error('Erreur:', error);
		}
	}

	onMount(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const currentPage = Number(searchParams.get('page')) || 1;
		loadBooks(currentPage);
	});

	function goToPage(newPage) {
		loadBooks(newPage);
		goto(`?page=${newPage}`, { replaceState: true });
	}
</script>

<section class="booklist">
	<header class="page_title">
		<div class="booklist-title">
			<h1>Ma booklist</h1>
			<p class="books-number">{totalBooks} Livre{totalBooks > 1 ? 's' : ''}</p>
		</div>
		<p class="go-back"><a href="/mon-compte">Retour</a></p>
	</header>

	{#if errorMessage}
		<p class="error">{errorMessage}</p>
	{:else if totalBooks === 0}
		<p class="no-book">Aucun livre trouvé.</p>
	{:else}
		{#each booklist as book}
			<article class="book">
				<div class="book_data">
					<a href="/livre/{book.book.id}">
						<img src={`${API_URL}${book.book.cover}`} alt={book.book.title} />
					</a>
					<div class="book_info">
						<p class="book_title"><a href="/livre/{book.book.id}">{book.book.title}</a></p>
						<p class="book_author">
							{#if book.book.authors?.length}
								{book.book.authors.map((author) => `${author.firstname} ${author.name}`).join(', ')}
							{:else}
								Auteur inconnu
							{/if}
						</p>
					</div>
				</div>
				<div class="buttons">
					<button
						class="to-read"
						class:active={!book.toRead}
						onclick={() => toggleReadStatus(book)}
						aria-label={book.toRead ? 'Marquer comme lu' : 'Marquer comme à lire'}
						title={book.toRead ? 'Marquer comme lu' : 'Marquer comme à lire'}
					>
						{#if book.toRead}
							<span class="icon-wrapper">
								<span class="material-symbols--bookmark-added-grey"></span>
							</span>
							<span class="button-text">À lire</span>
						{:else}
							<span class="icon-wrapper">
								<span class="material-symbols--bookmark-added-blue"></span>
							</span>
							<span class="button-text">Lu</span>
						{/if}
					</button>
					<button
						class="delete-booklist"
						aria-label="Supprimer de ma booklist"
						onclick={() => removeBook(book)}
					>
						<span class="icon-wrapper">
							<span class="material-symbols--delete-rounded"></span>
						</span>
					</button>
				</div>
			</article>
		{/each}
		<div class="bottom-buttons">
			<div class="page-pagination">
				{#if page > 1}
					<button onclick={() => goToPage(page - 1)}>Précédente</button>
				{/if}

				<span>Page {page} / {totalPages}</span>

				{#if page < totalPages}
					<button onclick={() => goToPage(page + 1)}>Suivante</button>
				{/if}
			</div>

			<a href="/catalogue" class="catalogue-link">
				<button class="catalogue-button">Catalogue</button>
			</a>
		</div>
	{/if}
</section>

<style>
	.booklist {
		display: flex;
		flex-direction: column;
		min-height: 80vh;
	}

	.page_title {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 1.8rem;
	}

	.booklist-title {
		display: flex;
		gap: 0.7rem;
		align-items: baseline;
	}

	.page_title h1 {
		font-size: 28px;
	}

	.go-back {
		text-shadow: 0 4px 4px rgba(122, 122, 122, 0.5);
	}

	.books-number {
		color: var(--couleur-vieux-rose);
		font-weight: 700;
		font-size: 1rem;
	}

	.no-book {
		margin-left: 1rem;
	}

	.book {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: nowrap;
		gap: 0.5rem;
		overflow: hidden;
	}

	.book_data {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		min-width: 0;
		flex-shrink: 1;
	}

	.book_data img {
		width: 100%;
		max-width: 120px;
		aspect-ratio: 2/3;
		object-fit: cover;
		flex-shrink: 0;
		margin: 0.1rem;
	}

	.book_info {
		min-width: 0;
	}

	.book_title {
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.book_author {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.buttons {
		display: flex;
		flex-shrink: 0;
		gap: 0.5rem;
	}

	.to-read {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background-color: transparent;
		box-shadow: none;
		width: 6rem;
		height: 5rem;
		margin: 0;
		padding: 0.5rem;
		border: none;
		cursor: pointer;
		transition: all 0.3s ease;
		border-radius: 8px;
		gap: 0.2rem;
	}

	.to-read.active {
		background-color: transparent;
		font-weight: 600;
	}

	.to-read:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.to-read:disabled:hover {
		transform: none;
		background-color: transparent;
		box-shadow: none;
	}

	.button-text {
		font-size: 0.8rem;
		font-weight: 600;
		text-align: center;
		line-height: 1.2;
		margin-top: 0.2rem;
		color: var(--couleur-marron);
	}

	.delete-booklist {
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
		box-shadow: none;
		width: 4rem;
		height: 4rem;
		margin: 0;
		padding: 0.8rem;
		border: none;
		cursor: pointer;
		border-radius: 8px;
	}

	.delete-booklist:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.delete-booklist:disabled:hover {
		transform: none;
		background-color: transparent;
		box-shadow: none;
	}

	.icon-wrapper {
		display: flex;
	}

	.material-symbols--bookmark-added-grey {
		display: inline-block;
		width: 2rem;
		height: 2rem;
		background-repeat: no-repeat;
		background-size: 100% 100%;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23848484' d='M17.825 9L15 6.175l1.4-1.425l1.425 1.425l3.525-3.55l1.425 1.425zM5 21V5q0-.825.588-1.412T7 3h7q-.5.75-.75 1.438T13 6q0 1.8 1.138 3.175T17 10.9q.575.075 1 .075t1-.075V21l-7-3z'/%3E%3C/svg%3E");
	}

	.material-symbols--bookmark-added-blue {
		display: inline-block;
		width: 2rem;
		height: 2rem;
		background-repeat: no-repeat;
		background-size: 100% 100%;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%2363A6A6' d='M17.825 9L15 6.175l1.4-1.425l1.425 1.425l3.525-3.55l1.425 1.425zM5 21V5q0-.825.588-1.412T7 3h7q-.5.75-.75 1.438T13 6q0 1.8 1.138 3.175T17 10.9q.575.075 1 .075t1-.075V21l-7-3z'/%3E%3C/svg%3E");
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

	/* BOUTONS DU BAS */
	.bottom-buttons {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding: 1rem;
		gap: 1rem;
	}

	.page-pagination {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-weight: bold;
	}

	.catalogue-link {
		display: flex;
	}

	.catalogue-button {
		cursor: pointer;
	}

	/* MEDIA QUERIES */
	@media (max-width: 768px) {
		.book {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 0.5rem;
			overflow: hidden;
		}

		.book_data {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			flex-shrink: 1;
			min-width: 0;
		}

		.book_data img {
			width: 80px;
			height: 120px;
			flex-shrink: 0;
			object-fit: cover;
			aspect-ratio: 2/3;
		}

		.book_info {
			min-width: 0;
		}

		.book_title,
		.book_author {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.buttons {
			flex-shrink: 0;
			display: flex;
			gap: 0.3rem;
		}

		.bottom-buttons {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.page-pagination {
			flex-direction: column;
			align-items: center;
			gap: 0.5rem;
		}
	}

	@media (min-width: 1025px) {
		.delete-booklist {
			margin-right: 1rem;
		}
	}
</style>
