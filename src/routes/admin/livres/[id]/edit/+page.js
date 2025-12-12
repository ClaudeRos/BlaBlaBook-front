export async function load({ params }) {
  const res = await fetch(`http://localhost:3000/book/${params.id}`);

  if (!res.ok) {
    throw new Error('Livre introuvable');
  }

  const book = await res.json();

  return { book };
}  

