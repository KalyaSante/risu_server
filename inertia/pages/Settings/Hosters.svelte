<script>
  import { router } from '@inertiajs/svelte';
  import { DashboardLayout } from '../../app';

  // Props
  export let hosters = [];
  export let user = null;

  // State
  let showAddModal = false;
  let editingHoster = null;
  let showImportModal = false;
  let importData = '';
  let newHoster = {
    name: '',
    type: 'vps',
    description: ''
  };
  let draggedIndex = null;
  let hoveredIndex = null;
  let localHosters = [...hosters];
  let searchQuery = '';
  let selectedType = 'all';

  const hosterTypes = [
    { value: 'vps', label: '🖥️ VPS', description: 'Serveur virtuel privé', color: 'badge-primary' },
    { value: 'dedicated', label: '🏢 Dédié', description: 'Serveur dédié', color: 'badge-secondary' },
    { value: 'cloud', label: '☁️ Cloud', description: 'Infrastructure cloud', color: 'badge-accent' },
    { value: 'shared', label: '🤝 Mutualisé', description: 'Hébergement partagé', color: 'badge-info' }
  ];

  // Computed
  $: filteredHosters = localHosters.filter(hoster => {
    const matchesSearch = hoster.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hoster.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || hoster.type === selectedType;
    return matchesSearch && matchesType;
  });

  $: hostersStats = {
    total: localHosters.length,
    byType: hosterTypes.reduce((acc, type) => {
      acc[type.value] = localHosters.filter(h => h.type === type.value).length;
      return acc;
    }, {})
  };

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
      router.put(`/settings/hosters/${editingHoster.id}`, newHoster);
    } else {
      router.post('/settings/hosters', newHoster);
    }
    closeModal();
  }

  function editHoster(hoster) {
    editingHoster = hoster;
    newHoster = { ...hoster };
    showAddModal = true;
  }

  function deleteHoster(hoster) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'hébergeur "${hoster.name}" ?\n\nCette action est irréversible.`)) {
      router.delete(`/settings/hosters/${hoster.id}`);
    }
  }

  function duplicateHoster(hoster) {
    newHoster = {
      name: hoster.name + ' (Copie)',
      type: hoster.type,
      description: hoster.description || ''
    };
    showAddModal = true;
  }

  function exportHosters() {
    const exportData = localHosters.map(h => ({
      name: h.name,
      type: h.type,
      description: h.description
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hosters-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openImportModal() {
    showImportModal = true;
    importData = '';
  }

  function closeImportModal() {
    showImportModal = false;
    importData = '';
  }

  function importHosters() {
    try {
      const data = JSON.parse(importData);
      if (!Array.isArray(data)) {
        throw new Error('Le format doit être un tableau JSON');
      }

      // Valider la structure
      for (const item of data) {
        if (!item.name || !item.type) {
          throw new Error('Chaque hébergeur doit avoir au minimum un nom et un type');
        }
      }

      // Envoyer au serveur
      router.post('/settings/hosters/import', { hosters: data }, {
        onSuccess: () => {
          closeImportModal();
          alert(`✅ ${data.length} hébergeur(s) importé(s) avec succès !`);
        },
        onError: (error) => {
          alert('❌ Erreur lors de l\'import : ' + (error.message || 'Import échoué'));
        }
      });
    } catch (error) {
      alert('❌ Format JSON invalide : ' + error.message);
    }
  }

  // Drag & Drop functions
  function handleDragStart(event, index) {
    draggedIndex = index;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target);
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

    const newHosters = [...localHosters];
    const draggedItem = newHosters[draggedIndex];
    newHosters.splice(draggedIndex, 1);
    newHosters.splice(dropIndex, 0, draggedItem);

    localHosters = newHosters;

    const orderedIds = newHosters.map(h => h.id);

    router.post('/settings/hosters/reorder', { orderedIds }, {
      preserveState: true,
      onError: () => {
        localHosters = [...hosters];
        alert('❌ Erreur lors de la sauvegarde de l\'ordre');
      }
    });

    draggedIndex = null;
    hoveredIndex = null;
  }

  function handleDragLeave() {
    hoveredIndex = null;
  }
</script>

<DashboardLayout {user} currentRoute="settings">
  <div class="min-h-screen bg-base-200 p-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header avec stats -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-4">
          <button
            on:click={() => router.visit('/settings')}
            class="btn btn-ghost btn-sm"
          >
            ← Retour
          </button>
          <h1 class="text-3xl font-bold text-base-content">🏢 Gestion des Hébergeurs</h1>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-primary">
              <span class="text-2xl">🏢</span>
            </div>
            <div class="stat-title">Total</div>
            <div class="stat-value text-primary">{hostersStats.total}</div>
            <div class="stat-desc">hébergeurs configurés</div>
          </div>

          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-accent">
              <span class="text-2xl">☁️</span>
            </div>
            <div class="stat-title">Cloud</div>
            <div class="stat-value text-accent">{hostersStats.byType.cloud || 0}</div>
            <div class="stat-desc">infrastructures cloud</div>
          </div>

          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-secondary">
              <span class="text-2xl">🖥️</span>
            </div>
            <div class="stat-title">VPS</div>
            <div class="stat-value text-secondary">{hostersStats.byType.vps || 0}</div>
            <div class="stat-desc">serveurs virtuels</div>
          </div>

          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-info">
              <span class="text-2xl">🏢</span>
            </div>
            <div class="stat-title">Dédiés</div>
            <div class="stat-value text-info">{hostersStats.byType.dedicated || 0}</div>
            <div class="stat-desc">serveurs dédiés</div>
          </div>
        </div>

        <p class="text-base-content/70">Configurez vos hébergeurs et leur ordre d'affichage (glissez-déposez pour réorganiser)</p>
      </div>

      <!-- Actions et filtres -->
      <div class="mb-6 space-y-4">
        <!-- Barre d'actions -->
        <div class="flex flex-wrap items-center gap-3">
          <button
            on:click={openAddModal}
            class="btn btn-primary"
          >
            + Ajouter un hébergeur
          </button>

          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-outline">
              📋 Actions
            </div>
            <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
              <li><button on:click={exportHosters}>📤 Exporter la liste</button></li>
              <li><button on:click={openImportModal}>📥 Importer depuis JSON</button></li>
              <li class="menu-title"><span>Raccourcis</span></li>
              <li><button on:click={() => {selectedType = 'all'; searchQuery = ''}}>🔄 Réinitialiser filtres</button></li>
            </ul>
          </div>
        </div>

        <!-- Filtres -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Recherche -->
          <div class="form-control">
            <div class="input-group">
              <span class="bg-base-300">🔍</span>
              <input
                type="text"
                placeholder="Rechercher..."
                class="input input-bordered input-sm w-48"
                bind:value={searchQuery}
              />
            </div>
          </div>

          <!-- Filtre par type -->
          <select
            class="select select-bordered select-sm"
            bind:value={selectedType}
          >
            <option value="all">Tous les types</option>
            {#each hosterTypes as type}
              <option value={type.value}>{type.label}</option>
            {/each}
          </select>

          {#if searchQuery || selectedType !== 'all'}
            <div class="badge badge-info">
              {filteredHosters.length} résultat{filteredHosters.length > 1 ? 's' : ''}
            </div>
          {/if}
        </div>
      </div>

      <!-- Liste des hébergeurs -->
      {#if filteredHosters.length > 0}
        <div class="space-y-4">
          {#each filteredHosters as hoster, index}
            <div
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
              <div class="card-body">
                <div class="flex items-start justify-between">
                  <!-- Drag Handle + Info -->
                  <div class="flex items-center gap-4">
                    <div class="flex flex-col items-center text-base-content/50 hover:text-base-content transition-colors">
                      <span class="text-lg">⋮⋮</span>
                      <span class="text-xs font-mono">#{hoster.order || index + 1}</span>
                    </div>

                    <div class="flex items-center gap-3">
                      <span class="text-3xl">
                        {hosterTypes.find(t => t.value === hoster.type)?.label.split(' ')[0] || '🖥️'}
                      </span>
                      <div>
                        <h3 class="card-title text-lg flex items-center gap-2">
                          {hoster.name}
                          {#if !hoster.is_active}
                            <div class="badge badge-warning badge-sm">Inactif</div>
                          {/if}
                        </h3>
                        <p class="text-sm text-base-content/70">
                          {hosterTypes.find(t => t.value === hoster.type)?.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="dropdown dropdown-end">
                    <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
                      ⋮
                    </div>
                    <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-60">
                      <li><button on:click={() => editHoster(hoster)}>✏️ Modifier</button></li>
                      <li><button on:click={() => duplicateHoster(hoster)}>📄 Dupliquer</button></li>
                      <li class="menu-title"><span>Zone de danger</span></li>
                      <li><button on:click={() => deleteHoster(hoster)} class="text-error">🗑️ Supprimer</button></li>
                    </ul>
                  </div>
                </div>

                {#if hoster.description}
                  <div class="mt-3 p-3 bg-base-200 rounded-lg">
                    <p class="text-sm">{hoster.description}</p>
                  </div>
                {/if}

                <div class="card-actions justify-between mt-4">
                  <div class="flex gap-2">
                    <div class="badge {hosterTypes.find(t => t.value === hoster.type)?.color || 'badge-outline'}">
                      {hosterTypes.find(t => t.value === hoster.type)?.label || hoster.type}
                    </div>
                    {#if hoster.created_at}
                      <div class="badge badge-ghost badge-sm">
                        Ajouté le {new Date(hoster.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body text-center py-12">
            {#if searchQuery || selectedType !== 'all'}
              <div class="text-6xl mb-4">🔍</div>
              <h3 class="text-xl font-bold mb-2">Aucun résultat trouvé</h3>
              <p class="text-base-content/70 mb-4">
                Aucun hébergeur ne correspond à vos critères de recherche
              </p>
              <button
                on:click={() => {searchQuery = ''; selectedType = 'all'}}
                class="btn btn-outline"
              >
                🔄 Réinitialiser les filtres
              </button>
            {:else}
              <div class="text-6xl mb-4">🏢</div>
              <h3 class="text-xl font-bold mb-2">Aucun hébergeur configuré</h3>
              <p class="text-base-content/70 mb-4">Commencez par ajouter votre premier hébergeur</p>
              <button
                on:click={openAddModal}
                class="btn btn-primary"
              >
                + Ajouter un hébergeur
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Modal d'ajout/édition -->
  {#if showAddModal}
    <div class="modal modal-open">
      <div class="modal-box w-11/12 max-w-2xl">
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
              placeholder="Ex: OVH, DigitalOcean, AWS..."
              class="input input-bordered"
              required
            />
            <label class="label">
              <span class="label-text-alt">Nom unique pour identifier cet hébergeur</span>
            </label>
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
              placeholder="Description, notes, ou informations supplémentaires sur cet hébergeur..."
              class="textarea textarea-bordered"
              rows="3"
            ></textarea>
            <label class="label">
              <span class="label-text-alt">Optionnel - Notes personnelles ou informations utiles</span>
            </label>
          </div>

          <!-- Actions -->
          <div class="modal-action">
            <button type="button" on:click={closeModal} class="btn btn-ghost">
              Annuler
            </button>
            <button type="submit" class="btn btn-primary">
              {editingHoster ? '💾 Enregistrer' : '➕ Ajouter'}
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" on:click={closeModal}></div>
    </div>
  {/if}

  <!-- Modal d'import -->
  {#if showImportModal}
    <div class="modal modal-open">
      <div class="modal-box w-11/12 max-w-3xl">
        <h3 class="font-bold text-lg mb-4">📥 Importer des hébergeurs</h3>

        <div class="space-y-4">
          <div class="alert alert-info">
            <span class="text-sm">
              Importez une liste d'hébergeurs au format JSON. Format simplifié sans API.
            </span>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Données JSON</span>
            </label>
            <textarea
              bind:value={importData}
              placeholder={`[
  {
    "name": "OVH Cloud",
    "type": "cloud",
    "description": "Hébergeur français leader"
  },
  {
    "name": "DigitalOcean",
    "type": "vps",
    "description": "VPS simple et efficace"
  }
]`}
              class="textarea textarea-bordered font-mono text-sm"
              rows="12"
            ></textarea>
          </div>

          <div class="modal-action">
            <button type="button" on:click={closeImportModal} class="btn btn-ghost">
              Annuler
            </button>
            <button
              type="button"
              on:click={importHosters}
              class="btn btn-primary"
              disabled={!importData.trim()}
            >
              📥 Importer
            </button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop" on:click={closeImportModal}></div>
    </div>
  {/if}
</DashboardLayout>

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

  /* Stats cards responsive */
  .stat {
    padding: 1rem;
  }

  @media (max-width: 768px) {
    .stat-value {
      font-size: 1.5rem;
    }
  }
</style>
