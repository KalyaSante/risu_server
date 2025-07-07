<script>
  import { router } from '@inertiajs/svelte';

  // Props
  export let hosters = [];

  // State
  let showAddModal = false;
  let editingHoster = null;
  let newHoster = {
    name: '',
    type: 'vps',
    description: ''
  };
  let draggedIndex = null;
  let hoveredIndex = null;
  let localHosters = [...hosters]; // Copie locale pour le drag & drop

  const hosterTypes = [
    { value: 'vps', label: '🖥️ VPS', description: 'Serveur virtuel privé' },
    { value: 'dedicated', label: '🏢 Dédié', description: 'Serveur dédié' },
    { value: 'cloud', label: '☁️ Cloud', description: 'Infrastructure cloud' },
    { value: 'shared', label: '🤝 Mutualisé', description: 'Hébergement partagé' }
  ];

  // Réactivité pour synchroniser avec les props
  $: localHosters = [...hosters];

  function openAddModal() {
    showAddModal = true;
    newHoster = { name: '', type: 'vps', description: '' };
  }

  function closeModal() {
    showAddModal = false;
    editingHoster = null;
  }

  function saveHoster() {
    if (editingHoster) {
      router.put(`/settings/hosters/${editingHoster.id}`, newHoster, {
        preserveState: true,
        onSuccess: () => closeModal()
      });
    } else {
      router.post('/settings/hosters', newHoster, {
        preserveState: true,
        onSuccess: () => closeModal()
      });
    }
  }

  function editHoster(hoster) {
    editingHoster = hoster;
    newHoster = { ...hoster };
    showAddModal = true;
  }

  function deleteHoster(hoster) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'hébergeur "${hoster.name}" ?`)) {
      router.delete(`/settings/hosters/${hoster.id}`, {
        preserveState: true
      });
    }
  }

  // Drag & Drop functions
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
    const newHosters = [...localHosters];
    const draggedItem = newHosters[draggedIndex];
    newHosters.splice(draggedIndex, 1);
    newHosters.splice(dropIndex, 0, draggedItem);

    localHosters = newHosters;

    // Envoyer la nouvelle ordre au serveur avec fetch
    const orderedIds = newHosters.map(h => h.id);

    // Récupérer le token CSRF depuis la meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Ajouter le token CSRF si disponible
    if (csrfToken) {
      headers['X-CSRF-TOKEN'] = csrfToken;
    }

    fetch('/settings/hosters/reorder', {
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
        // Succès silencieux - pas de rechargement de page
        console.log('Ordre mis à jour avec succès');
      } else {
        throw new Error(data.message || 'Erreur inconnue');
      }
    })
    .catch(error => {
      console.error('Erreur lors de la sauvegarde:', error);
      // En cas d'erreur, restaurer l'ordre original
      localHosters = [...hosters];
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
      <h3 class="text-2xl font-bold text-base-content mb-2">🏢 Gestion des Hébergeurs</h3>
      <p class="text-base-content/70">Configurez vos hébergeurs et leur ordre d'affichage (glissez-déposez pour réorganiser)</p>
    </div>
    <button
      on:click={openAddModal}
      class="btn btn-primary"
    >
      + Ajouter un hébergeur
    </button>
  </div>
</div>

<!-- Liste des hébergeurs avec drag & drop -->
{#if localHosters.length > 0}
  <div class="space-y-4 pr-2">
    {#each localHosters as hoster, index}
      <div
        class="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-200 cursor-move
               {draggedIndex === index ? 'scale-105 shadow-xl' : ''}
               {hoveredIndex === index && draggedIndex !== null ? 'scale-102 border-2 border-primary' : ''}"
        draggable="true"
        on:dragstart={(e) => handleDragStart(e, index)}
        on:dragend={handleDragEnd}
        on:dragover={(e) => handleDragOver(e, index)}
        on:drop={(e) => handleDrop(e, index)}
        on:dragleave={handleDragLeave}
      >
        <div class="card-body p-4">
          <div class="flex items-start justify-between">
            <!-- Drag Handle -->
            <div class="flex items-center gap-3">
              <div class="flex flex-col items-center text-base-content/50 hover:text-base-content transition-colors">
                <span class="text-sm">⋮⋮</span>
                <span class="text-xs font-mono">#{index + 1}</span>
              </div>
              <span class="text-xl">
                {hosterTypes.find(t => t.value === hoster.type)?.label.split(' ')[0] || '🖥️'}
              </span>
              <div>
                <h3 class="font-bold text-base">{hoster.name}</h3>
                <p class="text-sm text-base-content/70">
                  {hosterTypes.find(t => t.value === hoster.type)?.description}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
                ⋮
              </div>
              <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48 z-10">
                <li><button on:click={() => editHoster(hoster)}>✏️ Modifier</button></li>
                <li><button on:click={() => deleteHoster(hoster)} class="text-error">🗑️ Supprimer</button></li>
              </ul>
            </div>
          </div>

          {#if hoster.description}
            <p class="text-sm mt-2 text-base-content/80">{hoster.description}</p>
          {/if}

          <div class="flex justify-between items-center mt-3">
            <div class="badge badge-outline">
              {hosterTypes.find(t => t.value === hoster.type)?.label || hoster.type}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class="text-center py-12">
    <div class="text-6xl mb-4">🏢</div>
    <h3 class="text-xl font-bold mb-2">Aucun hébergeur configuré</h3>
    <p class="text-base-content/70 mb-4">Commencez par ajouter votre premier hébergeur</p>
    <button
      on:click={openAddModal}
      class="btn btn-primary"
    >
      + Ajouter un hébergeur
    </button>
  </div>
{/if}

<!-- Modal d'ajout/édition -->
{#if showAddModal}
  <div class="modal modal-open">
    <div class="modal-box w-11/12 max-w-xl">
      <h3 class="font-bold text-lg mb-4">
        {editingHoster ? '✏️ Modifier l\'hébergeur' : '+ Ajouter un hébergeur'}
      </h3>

      <form on:submit|preventDefault={saveHoster} class="space-y-4">
        <!-- Nom -->
        <div class="form-control">
          <label class="label" for="name">
            <span class="label-text">Nom de l'hébergeur *</span>
          </label>
          <input
            id="name"
            type="text"
            bind:value={newHoster.name}
            placeholder="Ex: OVH, DigitalOcean..."
            class="input input-bordered"
            required
          />
        </div>

        <!-- Type -->
        <div class="form-control">
          <label class="label" for="type">
            <span class="label-text">Type d'hébergement *</span>
          </label>
          <select
            id="type"
            bind:value={newHoster.type}
            class="select select-bordered"
            required
          >
            {#each hosterTypes as type}
              <option value={type.value}>{type.label} - {type.description}</option>
            {/each}
          </select>
        </div>

        <!-- Description -->
        <div class="form-control">
          <label class="label" for="description">
            <span class="label-text">Description</span>
          </label>
          <textarea
            id="description"
            bind:value={newHoster.description}
            placeholder="Description ou notes sur cet hébergeur..."
            class="textarea textarea-bordered"
            rows="3"
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button type="button" on:click={closeModal} class="btn btn-ghost">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary">
            {editingHoster ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
    <div class="modal-backdrop" on:click={closeModal}></div>
  </div>
{/if}

<style>
  /* Styles pour le drag & drop */
  .card[draggable="true"]:hover {
    transform: translateY(-1px);
  }

  .card[draggable="true"]:active {
    cursor: grabbing;
  }

  /* Animation pour le feedback visuel */
  .card {
    transition: all 0.2s ease;
  }

  /* Scrollbar custom pour la liste */
  .max-h-96::-webkit-scrollbar {
    width: 6px;
  }

  .max-h-96::-webkit-scrollbar-track {
    background: hsl(var(--b2));
    border-radius: 3px;
  }

  .max-h-96::-webkit-scrollbar-thumb {
    background: hsl(var(--bc) / 0.3);
    border-radius: 3px;
  }

  .max-h-96::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--bc) / 0.5);
  }
</style>
