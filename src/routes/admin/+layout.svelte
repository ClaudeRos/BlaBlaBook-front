<!-- layout du tableau de bord (sidebar + slot) -->

<script>
  import { page } from '$app/stores';
</script>

<div>
  <!-- Barre latérale -->
  <aside>
    <a href="/admin/utilisateurs">
        Utilisateurs
    </a>
    <a href="/admin/livres">
      Livres
    </a>
    <a href="/admin/categories">
      Catégories    
    </a>
  </aside>

  <!-- Contenu dynamique -->
  <main>
    <slot />
  </main>
</div>

<style>
    
</style>
