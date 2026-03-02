import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { API_URL } from '$lib/config';


export const user = writable(null);


export async function loadUserFromToken() {
  if (!browser) return;

  const token = localStorage.getItem('token');

  if (!token) {
    console.log('⚠️ Pas de token, utilisateur non connecté');
    user.set(null);
    return;
  }

  try {
    console.log('Chargement de l\'utilisateur depuis le token...');

    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const userData = await res.json();
      user.set(userData);
      console.log('Utilisateur chargé:', userData);
    } else {
      console.log('Token invalide, déconnexion');
      user.set(null);
      localStorage.removeItem('token');
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'utilisateur:', error);
    user.set(null);
    localStorage.removeItem('token');
  }
}


export function logout() {
  user.set(null);
  localStorage.removeItem('token');

  // Vider aussi le store des booklists
  if (browser) {
    import('./booklistStore.js').then(({ clearBooklistStatus }) => {
      clearBooklistStatus();
    });
  }

  console.log('Déconnexion - Stores réinitialisés');


  if (browser && window.location.pathname !== '/') {
    window.location.href = '/';
  }
}