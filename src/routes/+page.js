import { API_URL } from '$lib/config';

export async function load() {
  const res = await fetch(`${API_URL}/`);
  const book = await res.json();

  // console.log(book);

  return { book };
}