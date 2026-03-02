<script>
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth.js';
	import { API_URL } from '$lib/config';

	let isLogin = $state(true);
	let errorMessage = $state('');

	async function Login(event) {
		event.preventDefault();
		errorMessage = '';

		const formData = new FormData(event.target);

		const res = await fetch(`${API_URL}/user/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: formData.get('email'),
				password: formData.get('password')
			})
		});

		const data = await res.json();

		if (res.ok) {
			localStorage.setItem('token', data.token);

			//  IMPORTANT : Mettre à jour le store
			user.set(data.user);

			console.log('Connexion réussie, utilisateur:', data.user);

			goto('/mon-compte');
		} else {
			errorMessage = data.error || 'Erreur lors de la connexion';
		}
	}

	async function Register(event) {
		event.preventDefault();
		errorMessage = '';

		const formData = new FormData(event.target);
		const password = formData.get('password');
		const confirm = formData.get('confirm');

		if (password !== confirm) {
			errorMessage = 'Les mots de passe ne correspondent pas';
			return;
		}

		// Envoie le FormData tel quel, sans JSON.stringify
		const res = await fetch(`${API_URL}/user/register`, {
			method: 'POST',
			body: formData //  multipart/form-data automatiquement géré
		});

		const data = await res.json();

		if (res.ok) {
			localStorage.setItem('token', data.token);
			user.set(data.user);
			goto('/mon-compte');
		} else {
			errorMessage = data.error || 'Erreur lors de la création de compte';
		}
	}
</script>

<div class="auth-container">
	<div class="tabs" role="tablist" aria-label="Choix du mode d’authentification">
		<button
			role="tab"
			id="tab-login"
			class:active={isLogin}
			aria-selected={isLogin}
			aria-controls="panel-login"
			aria-label="Onglet de connexion"
			tabindex="0"
			onclick={() => (isLogin = true)}
		>
			Connexion
		</button>

		<button
			role="tab"
			id="tab-register"
			class:active={!isLogin}
			aria-selected={!isLogin}
			aria-controls="panel-register"
			aria-label="Onglet de création de compte"
			tabindex="0"
			onclick={() => (isLogin = false)}
		>
			Création de compte
		</button>
	</div>

	{#if errorMessage}
		<p style="color: red; text-align: center; margin-bottom: 1rem;">{errorMessage}</p>
	{/if}

	<div
		id="panel-login"
		role="tabpanel"
		aria-labelledby="tab-login"
		tabindex={isLogin ? 0 : -1}
		hidden={!isLogin}
	>
		<form onsubmit={Login}>
			<label for="email">Email :</label>
			<input type="email" name="email" id="email" required />

			<label for="password">Mot de passe :</label>
			<input type="password" name="password" id="password" required />

			<button type="submit">Se connecter</button>
		</form>
	</div>

	<div
		id="panel-register"
		role="tabpanel"
		aria-labelledby="tab-register"
		tabindex={!isLogin ? 0 : -1}
		hidden={isLogin}
	>
		<form onsubmit={Register} enctype="multipart/form-data">
			<label for="name">Nom :</label>
			<input type="text" name="name" id="name" required />

			<label for="firstname">Prénom :</label>
			<input type="text" name="firstname" id="firstname" required />

			<label for="age">Âge :</label>
			<input type="number" name="age" id="age" min="0" required />

			<label for="emailSignup">Email :</label>
			<input type="email" name="email" id="emailSignup" required />

			<label for="passwordSignup">Mot de passe :</label>
			<input type="password" name="password" id="passwordSignup" required minlength="6" />

			<label for="confirm">Confirmation du mot de passe :</label>
			<input type="password" name="confirm" id="confirm" required minlength="6" />

			<label for="avatar">Avatar :</label>
			<input type="file" name="avatar" id="avatar" accept="image/*" />

			<button type="submit">Créer mon compte</button>
		</form>
	</div>
</div>

<style>
	.auth-container {
		max-width: 400px;
		margin: 2rem auto;
		padding: 1rem;
		border-radius: 30px;
	}

	.tabs {
		display: flex;
		border-bottom: 2px solid #ccc;
		margin-bottom: 1rem;
	}

	.tabs button {
		all: unset;
		flex: 1;
		text-align: center;
		padding: 0.5rem;
		cursor: pointer;
		font-weight: bold;
		color: #666;
		box-sizing: border-box;
	}

	.tabs button.active {
		color: var(--couleur-marron);
		border-bottom: 3px solid var(--couleur-marron);
		font-weight: bold;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		display: flex;
		flex-direction: column;
		font-size: 0.9rem;
	}

	input {
		padding: 0.5rem;
		border-radius: 5px;
		border: 1px solid #ccc;
	}

	@media (max-width: 768px) {
		.auth-container {
			padding: 0.5rem;
		}
	}
</style>
