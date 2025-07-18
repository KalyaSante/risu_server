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

  // Réactivité pour synchroniser avec les props
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
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      uploadFile = file;
      
      // Si pas de label, utiliser le nom du fichier
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
      // Modification d'une image existante
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
      // Nouvelle image
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

  // Drag & Drop functions pour organiser les images
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
    
    // Réorganiser localement
    const newImages = [...localImages];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);
    
    localImages = newImages;
    
    // Envoyer la nouvelle ordre au serveur avec fetch
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
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
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
</script>

<!-- Section Header -->
<div class="mb-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-2xl font-bold text-base-content mb-2">🖼️ Gestion des Images</h3>
      <p class="text-base-content/70">Gérez vos images pour personnaliser les services (glissez-déposez pour réorganiser)</p>
    </div>
    <button 
      on:click={openUploadModal}
      class="btn btn-primary"
    >
      + Ajouter une image
    </button>
  </div>
</div>

<!-- Statistiques -->
{#if localImages.length > 0}
  <div class="stats shadow mb-6">
    <div class="stat">
      <div class="stat-title">Total d'images</div>
      <div class="stat-value text-primary">{localImages.length}</div>
      <div class="stat-desc">Images disponibles</div>
    </div>
    
    <div class="stat">
      <div class="stat-title">Espace utilisé</div>
      <div class="stat-value text-secondary">
        {Math.round(localImages.reduce((total, img) => total + (img.file_size || 0), 0) / 1024 / 1024 * 100) / 100} MB
      </div>
      <div class="stat-desc">Taille totale</div>
    </div>
  </div>
{/if}

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
            class="w-full h-32 object-cover rounded-t-lg"
            loading="lazy"
          />
          <!-- Drag handle -->
          <div class="absolute top-2 left-2 bg-black/50 text-white rounded px-2 py-1 text-xs">
            ⋮⋮ #{index + 1}
          </div>
          <!-- Actions overlay -->
          <div class="absolute top-2 right-2">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle bg-black/50 text-white hover:bg-black/70">
                ⋮
              </div>
              <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48 z-10">
                <li><button on:click={() => editImage(image)}>✏️ Modifier</button></li>
                <li><button on:click={() => deleteImage(image)} class="text-error">🗑️ Supprimer</button></li>
              </ul>
            </div>
          </div>
        </figure>
        
        <!-- Info -->
        <div class="card-body p-4">
          <h3 class="card-title text-base">{image.label}</h3>
          {#if image.description}
            <p class="text-sm text-base-content/70 line-clamp-2">{image.description}</p>
          {/if}
          
          <div class="card-actions justify-between items-center mt-2">
            <div class="text-xs text-base-content/50">
              {Math.round((image.file_size || 0) / 1024)} KB
            </div>
            <div class="badge badge-outline text-xs">
              {image.file_extension?.toUpperCase() || 'IMG'}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class="text-center py-12">
    <div class="text-6xl mb-4">🖼️</div>
    <h3 class="text-xl font-bold mb-2">Aucune image</h3>
    <p class="text-base-content/70 mb-4">Commencez par ajouter votre première image</p>
    <button 
      on:click={openUploadModal}
      class="btn btn-primary"
    >
      + Ajouter une image
    </button>
  </div>
{/if}

<!-- Modal d'upload/édition -->
{#if showUploadModal}
  <div class="modal modal-open">
    <div class="modal-box w-11/12 max-w-2xl">
      <h3 class="font-bold text-lg mb-4">
        {editingImage ? '✏️ Modifier l\'image' : '📤 Ajouter une image'}
      </h3>
      
      <form on:submit|preventDefault={saveImage} class="space-y-4">
        <!-- Upload de fichier -->
        {#if !editingImage}
          <div class="form-control">
            <label class="label" for="image-file">
              <span class="label-text">Fichier image *</span>
            </label>
            <input
              id="image-file"
              type="file"
              accept="image/*"
              class="file-input file-input-bordered"
              on:change={handleFileChange}
              required
            />
            <div class="label-text-alt text-sm mt-1">Formats acceptés: PNG, JPG, JPEG, GIF, WebP (max 5MB)</div>
          </div>
        {:else}
          <div class="form-control">
            <label class="label" for="image-file-edit">
              <span class="label-text">Remplacer l'image (optionnel)</span>
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
            <span class="label-text">Label *</span>
          </label>
          <input
            id="image-label"
            type="text"
            bind:value={imageLabel}
            placeholder="Ex: Docker, MySQL, Apache..."
            class="input input-bordered"
            required
          />
          <div class="label-text-alt text-sm mt-1">Nom affiché pour identifier l'image</div>
        </div>

        <!-- Description -->
        <div class="form-control">
          <label class="label" for="image-description">
            <span class="label-text">Description</span>
          </label>
          <textarea
            id="image-description"
            bind:value={imageDescription}
            placeholder="Description ou notes sur cette image..."
            class="textarea textarea-bordered"
            rows="3"
          ></textarea>
        </div>

        <!-- Aperçu -->
        {#if uploadFile}
          <div class="form-control">
            <div class="label">
              <span class="label-text font-semibold">Aperçu</span>
            </div>
            <div class="border border-base-300 rounded-lg p-4">
              <img 
                src={URL.createObjectURL(uploadFile)} 
                alt="Aperçu"
                class="w-20 h-20 object-cover rounded mx-auto"
              />
            </div>
          </div>
        {:else if editingImage}
          <div class="form-control">
            <div class="label">
              <span class="label-text font-semibold">Image actuelle</span>
            </div>
            <div class="border border-base-300 rounded-lg p-4">
              <img 
                src={editingImage.url} 
                alt={editingImage.label}
                class="w-20 h-20 object-cover rounded mx-auto"
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
  /* Styles pour le drag & drop */
  .card[draggable="true"]:hover {
    transform: translateY(-2px);
  }
  
  .card[draggable="true"]:active {
    cursor: grabbing;
  }
  
  /* Animation pour le feedback visuel */
  .card {
    transition: all 0.2s ease;
  }
  
  /* Style pour limiter les lignes de description */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
