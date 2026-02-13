<script>
	import { debounce } from '$lib/utils/debounce.js';
	import { getSearchSuggestions } from '$lib/remoteFunction.js';
	import { goto } from '$app/navigation';
	import { user, logout } from '$lib/stores/auth.js'; 
	import { API_URL } from '$lib/config';

	let query = $state('');
	let suggestions = $state([]);
	let loading = $state(false);
	let error = $state('');
	let showSuggestions = $state(false);
	let searchType = $state('');
	let menuOpen = $state(false);

	let abortController = null;
	let currentSearchQuery = '';

	async function performSearch(searchQuery) {
		if (abortController) abortController.abort();

		if (!searchQuery || searchQuery.length < 2) {
			suggestions = [];
			loading = false;
			showSuggestions = false;
			currentSearchQuery = '';
			return;
		}

		currentSearchQuery = searchQuery;
		abortController = new AbortController();
		loading = true;
		error = '';

		try {
			const result = await getSearchSuggestions(searchQuery, searchType, abortController.signal);

			if (searchQuery === currentSearchQuery && searchQuery === query) {
				suggestions = result;
				showSuggestions = true;
			}
		} catch (err) {
			if (err.name === 'AbortError') return;
			console.error('Erreur recherche:', err);
			if (searchQuery === currentSearchQuery) {
				error = 'Erreur de recherche';
				suggestions = [];
			}
		} finally {
			if (searchQuery === currentSearchQuery) loading = false;
		}
	}

	const debouncedSearch = debounce(performSearch, 300);

	function onInput(e) {
		query = e.target.value;
		debouncedSearch(query);
	}

	function openBook(id) {
		goto(`/livre/${id}`);
		clearSearch();
	}

	function handleFocus() {
		if (query.length >= 2 && suggestions.length > 0) {
			showSuggestions = true;
		}
	}

	function handleBlur() {
		setTimeout(() => {
			showSuggestions = false;
		}, 200);
	}

	function handleKeydown(e) {
		if (e.key === 'Enter') {
			e.preventDefault();

			const trimmedQuery = query.trim();

			// Si la recherche est vide, ne rien faire
			if (!trimmedQuery) {
				return;
			}

			// Si on a des suggestions et qu'on voit la dropdown, aller au premier résultat
			if (showSuggestions && suggestions.length > 0) {
				openBook(suggestions[0].id);
			} else if (trimmedQuery.length >= 2) {
				// Sinon, rediriger vers le catalogue avec la recherche
				goto(`/catalogue?search=${encodeURIComponent(trimmedQuery)}`);
				// Vider la barre de recherche et nettoyer l'état
				clearSearch();
			}
		} else if (e.key === 'Escape') {
			// Échapper ferme les suggestions
			clearSearch();
		}
	}

	function clearSearch() {
		query = '';
		suggestions = [];
		showSuggestions = false;
		currentSearchQuery = '';
		if (abortController) abortController.abort();
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleLogout() {
		logout();
		closeMenu();
	}
</script>

<header class="header">
	<div class="header-top">
		<div class="logo-title">
			<a href="/"><img src="/LogoBBB.png" alt="Logo BlaBlaBook" class="logo-icon" /></a>
			<p class="title"><a href="/">BlaBlaBook</a></p>
		</div>

		<!-- Menu burger (visible uniquement sur mobile et tablette) -->
		{#if $user}
			<button class="burger-icon" onclick={toggleMenu} class:active={menuOpen} aria-label="Menu">
				<span>
					<span class="lucide--menu"></span>
				</span>
			</button>
		{/if}

		<!-- Condition pour afficher les bons boutons selon l'état de connexion -->
		<div class="desktop-only">
			{#if $user}
				<div class="btn-container btn-container-end">
					<a href="/mon-compte">
						<button class="connection-btn account-btn">Mon compte</button>
					</a>
				</div>
				<div class="btn-container btn-container-start">
					<button class="connection-btn logout-btn" onclick={() => logout()}>Déconnexion</button>
				</div>
			{:else}
				<!-- Utilisateur non connecté -->
				<div class="btn-container">
					<a href="/connexion">
						<button class="connection-btn">Connexion</button>
					</a>
				</div>
			{/if}
		</div>
	</div>

	<!-- Menu burger déroulant (mobile et tablette uniquement) -->
	{#if $user}
		<nav class="burger-menu" class:active={menuOpen}>
			<ul class="burger-menu-list">
				<li>
					<a href="/mon-compte" onclick={closeMenu}>
						<button class="connection-btn account-btn">Mon compte</button>
					</a>
				</li>
				<li>
					<button class="connection-btn logout-btn" onclick={handleLogout}>Déconnexion</button>
				</li>
			</ul>
		</nav>
	{/if}

	<!-- Overlay pour fermer le menu en cliquant à l'extérieur -->
	{#if menuOpen}
		<div class="menu-overlay" onclick={closeMenu}></div>
	{/if}

	<!-- Bouton connexion pour les non-connectés sur mobile/tablette -->
	{#if !$user}
		<div class="auth-buttons mobile-only">
			<div class="btn-container">
				<a href="/connexion">
					<button class="connection-btn">Connexion</button>
				</a>
			</div>
		</div>
	{/if}

	<div class="search-container">
		<div class="search-controls">
			<input
				type="search"
				placeholder="Rechercher..."
				class="search-input"
				bind:value={query}
				oninput={onInput}
				onfocus={handleFocus}
				onblur={handleBlur}
				onkeydown={handleKeydown}
			/>

			<select bind:value={searchType} class="filter-select">
				<option value="">Tout</option>
				<option value="title">Titre</option>
				<option value="author">Auteur</option>
				<option value="genre">Genre</option>
			</select>
		</div>

		{#if showSuggestions}
			<div class="suggestions-dropdown">
				{#if loading}
					<p class="loading-text">Recherche en cours...</p>
				{:else if error}
					<p class="error-text">{error}</p>
				{:else if suggestions.length > 0}
					<ul class="suggestions">
						{#each suggestions as book}
							<li>
								<button onclick={() => openBook(book.id)} class="suggestion-item">
									{#if book.cover}
										<img src={`${API_URL}${book.cover}`} alt={book.title} class="book-thumb" />
									{/if}

									<div class="book-info">
										<strong>{book.title}</strong>

										{#if book.authors?.length}
											<span class="author-name">
												{book.authors.map((a) => `${a.firstname} ${a.name}`).join(', ')}
											</span>
										{/if}

										{#if book.genres?.length}
											<span class="genre-name">
												{book.genres.map((g) => g.name).join(', ')}
											</span>
										{/if}
									</div>
								</button>
							</li>
						{/each}
					</ul>
				{:else if query.length >= 2}
					<p class="no-results">Aucun résultat pour "{query}"</p>
				{/if}
			</div>
		{/if}
	</div>
</header>

<style>
	header {
		background-color: var(--couleur-beige-rose);
		padding: 0.5rem;
		/* position: relative; */
		position: relative;
	}

	.header-top {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		/* position: relative; */
		position: relative;
	}

	.logo-title {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.logo-icon {
		height: 80px;
		width: auto;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
	}

	.title {
		font-family: var(--font-bbb);
		color: var(--couleur-marron);
		font-size: 2rem;
		margin: 0;
		text-align: center;
	}

	/* Menu burger icon */
	.burger-icon {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		border-radius: 5px;
		width: 30px;
		height: 30px;
		background-color: var(--couleur-beige-rose);
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.burger-icon span {
		width: 30px;
		height: 30px;
		transition: all 0.3s ease;
		transform-origin: center;
	}

	.lucide--menu {
		display: inline-block;
		width: 24px;
		height: 24px;
		background-color: var(--couleur-marron);
		mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='%234f4f4f' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 5h16M4 12h16M4 19h16'/%3E%3C/svg%3E");
		mask-repeat: no-repeat;		
		mask-size: 100% 100%;
	}

	/* Menu burger déroulant */
	.burger-menu {
		position: fixed;
		top: 0;
		right: -100%;
		width: 70%;
		max-width: 300px;
		height: 100vh;
		background-color: var(--couleur-beige-rose);
		box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
		transition: right 0.3s ease;
		z-index: 1000;
		padding-top: 5rem;
	}

	.burger-menu.active {
		right: 0;
	}

	.burger-menu-list {
		list-style: none;
		margin: 0;
		padding: 2rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.burger-menu-list li {
		width: 100%;
	}

	.burger-menu-list a {
		display: block;
		text-decoration: none;
		width: 100%;
	}

	.burger-menu-list .connection-btn {
		width: 100%;
		text-align: center;
	}

	.burger-menu-list button {
		margin: 0;
	}

	/* Overlay */
	.menu-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 999;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Affichage conditionnel mobile/desktop */
	.desktop-only {
		display: none;
	}

	.mobile-only {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
		width: 100%;
		margin-top: 0.5rem;
	}

	.auth-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
		width: 100%;
	}

	.btn-container {
		width: auto;
	}

	.btn-container a {
		display: block;
		text-decoration: none;
	}

	.connection-btn {
		font-family: var(--font-global);
		padding: 0.5rem 1rem;
		background-color: var(--couleur-bleu-vert);
		border: solid 2px var(--couleur-beige-clair);
		border-radius: 30px;
		color: var(--couleur-beige-clair);
		font-weight: bold;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.connection-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.search-container {
		position: relative;
		width: 100%;
		margin-top: 1rem;
	}

	.search-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: stretch;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 1rem;
		border-radius: 25px;
		border: 1px solid #ccc;
		font-size: 1rem;
		transition: box-shadow 0.2s ease;
		box-shadow: 1px 3px 10px 1px rgba(80, 79, 79, 0.5);
	}

	.search-input:focus {
		outline: none;
		box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
	}

	.filter-select {
		width: 100%;
		padding: 0.5rem 1rem;
		border-radius: 25px;
		border: 1px solid #ccc;
		background: #fff;
		font-size: 1rem;
		cursor: pointer;
		box-shadow: 1px 3px 10px 1px rgba(80, 79, 79, 0.5);
	}

	.suggestions-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		width: 100%;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		max-height: 400px;
		overflow-y: auto;
		z-index: 1000;
	}

	.suggestions {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.suggestion-item {
		all: unset;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		width: 100%;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		font-size: inherit;
		background: none;
		border: none;
		color: inherit;
		transition: background 0.2s;
		box-sizing: border-box;
	}

	.suggestion-item:hover,
	.suggestion-item:focus {
		background: #f5f5f5;
		outline: none;
	}

	.book-thumb {
		width: 40px;
		height: 55px;
		object-fit: cover;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.book-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.author-name {
		font-size: 0.85rem;
		color: #666;
	}

	.genre-name {
		font-size: 0.75rem;
		color: #999;
	}

	.loading-text,
	.error-text,
	.no-results {
		padding: 1rem;
		text-align: center;
		color: #999;
	}

	.error-text {
		color: #ff6b6b;
	}

	@media (min-width: 768px) {
		.header-top {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}

		.logo-title {
			flex-direction: row;
			align-items: center;
			gap: 1rem;
		}

		.logo-icon {
			height: 100px;
		}

		.title {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			text-align: center;
			font-size: 2.5rem;
		}

		/* Le menu burger reste visible sur tablette */
		.burger-icon {
			position: relative;
			top: auto;
			right: auto;
		}

		/* .auth-buttons {
			flex-direction: column;
			gap: 0.3rem;
			align-items: flex-end;
			width: auto;
		} */

		/* .connection-btn {
			padding: 0.3rem 0.7rem;
			font-size: 0.85rem;
		} */

		.search-controls {
			flex-direction: row;
			align-items: center;
		}

		.search-input {
			flex: 1;
		}

		.filter-select {
			width: auto;
			padding: 0.5rem 0.8rem;
			font-size: 0.9rem;
			border-radius: 20px;
		}
	}

	@media (min-width: 1025px) {
		header {
			padding: 1rem 2rem;
		}

		.logo-icon {
			height: 120px;
		}

		.title {
			font-size: 4rem;
		}

		/* Cacher le menu burger sur desktop */
		.burger-icon {
			display: none;
		}

		.burger-menu {
			display: none;
		}

		.mobile-only {
			display: none;
		}

		/* Afficher les boutons normalement sur desktop */
		.desktop-only {
			display: flex;
		}

		.auth-buttons {
			flex-direction: row;
			gap: 0.4rem;
			align-items: center;
			/* width: auto; */
			width: auto;
		}

		.connection-btn {
			padding: 0.4rem 0.8rem;
			font-size: 0.9rem;
		}

		.search-input {
			font-size: 1.1rem;
			padding: 0.6rem 1.2rem;
		}

		.filter-select {
			padding: 0.8rem 1rem;
			font-size: 1rem;
			border-radius: 25px;
			box-shadow: 1px 3px 10px 1px rgba(80, 79, 79, 0.5);
		}
	}
</style>
