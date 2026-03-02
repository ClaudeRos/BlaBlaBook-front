import { API_URL } from '$lib/config';

export async function load({ params }) {
  const res = await fetch(`${API_URL}/book/${params.id}`);

  if (!res.ok) {
    throw new Error('Livre introuvable');
  }

  const book = await res.json();

  return { book };
}  

