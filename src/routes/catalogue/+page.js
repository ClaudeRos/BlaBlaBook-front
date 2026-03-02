import { API_URL } from '$lib/config';

export async function load({ fetch, url }) {
  const page = url.searchParams.get('page') || '1';
  const limit = '10';
  const search = url.searchParams.get('search') || '';

  let apiUrl = `${API_URL}/catalog?page=${page}&limit=${limit}`;
  if (search) {
    apiUrl += `&search=${encodeURIComponent(search)}`;
  }

  const res = await fetch(apiUrl);
  const data = await res.json();

  return { ...data, search };
};