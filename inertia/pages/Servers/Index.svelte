<script>
  import { DashboardLayout } from '../../app';
  import { ActionButton } from '../../components';
  import { router } from '@inertiajs/svelte';

  // Props from Inertia
  export let servers = [];
  export let user = {};
  export let flash = {};

  // State
  let searchTerm = '';
  let selectedHebergeur = '';

  // Reactive variables
  $: hebergeurs = [...new Set(servers.map(s => s.hebergeur).filter(Boolean))];
  $: totalServices = servers.reduce((acc, s) => acc + (s.services?.length || 0), 0);
  $: filteredServers = servers.filter(server => {
    const matchesSearch = (server.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHebergeur = !selectedHebergeur || server.hebergeur === selectedHebergeur;
    return matchesSearch && matchesHebergeur;
  });

  // Functions
  function createServer() {
    router.visit('/servers/create');
  }

  function viewServer(serverId) {
    router.visit(`/servers/${serverId}`);
  }

  function editServer(serverId) {
    router.visit(`/servers/${serverId}/edit`);
  }
</script>

<svelte:head>
  <title>Serveurs - Kalya</title>
</svelte:head>

<DashboardLayout {user} {flash} title="Serveurs - Kalya" currentRoute="servers">
  <!-- En-tête -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold">🖥️ Serveurs</h1>
      <p class="text-base-content/70 mt-1">Gérez vos serveurs et leur infrastructure</p>
    </div>
    <ActionButton variant="primary" on:click={createServer}>
      <span>➕</span>
      Nouveau serveur
    </ActionButton>
  </div>

  {#if servers.length === 0}
    <!-- État vide -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body text-center py-16">
        <div class="text-6xl mb-4">🖥️</div>
        <h2 class="text-2xl font-bold mb-2">Aucun serveur configuré</h2>
        <p class="text-base-content/70 mb-6">Commencez par ajouter votre premier serveur pour organiser vos services.</p>
        <ActionButton variant="primary" on:click={createServer}>
          <span>➕</span>
          Ajouter un serveur
        </ActionButton>
      </div>
    </div>
  {:else}
    <!-- Filtres et recherche -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body py-4">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="form-control">
            <input
              type="text"
              placeholder="Rechercher un serveur..."
              class="input input-bordered input-sm w-64"
              bind:value={searchTerm}
            >
          </div>
          <div class="form-control">
            <select class="select select-bordered select-sm" bind:value={selectedHebergeur}>
              <option value="">Tous les hébergeurs</option>
              {#each hebergeurs as hebergeur}
                <option value={hebergeur}>{hebergeur}</option>
              {/each}
            </select>
          </div>
          <div class="flex-1"></div>
          <div class="stats stats-horizontal shadow">
            <!-- Stats total serveurs -->
            <div class="stat">
              <div class="stat-title">Total serveurs</div>
              <div class="stat-value text-primary">{servers.length}</div>
            </div>
            <!-- Stats services actifs -->
            <div class="stat">
              <div class="stat-title">Services actifs</div>
              <div class="stat-value text-secondary">{totalServices}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grille des serveurs -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredServers as server (server.id)}
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div class="card-body">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="card-title">{server.name || 'Serveur sans nom'}</h2>
                <p class="text-sm text-base-content/70">{server.ip || 'IP non renseignée'}</p>
              </div>
              <div class="badge badge-primary">{server.hebergeur || 'Non spécifié'}</div>
            </div>

            {#if server.localisation}
              <p class="text-sm">📍 {server.localisation}</p>
            {/if}

            {#if server.services && server.services.length > 0}
              <div class="mt-4">
                <p class="text-sm font-medium">Services ({server.services.length})</p>
                <div class="flex flex-wrap gap-1 mt-2">
                  {#each server.services.slice(0, 3) as service}
                    <span class="badge badge-secondary badge-sm">{service.name || 'Service'}</span>
                  {/each}
                  {#if server.services.length > 3}
                    <span class="badge badge-ghost badge-sm">+{server.services.length - 3}</span>
                  {/if}
                </div>
              </div>
            {/if}

            <div class="card-actions justify-end mt-4">
              <ActionButton variant="primary" size="sm" on:click={() => viewServer(server.id)}>
                Voir
              </ActionButton>
              <ActionButton variant="secondary" size="sm" on:click={() => editServer(server.id)}>
                Modifier
              </ActionButton>
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if filteredServers.length === 0}
      <!-- Aucun résultat après filtrage -->
      <div class="card bg-base-100 shadow-xl mt-6">
        <div class="card-body text-center py-12">
          <div class="text-4xl mb-4">🔍</div>
          <h3 class="text-xl font-bold mb-2">Aucun serveur trouvé</h3>
          <p class="text-base-content/70">Essayez de modifier vos critères de recherche.</p>
        </div>
      </div>
    {/if}
  {/if}
</DashboardLayout>
