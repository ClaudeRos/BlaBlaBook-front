<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { API_URL } from '$lib/config';

	let currentUser = null;
	let currentBooks = [];
	let totalBooks = 0;
	let errorMessage = '';

	onMount(async () => {
		const token = localStorage.getItem('token');
		if (!token) {
			goto('/login');
			return;
		}

		try {
			// Récupération des infos utilisateur
			const userResponse = await fetch(`${API_URL}/auth/me`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!userResponse.ok) {
				throw new Error('Erreur lors de la récupération des infos utilisateur');
			}

			currentUser = await userResponse.json();

			// Récupération des livres favoris
			const booksResponse = await fetch(`${API_URL}/userbooks?limit=4`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!booksResponse.ok) {
				throw new Error('Erreur lors de la récupération des livres favoris');
			}

			const booksData = await booksResponse.json();
			totalBooks = booksData.totalBooks;
			currentBooks = booksData.userbooks || [];
		} catch (error) {
			console.error(error);
			errorMessage = error.message || 'Une erreur est survenue.';
		}
	});
</script>

<main>
	<section class="my_informations">
		<h1>Mon compte</h1>

		{#if currentUser}
			<div class="info">
				<img
					class="avatar"
					src={currentUser.avatar
						? `${API_URL}/${currentUser.avatar}`
						: '/images/Avatar_crop.jpg'}
					alt="avatar"
				/>
				<div class="id">
					<p class="name">{currentUser.name} {currentUser.firstname}</p>
					<p class="age pink">{currentUser.age} ans</p>
				</div>
			</div>
		{:else}
			<p>{errorMessage || 'Impossible de récupérer les informations utilisateur.'}</p>
		{/if}
	</section>

	<section class="booklist">
		<header class="title">
			<h1>Ma booklist</h1>
			<p class="pink">
				{totalBooks}
				{totalBooks === 1 ? ' livre' : ' livres'}
			</p>
		</header>

		{#if currentBooks.length > 0}
			<div class="books">
				{#each currentBooks as userbook}
					<article class="book">
						<a href="/livre/{userbook.book.id}">
							<img src={`${API_URL}${userbook.book.cover}`} alt={userbook.book.title} />
						</a>
						<div class="caption">
							<p class="book_title">{userbook.book.title}</p>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<p>{errorMessage || 'Votre booklist est vide.'}</p>
		{/if}

		<button class="button" onclick={() => (window.location.href = '/ma-booklist')}>Voir plus</button
		>
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		background-color: var(--couleur-beige-clair);
		gap: 1rem;
		justify-content: space-between;
	}

	.my_informations {
		background-color: white;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem 0;
	}

	.info {
		display: flex;
		align-items: center;
		width: 85%;
		gap: 1.2rem;
		margin: 0.8rem 0;
	}

	.name {
		font-weight: 700;
		font-size: 1rem;
	}

	.pink {
		color: var(--couleur-vieux-rose);
		font-weight: 700;
		font-size: 0.8rem;
	}

	.title {
		width: 100%;
		display: block;
		padding: 2rem;
		text-align: center;
	}

	h1 {
		background-color: unset;
		font-size: 28px;
	}

	.avatar {
		width: 35%;
		aspect-ratio: 1;
		border-radius: 15rem;
		border: 2px solid var(--couleur-marron);
	}

	.booklist {
		background-color: white;
		display: flex;
		align-items: center;
		flex-direction: column;
		gap: 0 5rem;
		min-height: 70vh;
	}

	.books {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		align-items: center;
		justify-items: center;
		width: 85%;
		padding: 0.7rem;
		aspect-ratio: 1;
		background-color: var(--couleur-beige-clair);
	}

	.book {
		overflow: hidden;
		width: 85%;
		aspect-ratio: 1;
	}

	.book img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.caption {
		display: none;
	}

	.button {
		align-self: flex-end;
		margin: 2rem auto;
	}

	/* Media queries */
	@media (min-width: 768px) {
		main {
			flex-direction: row;
			gap: 0.5rem;
		}

		.my_informations {
			width: 40%;
			padding: 2rem 1rem;
		}

		.info {
			flex-direction: column;
			width: 95%;
			gap: 0.2rem;
			margin: 0;
		}

		.id {
			width: 90%;
			padding-left: 10%;
		}

		.name {
			font-size: 20px;
			margin-bottom: 0.2rem;
		}

		.pink {
			font-size: 18px;
		}

		.avatar {
			width: 60%;
			margin: 1.5rem;
		}

		.booklist {
			width: 80%;
		}

		.button {
			margin-right: 5rem;
			margin-bottom: 3rem;
		}
	}

	@media (min-width: 1025px) {
		.my_informations {
			width: 25%;
			padding: 2rem 1.5rem;
		}

		.books {
			display: flex;
			flex-direction: row;
			width: 100%;
			aspect-ratio: auto;
			gap: 1rem;
			padding: 0 5rem;
			margin: 1rem;
			background-color: unset;
			justify-content: center;
		}

		.book {
			width: 15rem;
			height: 20rem;
			transition: transform 0.3s ease;
		}

		.book:hover {
			transform: scale(1.05);
		}

		.book img {
			height: 80%;
		}

		.caption {
			display: block;
			background-color: var(--couleur-beige-clair);
			padding: 0.5rem;
		}

		.book_title {
			font-weight: 700;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
</style>
