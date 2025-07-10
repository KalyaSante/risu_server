<script>
  import { router } from '@inertiajs/svelte';

  // Props
  export let images = [];

  // State
  let showUploadModal = false;
  let editingImage = null;
  let uploadFile = null;
  let imageLabel = '';
  let imageDescription = '';
  let draggedIndex = null;
  let hoveredIndex = null;
  let localImages = [...images];

  // Réactivité
  $: localImages = [...images];

  function openUploadModal() {
    showUploadModal = true;
    editingImage = null;
    imageLabel = '';
    imageDescription = '';
    uploadFile = null;
  }

  function editImage(image) {
    editingImage = image;
    imageLabel = image.label;
    imageDescription = image.description || '';
    uploadFile = null;
    showUploadModal = true;
  }

  function closeModal() {
    showUploadModal = false;
    editingImage = null;
    imageLabel = '';
    imageDescription = '';
    uploadFile = null;
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      uploadFile = file;
      
      if (!imageLabel) {
        imageLabel = file.name.replace(/\.[^/.]+$/, "");
      }
    }
  }

  function saveImage() {
    if (!imageLabel.trim()) {
      alert('Veuillez saisir un label pour l\'image');
      return;
    }

    if (editingImage) {
      const formData = new FormData();
      formData.append('label', imageLabel);
      formData.append('description', imageDescription);
      if (uploadFile) {
        formData.append('image', uploadFile);
      }

      router.put(`/settings/images/${editingImage.id}`, formData, {
        preserveState: true,
        onSuccess: () => closeModal(),
        onError: (errors) => {
          console.error('Erreur:', errors);
          alert('Erreur lors de la modification de l\'image');
        }
      });
    } else {
      if (!uploadFile) {
        alert('Veuillez sélectionner une image');
        return;
      }

      const formData = new FormData();
      formData.append('label', imageLabel);
      formData.append('description', imageDescription);
      formData.append('image', uploadFile);

      router.post('/settings/images', formData, {
        preserveState: true,
        onSuccess: () => closeModal(),
        onError: (errors) => {
          console.error('Erreur:', errors);
          alert('Erreur lors de l\'upload de l\'image');
        }
      });
    }
  }

  function deleteImage(image) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'image "${image.label}" ?`)) {
      router.delete(`/settings/images/${image.id}`, {
        preserveState: true
      });
    }
  }

  // Drag & Drop
  function handleDragStart(event, index) {
    draggedIndex = index;
    event.dataTransfer.effectAllowed = 'move';
    event.target.style.opacity = '0.5';
  }

  function handleDragEnd(event) {
    event.target.style.opacity = '1';
    draggedIndex = null;
    hoveredIndex = null;
  }

  function handleDragOver(event, index) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    hoveredIndex = index;
  }

  function handleDrop(event, dropIndex) {
    event.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newImages = [...localImages];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);
    
    localImages = newImages;
    
    const orderedIds = newImages.map(img => img.id);
    
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    if (csrfToken) {
      headers['X-CSRF-TOKEN'] = csrfToken;
    }

    fetch('/settings/images/reorder', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify({ orderedIds })
    })
    .then(response => {
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Ordre des images mis à jour avec succès');
      } else {
        throw new Error(data.message || 'Erreur inconnue');
      }
    })
    .catch(error => {
      console.error('Erreur lors de la sauvegarde:', error);
      localImages = [...images];
      alert('Erreur lors de la sauvegarde de l\'ordre');
    });
    
    draggedIndex = null;
    hoveredIndex = null;
  }

  function handleDragLeave() {
    hoveredIndex = null;
  }

  function copyImageUrl(image) {
    navigator.clipboard.writeText(image.url).then(() => {
      alert('URL copiée dans le presse-papier !');
    });
  }
</script>

<!-- Section Header -->
<div class="mb-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-2xl font-bold text-base-content mb-2">🎨 Images des Services</h3>
      <p class="text-base-content/70">Gérez les images/icônes utilisées par vos services (glissez-déposez pour réorganiser)</p>
    </div>
    <button 
      on:click={openUploadModal}
      class="btn btn-primary"
    >
      <span class="text-lg mr-2">+</span>
      Ajouter une image
    </button>
  </div>
