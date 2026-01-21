export async function load({ params }) {
  const res = await fetch(`http://localhost:3000/author/${params.id}`);

  if (!res.ok) {
    throw new Error('Auteur introuvable');
  }

  const author = await res.json();

  return { author };
}  