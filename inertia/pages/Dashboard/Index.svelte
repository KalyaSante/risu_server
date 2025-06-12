<script>
  import { onMount } from 'svelte';
  import { router } from '@inertiajs/svelte';
  import { DashboardLayout } from '../../app';
  import { ActionButton, StatsCard } from '../../components';

  // Props from Inertia
  export let servers = [];
  export let services = [];
  export const stats = {}; // Fix warning - export const pour prop externe
  export let user = {};
  export let flash = {};
  export let graphData = { nodes: [], edges: [] };

  // State
  let networkContainer;
  let network = null;
  let physicsEnabled = true;
  let selectedService = null;
  let showServiceDetails = false;
  let isLoading = true;

  // Vis.js configuration
  const networkOptions = {
    groups: {
      servers: {
        shape: 'box',
        color: {
          background: 'oklch(var(--p))',
          border: 'oklch(var(--pc))'
        },
        font: { color: 'oklch(var(--pc))' },
        size: 30,
        borderWidth: 2
      },
      services: {
        shape: 'circle',
        color: {
          background: 'oklch(var(--s))',
          border: 'oklch(var(--sc))'
        },
        font: { color: 'oklch(var(--sc))' },
        size: 20,
        borderWidth: 2
      }
    },
    edges: {
      arrows: 'to',
      color: {
        color: 'oklch(var(--bc))',
        highlight: 'oklch(var(--ac))'
      },
      width: 2
    },
    physics: {
      enabled: true,
      stabilization: { iterations: 100 },
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.3,
        springLength: 95,
        springConstant: 0.04,
        damping: 0.09
      }
    },
    interaction: {
      hover: true,
      selectConnectedEdges: false,
      tooltipDelay: 300
    },
    layout: {
      improvedLayout: true
    }
  };

  // Functions
  async function initializeNetwork() {
    if (!networkContainer || !graphData) return;

    try {
      // Import dynamique pour éviter les problèmes SSR
      const { Network } = await import('vis-network/standalone/esm/vis-network');

      network = new Network(networkContainer, graphData, networkOptions);
      isLoading = false;

      // Event handlers
      network.on("click", function (params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          if (nodeId.startsWith('service_')) {
            const serviceId = nodeId.replace('service_', '');
            handleServiceClick(serviceId);
          } else if (nodeId.startsWith('server_')) {
            const serverId = nodeId.replace('server_', '');
            router.visit(`/servers/${serverId}`);
          }
        } else {
          // Click in empty space
          showServiceDetails = false;
          selectedService = null;
        }
      });

      network.on("hoverNode", function (params) {
        if (networkContainer) {
          networkContainer.style.cursor = 'pointer';
        }
      });

      network.on("blurNode", function (params) {
        if (networkContainer) {
          networkContainer.style.cursor = 'default';
        }
      });

      network.on('stabilizationIterationsDone', function() {
        console.log('Network stabilized');
      });

    } catch (error) {
      console.error('Failed to load vis-network:', error);
      isLoading = false;
    }
  }

  function handleServiceClick(serviceId) {
    const serviceNode = graphData.nodes.find(n => n.id === `service_${serviceId}`);
    if (serviceNode) {
      selectedService = {
        id: serviceId,
        name: serviceNode.label,
        icon: serviceNode.icon,
        serverName: serviceNode.server_name,
        path: serviceNode.path,
        repoUrl: serviceNode.repo_url,
        docPath: serviceNode.doc_path,
        lastMaintenanceAt: serviceNode.last_maintenance_at,
        dependenciesCount: getDependenciesCount(serviceId),
        dependentsCount: getDependentsCount(serviceId)
      };
      showServiceDetails = true;
    }
  }

  function fitNetwork() {
    if (network) {
      network.fit();
    }
  }

  function togglePhysics() {
    physicsEnabled = !physicsEnabled;
    if (network) {
      network.setOptions({ physics: { enabled: physicsEnabled } });
    }
  }

  function closeServiceDetails() {
    showServiceDetails = false;
    selectedService = null;
  }

  function getDependenciesCount(serviceId) {
    return graphData.edges.filter(edge => edge.from === `service_${serviceId}`).length;
  }

  function getDependentsCount(serviceId) {
    return graphData.edges.filter(edge => edge.to === `service_${serviceId}`).length;
  }

  function formatDate(dateString) {
    if (!dateString) return 'Inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  // Lifecycle
  onMount(() => {
    // Vérifier qu'on est côté client
    if (typeof window !== 'undefined') {
      initializeNetwork();
    }

    return () => {
      if (network) {
        network.destroy();
      }
    };
  });

  // Reactive statement pour réinitialiser le réseau si les données changent
  $: if (network && graphData) {
    network.setData(graphData);
  }
</script>

<svelte:head>
  <title>Dashboard - Kalya</title>
</svelte:head>

<DashboardLayout {user} {flash} title="Dashboard - Kalya" currentRoute="dashboard">
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">

    <!-- Sidebar avec stats et légende -->
    <div class="lg:col-span-1 space-y-6">

      <!-- Statistiques -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">📊 Statistiques</h2>
          <div class="stats stats-vertical">

            <!-- Stats pour les serveurs -->
            <div class="stat">
              <div class="stat-figure text-primary">
                <span class="text-3xl">🖥️</span>
              </div>
              <div class="stat-title">Serveurs</div>
              <div class="stat-value text-primary">{servers.length}</div>
            </div>

            <!-- Stats pour les services -->
            <div class="stat">
              <div class="stat-figure text-secondary">
                <span class="text-3xl">⚙️</span>
              </div>
              <div class="stat-title">Services</div>
              <div class="stat-value text-secondary">{services.length}</div>
            </div>

            <!-- Stats pour les dépendances -->
            <div class="stat">
              <div class="stat-figure text-accent">
                <span class="text-3xl">🔗</span>
              </div>
              <div class="stat-title">Dépendances</div>
              <div class="stat-value text-accent">{graphData.edges.length}</div>
            </div>

          </div>
        </div>
      </div>

      <!-- Légende -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title text-lg">🎨 Légende</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 bg-primary rounded"></div>
              <span>Serveurs</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 bg-secondary rounded-full"></div>
              <span>Services</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-0 border-t-2 border-error"></div>
              <span>Dépendance critique</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-0 border-t-2 border-warning"></div>
              <span>Dépendance optionnelle</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-0 border-t-2 border-success"></div>
              <span>Dépendance fallback</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title text-lg">⚡ Actions rapides</h3>
          <div class="space-y-2">

            <!-- Bouton nouveau serveur -->
            <ActionButton
              variant="primary"
              size="sm"
              class="w-full"
              on:click={() => router.visit('/servers/create')}
            >
              <span>➕</span>
              Nouveau serveur
            </ActionButton>

            <!-- Bouton nouveau service -->
            <ActionButton
              variant="secondary"
              size="sm"
              class="w-full"
              on:click={() => router.visit('/services/create')}
            >
              <span>⚙️</span>
              Nouveau service
            </ActionButton>

          </div>
        </div>
      </div>

    </div>

    <!-- Graphique principal -->
    <div class="lg:col-span-3 space-y-6">

      <!-- Cartographie des services -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body p-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">🗺️ Cartographie des services</h2>
            <div class="flex gap-2">
              <button
                class="btn btn-sm btn-outline"
                disabled={isLoading}
                on:click={fitNetwork}
              >
                Ajuster la vue
              </button>
              <button
                class="btn btn-sm btn-outline"
                disabled={isLoading}
                on:click={togglePhysics}
              >
                {physicsEnabled ? 'Désactiver physique' : 'Activer physique'}
              </button>
            </div>
          </div>

          <div class="relative">
            <div
              bind:this={networkContainer}
              class="w-full h-96 border border-base-300 rounded-lg bg-base-50"
            ></div>

            {#if isLoading}
              <div class="absolute inset-0 flex items-center justify-center bg-base-50 rounded-lg">
                <div class="flex flex-col items-center gap-2">
                  <span class="loading loading-spinner loading-lg"></span>
                  <span class="text-sm text-base-content/60">Chargement de la cartographie...</span>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Détails du service sélectionné -->
      {#if showServiceDetails && selectedService}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h3 class="card-title">🔍 Détails du service</h3>
              <button class="btn btn-sm btn-circle btn-ghost" on:click={closeServiceDetails}>
                ✕
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">

              <!-- Informations du service -->
              <div class="space-y-4">
                <div>
                  <h4 class="font-bold text-lg flex items-center gap-2">
                    {#if selectedService.icon}
                      <img src="/icons/{selectedService.icon}" alt={selectedService.name} class="w-6 h-6" />
                    {:else}
                      ⚙️
                    {/if}
                    {selectedService.name}
                  </h4>
                  <p class="text-base-content/70">
                    Service sur {selectedService.serverName || 'serveur inconnu'}
                  </p>
                </div>

                <div class="space-y-2 text-sm">
                  {#if selectedService.path}
                    <div>
                      <span class="font-semibold">Chemin:</span>
                      <code class="ml-2 text-xs bg-base-200 px-2 py-1 rounded">
                        {selectedService.path}
                      </code>
                    </div>
                  {/if}

                  {#if selectedService.repoUrl}
                    <div>
                      <span class="font-semibold">Repository:</span>
                      <a
                        href={selectedService.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="ml-2 link link-primary text-xs"
                      >
                        {selectedService.repoUrl}
                      </a>
                    </div>
                  {/if}

                  {#if selectedService.docPath}
                    <div>
                      <span class="font-semibold">Documentation:</span>
                      <span class="ml-2 text-xs">{selectedService.docPath}</span>
                    </div>
                  {/if}

                  <div>
                    <span class="font-semibold">Dernière maintenance:</span>
                    <span class="ml-2 text-xs">{formatDate(selectedService.lastMaintenanceAt)}</span>
                  </div>
                </div>
              </div>

              <!-- Actions et réseau -->
              <div class="space-y-4">
                <div>
                  <h5 class="font-semibold mb-2">Actions</h5>
                  <div class="flex flex-wrap gap-2">
                    <ActionButton
                      variant="primary"
                      size="sm"
                      on:click={() => router.visit(`/services/${selectedService.id}`)}
                    >
                      Voir détails
                    </ActionButton>
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      on:click={() => router.visit(`/services/${selectedService.id}/edit`)}
                    >
                      Modifier
                    </ActionButton>
                    {#if selectedService.repoUrl}
                      <ActionButton
                        variant="accent"
                        size="sm"
                        on:click={() => window.open(selectedService.repoUrl, '_blank')}
                      >
                        Code source
                      </ActionButton>
                    {/if}
                  </div>
                </div>

                <div>
                  <h5 class="font-semibold mb-2">Réseau</h5>
                  <div class="text-xs space-y-1">
                    <div>
                      Dépendances:
                      <span class="badge badge-sm">{selectedService.dependenciesCount}</span>
                    </div>
                    <div>
                      Dépendants:
                      <span class="badge badge-sm">{selectedService.dependentsCount}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      {/if}

    </div>

  </div>
</DashboardLayout>

<style>
  /* Styles pour le réseau Vis.js */
  :global(.vis-network) {
    outline: none;
  }

  /* Responsive adjustments */
  @media (max-width: 1024px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