</div>

<!-- Statistiques -->
{#if localImages.length > 0}
  <div class="stats shadow mb-6">
    <div class="stat">
      <div class="stat-title">Images disponibles</div>
      <div class="stat-value text-primary">{localImages.length}</div>
      <div class="stat-desc">Pour vos services</div>
    </div>
    
    <div class="stat">
      <div class="stat-title">Espace utilisé</div>
      <div class="stat-value text-secondary">
        {Math.round(localImages.reduce((total, img) => total + (img.file_size || 0), 0) / 1024 / 1024 * 100) / 100} MB
      </div>
      <div class="stat-desc">Taille totale</div>
    </div>

    <div class="stat">
      <div class="stat-title">Formats supportés</div>
      <div class="stat-value text-accent text-sm">PNG, JPG, WebP</div>
      <div class="stat-desc">Maximum 5MB par image</div>
    </div>
  </div>
{/if}

<!-- Instructions d'utilisation -->
<div class="alert alert-info mb-6">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
  <div>
    <h4 class="font-bold">Comment utiliser ces images ?</h4>
    <p class="text-sm">Ces images peuvent être utilisées comme icônes pour vos services. Copiez l'URL d'une image et collez-la dans le champ "Icône" lors de l'édition d'un service.</p>
  </div>
</div>

<!-- Grille des images -->
{#if localImages.length > 0}
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="list">
    {#each localImages as image, index}
      <div 
        role="listitem"
        class="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-200 cursor-move
               {draggedIndex === index ? 'scale-105 shadow-2xl' : ''}
               {hoveredIndex === index && draggedIndex !== null ? 'scale-102 border-2 border-primary' : ''}"
        draggable="true"
        on:dragstart={(e) => handleDragStart(e, index)}
        on:dragend={handleDragEnd}
        on:dragover={(e) => handleDragOver(e, index)}
        on:drop={(e) => handleDrop(e, index)}
        on:dragleave={handleDragLeave}
      >
        <!-- Image -->
        <figure class="relative">
          <img 
            src={image.url} 
            alt={image.label}
            class="w-full h-32 object-cover rounded-t-lg bg-white"
            loading="lazy"
          />
          <!-- Drag handle -->
          <div class="absolute top-2 left-2 bg-black/50 text-white rounded px-2 py-1 text-xs font-mono">
            ⋮⋮ #{index + 1}
          </div>
          <!-- Actions overlay -->
          <div class="absolute top-2 right-2">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle bg-black/50 text-white hover:bg-black/70">
                ⋮
              </div>
              <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10">
                <li><button on:click={() => copyImageUrl(image)} class="text-blue-600">🔗 Copier l'URL</button></li>
                <li><button on:click={() => editImage(image)}>✏️ Modifier</button></li>
                <li><button on:click={() => deleteImage(image)} class="text-error">🗑️ Supprimer</button></li>
              </ul>
            </div>
          </div>
        </figure>
        
        <!-- Info -->
        <div class="card-body p-4">
          <h3 class="card-title text-base font-semibold">{image.label}</h3>
          {#if image.description}
            <p class="text-sm text-base-content/70 line-clamp-2">{image.description}</p>
          {/if}
          
          <div class="card-actions justify-between items-center mt-2">
            <div class="text-xs text-base-content/50">
              {Math.round((image.file_size || 0) / 1024)} KB
            </div>
            <div class="flex gap-1">
              <div class="badge badge-outline badge-xs">
                {image.file_extension?.toUpperCase() || 'IMG'}
              </div>
              <div class="badge badge-ghost badge-xs">
                Service
              </div>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class="text-center py-12">
    <div class="text-6xl mb-4">🎨</div>
    <h3 class="text-xl font-bold mb-2">Aucune image de service</h3>
    <p class="text-base-content/70 mb-4">Commencez par ajouter des images pour personnaliser vos services</p>
    <button 
      on:click={openUploadModal}
      class="btn btn-primary"
    >
      <span class="text-lg mr-2">+</span>
      Ajouter votre première image
    </button>
  </div>
{/if}

<!-- Modal d'upload/édition -->
{#if showUploadModal}
  <div class="modal modal-open">
    <div class="modal-box w-11/12 max-w-2xl">
      <h3 class="font-bold text-lg mb-4">
        {editingImage ? '✏️ Modifier l\'image' : '📤 Ajouter une image de service'}
      </h3>
      
      <form on:submit|preventDefault={saveImage} class="space-y-4">
        <!-- Upload de fichier -->
        {#if !editingImage}
          <div class="form-control">
            <label class="label" for="image-file">
              <span class="label-text font-semibold">Fichier image *</span>
            </label>
            <input
              id="image-file"
              type="file"
              accept="image/*"
              class="file-input file-input-bordered"
              on:change={handleFileChange}
              required
            />
            <div class="label-text-alt text-sm mt-1">Formats: PNG, JPG, JPEG, GIF, WebP (max 5MB)</div>
          </div>
        {:else}
          <div class="form-control">
            <label class="label" for="image-file-edit">
              <span class="label-text font-semibold">Remplacer l'image (optionnel)</span>
            </label>
            <input
              id="image-file-edit"
              type="file"
              accept="image/*"
              class="file-input file-input-bordered"
              on:change={handleFileChange}
            />
            <div class="label-text-alt text-sm mt-1">Laissez vide pour conserver l'image actuelle</div>
          </div>
        {/if}

        <!-- Label -->
        <div class="form-control">
          <label class="label" for="image-label">
            <span class="label-text font-semibold">Label *</span>
          </label>
          <input
            id="image-label"
            type="text"
            bind:value={imageLabel}
            placeholder="Ex: Docker, MySQL, Apache, NodeJS..."
            class="input input-bordered"
            required
          />
          <div class="label-text-alt text-sm mt-1">Nom affiché pour identifier l'image dans vos services</div>
        </div>

        <!-- Description -->
        <div class="form-control">
          <label class="label" for="image-description">
            <span class="label-text font-semibold">Description</span>
          </label>
          <textarea
            id="image-description"
            bind:value={imageDescription}
            placeholder="Description ou notes sur cette image de service..."
            class="textarea textarea-bordered"
            rows="3"
          ></textarea>
          <div class="label-text-alt text-sm mt-1">Informations supplémentaires sur l'usage de cette image</div>
        </div>

        <!-- Aperçu -->
        {#if uploadFile}
          <div class="form-control">
            <div class="label">
              <span class="label-text font-semibold">Aperçu</span>
            </div>
            <div class="border border-base-300 rounded-lg p-4 bg-white">
              <img 
                src={URL.createObjectURL(uploadFile)} 
                alt="Aperçu"
                class="w-24 h-24 object-contain rounded mx-auto"
              />
            </div>
          </div>
        {:else if editingImage}
          <div class="form-control">
            <div class="label">
              <span class="label-text font-semibold">Image actuelle</span>
            </div>
            <div class="border border-base-300 rounded-lg p-4 bg-white">
              <img 
                src={editingImage.url} 
                alt={editingImage.label}
                class="w-24 h-24 object-contain rounded mx-auto"
              />
            </div>
          </div>
        {/if}

        <!-- Actions -->
        <div class="modal-action">
          <button type="button" on:click={closeModal} class="btn btn-ghost">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary">
            {editingImage ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
    <div
      class="modal-backdrop"
      on:click={closeModal}
      on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && closeModal()}
      role="button"
      tabindex="0"
      aria-label="Fermer la modal"
    ></div>
  </div>
{/if}

<style>
  .card[draggable="true"]:hover {
    transform: translateY(-2px);
  }
  
  .card[draggable="true"]:active {
    cursor: grabbing;
  }
  
  .card {
    transition: all 0.2s ease;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
