<script>
  import { router } from '@inertiajs/svelte';
  import { DashboardLayout } from '../../app';
  import { ActionButton, ServiceCard } from '../../components';

  // Props from Inertia
  export let services = [];
  export let servers = [];
  export let pagination = {};
  export let filters = {};
  export let user = {};
  export let flash = {};

  // State for filters
  let searchTerm = filters.search || '';
  let selectedServerId = filters.selectedServerId || '';
  let selectedMaintenance = '';
  let filteredServices = services;
  let totalDependencies = 0;

  // Calculate total dependencies
  $: totalDependencies = services.reduce((acc, service) => acc + (service.dependenciesCount || 0), 0);

  // Filter functions
  function filterServices() {
    filteredServices = services.filter(service => {
      // Search filter
      const matchesSearch = !searchTerm || service.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Server filter
      const matchesServer = !selectedServerId || service.server?.id == selectedServerId;

      // Maintenance filter
      let matchesMaintenance = true;
      if (selectedMaintenance) {
        const daysSinceMaintenance = service.lastMaintenanceAt
          ? Math.floor((Date.now() - new Date(service.lastMaintenanceAt).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        switch (selectedMaintenance) {
          case 'recent':
            matchesMaintenance = daysSinceMaintenance <= 7;
            break;
          case 'warning':
            matchesMaintenance = daysSinceMaintenance > 7 && daysSinceMaintenance <= 30;
            break;
          case 'critical':
            matchesMaintenance = daysSinceMaintenance > 30;
            break;
        }
      }

      return matchesSearch && matchesServer && matchesMaintenance;
    });
  }

  function createService() {
    router.visit('/services/create');
  }

  // Update URL with filters (only on client side)
  function updateFilters() {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedServerId) params.set('server_id', selectedServerId);

      const url = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', url);
    }
    filterServices();
  }

  // Reactive statements
  $: if (searchTerm !== undefined || selectedServerId !== undefined || selectedMaintenance !== undefined) {
    filterServices();
  }

  // Debounced search (only for search term changes that would affect URL)
  let searchTimeout;
  $: if (searchTerm !== filters.search) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (typeof window !== 'undefined') {
        updateFilters();
      }
    }, 300);
  }

  $: if (selectedServerId !== filters.selectedServerId) {
    if (typeof window !== 'undefined') {
      updateFilters();
    }
  }
</script>

<svelte:head>
  <title>Services - Kalya</title>
</svelte:head>

<DashboardLayout {user} {flash} title="Services - Kalya" currentRoute="services">

  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold">⚙️ Services</h1>
      <p class="text-base-content/70 mt-1">Gérez vos services et leurs dépendances</p>
    </div>
    <ActionButton variant="primary" on:click={createService}>
      <span>➕</span>
      Nouveau service
    </ActionButton>
  </div>

  {#if services.length === 0}
    <!-- Empty state -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body text-center py-16">
        <div class="text-6xl mb-4">⚙️</div>
        <h2 class="text-2xl font-bold mb-2">Aucun service configuré</h2>
        <p class="text-base-content/70 mb-6">Commencez par ajouter votre premier service pour organiser votre infrastructure.</p>
        <ActionButton variant="primary" on:click={createService}>
          <span>➕</span>
          Ajouter un service
        </ActionButton>
      </div>
    </div>
  {:else}
    <!-- Filters and search -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body py-4">
        <div class="flex flex-wrap gap-4 items-center">

          <!-- Search input -->
          <div class="form-control">
            <input
              type="text"
              placeholder="Rechercher un service..."
              class="input input-bordered input-sm w-64"
              bind:value={searchTerm}
            />
          </div>

          <!-- Server filter -->
          <div class="form-control">
            <select class="select select-bordered select-sm" bind:value={selectedServerId}>
              <option value="">Tous les serveurs</option>
              {#each servers as server}
                <option value={server.id}>{server.name}</option>
              {/each}
            </select>
          </div>

          <!-- Maintenance filter -->
          <div class="form-control">
            <select class="select select-bordered select-sm" bind:value={selectedMaintenance}>
              <option value="">Toutes les maintenances</option>
              <option value="recent">Récente (&lt; 7 jours)</option>
              <option value="warning">Ancienne (7-30 jours)</option>
              <option value="critical">Critique (&gt; 30 jours)</option>
            </select>
          </div>

          <div class="flex-1"></div>

          <!-- Stats -->
          <div class="stats stats-horizontal shadow">
            <div class="stat">
              <div class="stat-title">Total services</div>
              <div class="stat-value text-primary">{services.length}</div>
            </div>
            <div class="stat">
              <div class="stat-title">Dépendances</div>
              <div class="stat-value text-secondary">{totalDependencies}</div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Results counter -->
    {#if filteredServices.length !== services.length}
      <div class="text-sm text-base-content/70 mb-4">
        {filteredServices.length} sur {services.length} service{services.length > 1 ? 's' : ''}
      </div>
    {:else}
      <div class="text-sm text-base-content/70 mb-4">
        {services.length} service{services.length > 1 ? 's' : ''}
      </div>
    {/if}

    <!-- Services grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredServices as service (service.id)}
        <ServiceCard
          {service}
          variant="full"
          showServer={true}
        />
      {/each}
    </div>

    <!-- No results message -->
    {#if filteredServices.length === 0}
      <div class="card bg-base-100 shadow-xl mt-6">
        <div class="card-body text-center py-8">
          <div class="text-4xl mb-4">🔍</div>
          <h3 class="text-lg font-bold mb-2">Aucun service trouvé</h3>
          <p class="text-base-content/70">Essayez de modifier vos critères de recherche.</p>
        </div>
      </div>
    {/if}

    <!-- Pagination -->
    {#if pagination.lastPage > 1}
      <div class="flex justify-center mt-8">
        <div class="btn-group">
          {#if pagination.currentPage > 1}
            <button class="btn" on:click={() => router.visit(`?page=${pagination.currentPage - 1}`)}>
              « Précédent
            </button>
          {/if}

          {#each Array.from({length: pagination.lastPage}, (_, i) => i + 1) as pageNum}
            <button
              class="btn {pageNum === pagination.currentPage ? 'btn-active' : ''}"
              on:click={() => router.visit(`?page=${pageNum}`)}
            >
              {pageNum}
            </button>
          {/each}

          {#if pagination.currentPage < pagination.lastPage}
            <button class="btn" on:click={() => router.visit(`?page=${pagination.currentPage + 1}`)}>
              Suivant »
            </button>
          {/if}
        </div>
      </div>
    {/if}
  {/if}

</DashboardLayout>

<style>
  /* Custom styles for service cards hover effects */
  .card:hover {
    transform: translateY(-2px);
  }
</style>
