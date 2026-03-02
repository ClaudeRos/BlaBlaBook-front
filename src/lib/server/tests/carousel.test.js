// Par défaut vite config veut lancer les tests sur navigateur (Playwright) : placer fichier test dans un dossier server (ici src/lib/server/tests)
// et lancer script "test:server": "vitest --project server" pour voir le résultat dans la console uniquement

// test d'intégration de l'appel BDD pour le carousel - Attention côté back doit tourner même pour fetch factices
// vitest fonctionne comme jest


import { describe, it, expect, vi, beforeEach } from 'vitest';
// Import de la fonction load() de la page d'accueil
import { load } from '../../../routes/+page';
import { API_URL } from '$lib/config';

// Définition du bloc de test
describe('load function page d’accueil', () => {
  // Données factices à retourner via fetch
  const fakeBooks = [{ title: 'Livre 1' }, { title: 'Livre 2' }];

  // Réinitialise le mock entre chaque test / mock = remplacement, dupe
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Définition d’un test
  it('récupère les livres depuis la BDD', async () => {
    // Mock pour le fetch / vi.fn = fonction mockée, équivalent de jest.fn
    global.fetch = vi.fn(() =>
      // Retourne promesse comme vrai fetch
      Promise.resolve({
        json: () => Promise.resolve(fakeBooks)
      })
    );

    // Appel de la fonction load()
    const result = await load();

    // Vérifier que fetch a bien été appelé avec l’URL attendue
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/`);

    // Vérifier que le résultat contient les livres fake
    expect(result).toEqual({ book: fakeBooks });
  });
});
