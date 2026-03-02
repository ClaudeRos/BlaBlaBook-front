import { API_URL } from '$lib/config';

export async function load({ params }) {
  const res = await fetch(`${API_URL}/author/${params.id}`);

  if (!res.ok) {
    throw new Error('Auteur introuvable');
  }

  const author = await res.json();

  return { author };
}  