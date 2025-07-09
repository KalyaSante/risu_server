<script>
  import { createEventDispatcher } from 'svelte';

  // Props
  export let availableImages = [];
  export let selectedImageUrl = '';
  export let isOpen = false;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // State
  let searchQuery = '';
  let filteredImages = [...availableImages];

  // Reactive filtering
  $: {
    if (searchQuery.trim()) {
      filteredImages = availableImages.filter(image =>
        image.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (image.description && image.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        image.filename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      filteredImages = [...availableImages];
    }
  }

  function selectImage(image) {
    dispatch('select', image);
    closeModal();
  }

  function clearSelection() {
    dispatch('select', null);
    closeModal();
  }

  function closeModal() {
    isOpen = false;
    searchQuery = '';
    dispatch('close');
  }

  function isSelected(imageUrl) {
    return selectedImageUrl === imageUrl;
  }

  // Keyboard navigation
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
</script>

<!-- Modal de sélection d'images -->
{#if isOpen}
  <div class="modal modal-open" on:keydown={handleKeydown}>
    <div class="modal-box w-11/12 max-w-6xl max-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="font-bold text-lg">🎨 Sélectionner une image</h3>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          on:click={closeModal}
        >
          ✕
        </button>
      </div>

      <!-- 🔍 DEBUG: Affichage du nombre d'images -->
      <div class="mb-4 p-2 bg-base-200 rounded text-sm">
        <strong>DEBUG:</strong> {availableImages.length} images reçues, {filteredImages.length} affichées
      </div>

      <!-- Recherche -->
      <div class="form-control mb-6">
        <div class="input-group">
          <input
            type="text"
            placeholder="Rechercher par nom, description ou fichier..."
            class="input input-bordered w-full"
            bind:value={searchQuery}
          />
          <span class="bg-base-200 px-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
        <label class="label">
          <span class="label-text-alt">{filteredImages.length} image{filteredImages.length > 1 ? 's' : ''} trouvée{filteredImages.length > 1 ? 's' : ''}</span>
          {#if searchQuery}
            <button
              type="button"
              class="label-text-alt link link-primary"
              on:click={() => searchQuery = ''}
            >
              Effacer
            </button>
          {/if}
        </label>
      </div>

      <!-- Actions rapides -->
      <div class="flex gap-2 mb-6">
        <button
          type="button"
          class="btn btn-outline btn-sm"
          on:click={clearSelection}
        >
          🚫 Aucune image
        </button>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          on:click={() => window.open('/settings/service-images', '_blank')}
        >
          ➕ Gérer les images
        </button>
      </div>

      <!-- Grille des images -->
      <div class="max-h-96 overflow-y-auto">
        {#if filteredImages.length > 0}
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {#each filteredImages as image}
              <div
                class="card bg-base-100 shadow hover:shadow-lg cursor-pointer transition-all duration-200 border-2 {isSelected(image.url) ? 'border-primary shadow-primary/20' : 'border-transparent'}"
                on:click={() => selectImage(image)}
                on:keydown={(e) => e.key === 'Enter' && selectImage(image)}
                tabindex="0"
                role="button"
                aria-label="Sélectionner l'image {image.label}"
              >
                <!-- Image -->
                <figure class="relative">
                  <img
                    src={image.url}
                    alt={image.label}
                    class="w-full h-20 object-cover rounded-t-lg bg-white"
                    loading="lazy"
                  />
                  <!-- Indicator de sélection -->
                  {#if isSelected(image.url)}
                    <div class="absolute top-2 right-2 bg-primary text-primary-content rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      ✓
                    </div>
                  {/if}
                  <!-- Badge du format -->
                  <div class="absolute bottom-2 left-2 badge badge-sm badge-ghost bg-black/50 text-white border-none">
                    {image.file_extension?.toUpperCase() || 'IMG'}
                  </div>
                </figure>

                <!-- Info -->
                <div class="card-body p-3">
                  <h4 class="text-sm font-semibold truncate" title={image.label}>
                    {image.label}
                  </h4>
                  {#if image.description}
                    <p class="text-xs text-base-content/70 line-clamp-2" title={image.description}>
                      {image.description}
                    </p>
                  {/if}
                  <div class="text-xs text-base-content/50 mt-1">
                    {image.filename}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <!-- État vide -->
          <div class="text-center py-8">
            {#if searchQuery}
              <div class="text-4xl mb-2">🔍</div>
              <h4 class="text-lg font-semibold mb-1">Aucune image trouvée</h4>
              <p class="text-base-content/70 mb-4">Aucune image ne correspond à votre recherche "{searchQuery}"</p>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                on:click={() => searchQuery = ''}
              >
                Effacer la recherche
              </button>
            {:else}
              <div class="text-4xl mb-2">🎨</div>
              <h4 class="text-lg font-semibold mb-1">Aucune image disponible</h4>
              <p class="text-base-content/70 mb-4">Commencez par ajouter des images dans les paramètres</p>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                on:click={() => window.open('/settings/service-images', '_blank')}
              >
                ➕ Ajouter des images
              </button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Instructions -->
      <div class="alert alert-info mt-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div class="text-sm">
          <h4 class="font-semibold">Instructions :</h4>
          <ul class="list-disc list-inside mt-1 space-y-1">
            <li>Cliquez sur une image pour la sélectionner</li>
            <li>Utilisez la recherche pour filtrer les images</li>
            <li>Sélectionnez "Aucune image" pour ne pas utiliser d'icône</li>
            <li>Gérez vos images depuis les paramètres</li>
          </ul>
        </div>
      </div>

      <!-- Actions du modal -->
      <div class="modal-action">
        <button type="button" class="btn btn-ghost" on:click={closeModal}>
          Fermer
        </button>
      </div>
    </div>
    <!-- Backdrop -->
    <div class="modal-backdrop" on:click={closeModal}></div>
  </div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card:hover {
    transform: translateY(-1px);
  }

  .card:focus {
    outline: 2px solid oklch(var(--p));
    outline-offset: 2px;
  }
</style>
