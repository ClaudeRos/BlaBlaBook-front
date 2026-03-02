import { API_URL } from '$lib/config';

export async function load({ params }) {
  const res = await fetch(`${API_URL}/genre/${params.id}`);

  if (!res.ok) {
    throw new Error('Genre littéraire introuvable');
  }

  const genre = await res.json();

  return { genre };
}  