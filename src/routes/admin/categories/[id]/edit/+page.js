export async function load({ params }) {
  const res = await fetch(`http://localhost:3000/genre/${params.id}`);

  if (!res.ok) {
    throw new Error('Genre littéraire introuvable');
  }

  const genre = await res.json();

  return { genre };
}  