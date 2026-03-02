import { API_URL } from '$lib/config';

export async function load({ params }) {
  const res = await fetch(`${API_URL}/book/${params.id}`);
  const book = await res.json();

  console.log(book);

  return { book };
}   