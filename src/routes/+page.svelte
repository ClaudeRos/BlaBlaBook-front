<script>
	import { API_URL } from '$lib/config';
	let { data } = $props();
</script>

<div class="home-content">
	<h1>Notre sélection</h1>

	<div class="carousel-container">
		<div class="carousel-track">
			{#each data.book.concat(data.book) as book}
				<a href={`/livre/${book.id}`} class="slide">
					<img src={`${API_URL}${book.cover}`} alt={book.title} />
				</a>
			{/each}
		</div>
	</div>

	<a href="/catalogue"><button class="catalog">Voir le catalogue</button></a>

	<div class="about">
		<p>
			BlaBlaBook est une plateforme pensée pour tous les passionnés de lecture qui souhaitent
			organiser, partager et redécouvrir leurs bibliothèques personnelles. Née de l’envie d’un
			groupe de lecteurs de mieux gérer leurs collections, BlaBlaBook permet de suivre ses livres,
			éviter les doublons, retrouver ses lectures passées et même échanger des romans entre amis.
		</p>
	</div>
</div>

<style>
	.home-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
	}

	.carousel-container {
		width: 100vw;
		overflow: hidden;
		background-color: var(--couleur-bleu-vert);
		padding: 1rem;
	}

	.carousel-track {
		display: flex;
		width: 100%;
		gap: 1rem;
		animation: scroll 110s linear infinite;
	}

	@keyframes scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	.slide {
		flex: 0 0 auto;
		width: 220px;
	}

	.slide img {
		width: 100%;
		height: 350px;
		object-fit: cover;
		border-radius: 8px;
		transition: transform 0.3s ease;
	}

	.slide img:hover {
		transform: scale(1.05);
	}

	/* Mobile */
	@media (max-width: 767px) {
		.slide {
			width: 160px;
		}

		.slide img {
			height: 240px;
		}
	}

	/* Tablette */
	@media (min-width: 768px) and (max-width: 1023px) {
		.slide {
			width: 180px;
		}

		.slide img {
			height: 300px;
		}
	}

	/* Desktop */
	@media (min-width: 1024px) {
		.slide {
			width: 220px;
		}

		.slide img {
			height: 350px;
		}
	}

	.catalog {
		background-color: var(--couleur-vieux-rose);
		border-radius: 30px;
		color: var(--couleur-beige-clair);
		font-weight: bold;
		border: none;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
		padding: 0.75rem 2rem;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		margin: 0.5rem 0;
	}

	.catalog:hover {
		transform: scale(1.05);
		box-shadow: 0 0 25px rgba(0, 0, 0, 0.25);
	}

	.about {
		background-color: var(--couleur-beige-clair);
		border-radius: 30px;
		padding: 1.5rem;
		width: 90%;
		max-width: 900px;
		text-align: justify;
		font-family: var(--font-global);
		line-height: 1.6;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 3rem;
	}
</style>
