import { API_URL } from '$lib/config';

export const getSearchSuggestions = async (q, type, signal) => {
  if (!q) return [];

  const url = new URL(`${API_URL}/search`);
  url.searchParams.set('q', q);
  if (type) url.searchParams.set('type', type);

  const res = await fetch(url, { signal });

  if (!res.ok) throw new Error('Recherche échouée');

  const data = await res.json();
  console.log("Résultats reçus:", data);
  return data;
};
