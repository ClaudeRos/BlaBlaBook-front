export async function load() {
  const res = await fetch(`http://localhost:3000/`);
  const book = await res.json();

  // console.log(book);

  return { book };
}