<!-- Dashboard/Index.svelte - Version avec détails de serveur -->
<script>
  import { onMount } from 'svelte';
  import { router } from '@inertiajs/svelte';
  import { DashboardLayout } from '../../app';
  import { ActionButton, StatsCard } from '../../components';
  import ServiceImg from "~/components/ServiceImg.svelte";

  // Props from Inertia
  export let servers = [];
  export let services = [];
  export const stats = {};
  export let user = {};
  export let flash = {};
  export let graphData = { elements: [] };

  // State
  let networkContainer;
  let cy = null;
  let selectedService = null;
  let showServiceDetails = false;
  let selectedServer = null;
  let showServerDetails = false;
  let isLoading = true;

  // === CONFIGURATION CYTOSCAPE ===
  const createCytoscapeConfig = (container, elements) => ({
    container,
    elements,
    style: getCytoscapeStyles(),
    layout: { name: 'preset', fit: false, animate: false },
    userZoomingEnabled: true,
    userPanningEnabled: true,
    boxSelectionEnabled: false,
    selectionType: 'single',
    pixelRatio: 'auto',
    motionBlur: true,
    textureOnViewport: false,
    wheelSensitivity: 1.0, // ⚡ Augmenté de 0.2 à 1.0 pour un zoom plus réactif !
  });

  // ✅ NOUVEAU: Mapping direct des couleurs DaisyUI
  const daisyUIColors = {
    primary: { bg: '#3b82f6', content: '#ffffff' },
    secondary: { bg: '#f59e0b', content: '#ffffff' },
    accent: { bg: '#10b981', content: '#ffffff' },
    neutral: { bg: '#6b7280', content: '#ffffff' },
    info: { bg: '#06b6d4', content: '#ffffff' },
    success: { bg: '#10b981', content: '#ffffff' },
    warning: { bg: '#f59e0b', content: '#ffffff' },
    error: { bg: '#ef4444', content: '#ffffff' },
  };

  const getCytoscapeStyles = () => [
    // Serveurs (nœuds parents)
    {
      selector: 'node[type = "server"]',
      style: {
        'background-color': (node) => daisyUIColors[node.data('color')] ? daisyUIColors[node.data('color')].bg : daisyUIColors.neutral.bg,
        'border-color': (node) => daisyUIColors[node.data('color')] ? daisyUIColors[node.data('color')].content : daisyUIColors.neutral.content,
        'border-width': 3,
        'shape': 'round-rectangle',
        'width': 300,
        'height': 200,
        'label': 'data(label)',
        'text-valign': 'top',
        'text-halign': 'center',
        'text-margin-y': -15,
        'color': (node) => daisyUIColors[node.data('color')] ? daisyUIColors[node.data('color')].content : daisyUIColors.neutral.content,
        'font-size': 18,
        'font-weight': 'bold',
        'font-family': 'Inter, system-ui, sans-serif',
        'text-background-color': (node) => daisyUIColors[node.data('color')] ? daisyUIColors[node.data('color')].bg : daisyUIColors.neutral.bg,
        'text-background-opacity': 0.9,
        'text-background-padding': 6,
        'text-background-shape': 'round-rectangle',
        'padding': 20
      }
    },
    {
      selector: 'node[type = "server"]:selected',
      style: {
        'border-width': 4
      }
    },
    // Services (nœuds enfants)
    {
      selector: 'node[type = "service"]',
      style: {
        'background-color': (node) => daisyUIColors[node.data('color')] ? daisyUIColors[node.data('color')].bg : daisyUIColors.neutral.bg,
        'border-color': (node) => daisyUIColors[node.data('color')] ? daisyUIColors[node.data('color')].content : daisyUIColors.neutral.content,
        'border-width': 2,
        'shape': 'ellipse',
        'width': 60,
        'height': 60,
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': (node) => daisyUIColors[node.data('color')] ? daisyUIColors[node.data('color')].content : daisyUIColors.neutral.content,
        'font-size': 11,
        'font-family': 'Inter, system-ui, sans-serif',
        'text-wrap': 'wrap',
        'text-max-width': 80
      }
    },
    {
      selector: 'node[type = "service"]:selected',
      style: {
        'border-width': 3
      }
    },
    // Dépendances (edges)
    {
      selector: 'edge[type = "dependency"]',
      style: {
        'width': 2,
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 1.2,
        'label': 'data(label)',
        'font-size': 10,
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
        'color': '#374151'
      }
    },
    // ❌ Section edge[type = "server"] supprimée - Plus de liens en pointillés inutiles !
    {
      selector: 'edge:selected',
      style: {
        'width': 3,
        'line-color': '#f59e0b',
        'target-arrow-color': '#f59e0b'
      }
    }
  ];

  // === GESTION DU LAYOUT ===
  let currentLayout = null;
  let isUserInteracting = false;

  const createColaLayout = (cy, options = {}) => {
    const defaultOptions = {
      name: 'cola',
      animate: true,
      refresh: 50,
      maxSimulationTime: 4000, // Limite la simulation à 4 secondes
      ungrabifyWhileSimulating: false,
      nodeSpacing: function(node) {
        return node.data('type') === 'server' ? 100 : 30;
      },
      edgeLength: 120,
      edgeSymDiffLength: 12,
      edgeJaccardLength: 16,
      handleDisconnected: true,
      avoidOverlap: true,
      infinite: false, // Pas infini pour permettre les interactions
      fit: false,
      padding: 60
    };

    return cy.layout({ ...defaultOptions, ...options });
  };

  const startInitialLayout = (cy) => {
    // Arrêter layout précédent s'il existe
    if (currentLayout) {
      currentLayout.stop();
    }

    // Layout initial avec fit pour positionner
    currentLayout = createColaLayout(cy, {
      fit: true,
      maxSimulationTime: 2000, // Layout initial plus court
      infinite: false
    });

    currentLayout.run();
  };

  const startContinuousPhysics = (cy) => {
    // Ne pas démarrer si l'utilisateur est en train d'interagir
    if (isUserInteracting) return;

    // Arrêter layout précédent
    if (currentLayout) {
      currentLayout.stop();
    }

    // Physique très douce qui respecte les positions existantes
    currentLayout = createColaLayout(cy, {
      fit: false,
      maxSimulationTime: 1500, // Plus court
      refresh: 100, // Plus lent = moins agressif
      nodeSpacing: function(node) {
        return node.data('type') === 'server' ? 80 : 20; // Espacement réduit
      },
      edgeLength: 100, // Plus court = moins de mouvement
      animate: true,
      ungrabifyWhileSimulating: false,
      avoidOverlap: true,
      handleDisconnected: true,
      infinite: false
    });

    currentLayout.run();
  };

  const stopPhysics = () => {
    if (currentLayout) {
      currentLayout.stop();
      currentLayout = null;
    }
  };

  // === EVENT HANDLERS ===
  const setupEventHandlers = (cy) => {
    // Détecter interactions utilisateur pour arrêter la physique
    cy.on('grab', () => {
      isUserInteracting = true;
      stopPhysics();
    });

    cy.on('free', () => {
      isUserInteracting = false;
      // NE PAS relancer automatiquement la physique après drag
      // L'utilisateur a positionné l'élément où il veut !
    });

    cy.on('zoom pan', () => {
      isUserInteracting = true;
      stopPhysics();
    });

    // Arrêter interaction après un délai
    cy.on('zoom pan', debounce(() => {
      isUserInteracting = false;
    }, 500));

    // Click sur service
    cy.on('tap', 'node[type = "service"]', (evt) => {
      const node = evt.target;
      const serviceId = node.data('id').replace('service_', '');
      handleServiceClick(serviceId, node.data());
    });

    // Click sur serveur - MODIFIÉ pour afficher les détails au lieu de rediriger
    cy.on('tap', 'node[type = "server"]', (evt) => {
      const node = evt.target;
      const serverId = node.data('id').replace('server_', '');
      handleServerClick(serverId, node.data());
    });

    // Click sur arrière-plan
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        closeAllDetails();
      }
    });
  };

  // Utilitaire debounce
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // === INITIALISATION RÉSEAU ===
  async function initializeNetwork() {
    if (!networkContainer || !graphData?.elements) return;

    try {
      // Import dynamique
      const cytoscape = await import('cytoscape');
      const cola = await import('cytoscape-cola');

      cytoscape.default.use(cola.default);

      // Créer l'instance Cytoscape
      const config = createCytoscapeConfig(networkContainer, graphData.elements);
      cy = cytoscape.default(config);

      // Setup events
      setupEventHandlers(cy);

      // Démarrer layout initial
      startInitialLayout(cy);

      isLoading = false;

    } catch (error) {
      console.error('Erreur lors du chargement de Cytoscape:', error);
      isLoading = false;
    }
  }

  // === ACTIONS RÉSEAU ===
  function handleServiceClick(serviceId, nodeData) {
    // Fermer les détails du serveur s'ils sont ouverts
    closeServerDetails();

    selectedService = {
      id: serviceId,
      name: nodeData.label,
      icon: nodeData.icon,
      serverName: nodeData.server_name,
      path: nodeData.path,
      repoUrl: nodeData.repo_url,
      docPath: nodeData.doc_path,
      lastMaintenanceAt: nodeData.last_maintenance_at,
      dependenciesCount: getDependenciesCount(serviceId),
      dependentsCount: getDependentsCount(serviceId)
    };
    showServiceDetails = true;
  }

  function handleServerClick(serverId, nodeData) {
    // Fermer les détails du service s'ils sont ouverts
    closeServiceDetails();

    // Trouver les données complètes du serveur
    const serverData = servers.find(s => s.id.toString() === serverId);

    if (serverData) {
      selectedServer = {
        id: serverId,
        name: nodeData.label || serverData.nom,
        ip: serverData.ip,
        hebergeur: serverData.hebergeur,
        localisation: serverData.localisation,
        createdAt: serverData.createdAt,
        parentServer: serverData.parentServer,
        services: serverData.services || [],
        servicesCount: (serverData.services || []).length,
        dependenciesCount: (serverData.services || []).reduce((acc, s) => acc + (s.dependencies?.length || 0), 0)
      };
      showServerDetails = true;
    }
  }

  function fitNetwork() {
    if (cy) {
      cy.fit(cy.elements(), 50);
    }
  }

  function centerOnServer(serverId) {
    if (cy) {
      const server = cy.getElementById(`server_${serverId}`);
      if (server.length > 0) {
        cy.center(server);
        cy.zoom(1.5);
      }
    }
  }

  function resetView() {
    if (cy) {
      stopPhysics(); // Arrêter simulation actuelle
      closeAllDetails(); // Nettoyer UI
      startInitialLayout(cy); // Redémarrer avec layout initial
    }
  }

  function optimizeLayout() {
    if (cy) {
      // Fonction pour relancer manuellement une physique douce
      startContinuousPhysics(cy);
    }
  }

  function closeServiceDetails() {
    showServiceDetails = false;
    selectedService = null;
  }

  function closeServerDetails() {
    showServerDetails = false;
    selectedServer = null;
  }

  function closeAllDetails() {
    closeServiceDetails();
    closeServerDetails();
    if (cy) {
      cy.elements().unselect();
    }
  }

  // === UTILITAIRES ===
  function getDependenciesCount(serviceId) {
    if (!graphData?.elements) return 0;
    return graphData.elements.filter(el =>
      el.data?.source === `service_${serviceId}` && el.data?.type === 'dependency'
    ).length;
  }

  function getDependentsCount(serviceId) {
    if (!graphData?.elements) return 0;
    return graphData.elements.filter(el =>
      el.data?.target === `service_${serviceId}` && el.data?.type === 'dependency'
    ).length;
  }

  function formatDate(dateString) {
    if (!dateString) return 'Inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      // Tu peux ajouter une notification toast ici si tu veux
    }).catch(() => {
      // Fallback pour les navigateurs plus anciens
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  }

  // === LIFECYCLE ===
  onMount(() => {
    if (typeof window !== 'undefined') {
      initializeNetwork();
    }

    return () => {
      if (currentLayout) {
        currentLayout.stop();
      }
      if (cy) {
        cy.destroy();
      }
    };
  });

  // Réactivité pour changement de données
  $: if (cy && graphData?.elements) {
    cy.elements().remove();
    cy.add(graphData.elements);
    // Relancer layout initial seulement si les données ont vraiment changé
    // (nouveaux éléments ajoutés/supprimés)
    startInitialLayout(cy);
  }
</script>

<svelte:head>
  <title>Dashboard - Risu</title>
</svelte:head>

<DashboardLayout {user} {flash} title="Dashboard - Risu" currentRoute="dashboard">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Graphique principal -->
    <div class="lg:col-span-2 space-y-6">

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
                🔍 Ajuster la vue
              </button>
              <button
                class="btn btn-sm btn-outline"
                disabled={isLoading}
                on:click={optimizeLayout}
              >
                🎯 Optimiser
              </button>
            </div>
          </div>

          <div class="relative">
            <div
              bind:this={networkContainer}
              class="w-full h-124 border border-base-300 rounded-lg bg-base-50"
            ></div>

            {#if isLoading}
              <div class="absolute inset-0 flex items-center justify-center bg-base-50 rounded-lg">
                <div class="flex flex-col items-center gap-2">
                  <span class="loading loading-spinner loading-lg"></span>
                  <span class="text-sm text-base-content/60">
                    Chargement de la cartographie...
                  </span>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <!-- Statistiques -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">📊 Statistiques</h2>
            <div class="stats stats-vertical">
              <div class="stat">
                <div class="stat-figure text-primary">
                  <span class="text-3xl">🖥️</span>
                </div>
                <div class="stat-title">Serveurs</div>
                <div class="stat-value text-primary">{servers.length}</div>
              </div>
              <div class="stat">
                <div class="stat-figure text-secondary">
                  <span class="text-3xl">⚙️</span>
                </div>
                <div class="stat-title">Services</div>
                <div class="stat-value text-secondary">{services.length}</div>
              </div>
              <div class="stat">
                <div class="stat-figure text-accent">
                  <span class="text-3xl">🔗</span>
                </div>
                <div class="stat-title">Dépendances</div>
                <div class="stat-value text-accent">
                  {graphData.elements?.filter(el => el.data?.type === 'dependency').length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6">
          <!-- Légende -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h3 class="card-title text-lg">🎨 Légende</h3>
              <div class="space-y-3 text-sm">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-4 bg-primary rounded border-2 border-primary"></div>
                  <span>Serveurs (conteneurs)</span>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-4 h-4 bg-secondary rounded-full"></div>
                  <span>Services (à l'intérieur)</span>
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
                <ActionButton
                  variant="primary"
                  size="sm"
                  class="w-full"
                  on:click={() => router.visit('/servers/create')}
                >
                  <span>➕</span>
                  Nouveau serveur
                </ActionButton>
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

      </div>

    </div>

    <!-- Sidebar avec stats et légende -->
    <div class="lg:col-span-1 space-y-6">


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

            <div class="grid grid-cols-1 gap-6 mt-4">
              <!-- Informations du service avec image -->
              <div class="space-y-4">
                <!-- Header avec image -->
                <div class="flex items-start gap-3">
                  <!-- ✅ NOUVEAU: Image du service -->
                  <div class="flex-shrink-0 w-12">
                    {#if selectedService.icon}
                      <ServiceImg service="{selectedService}"></ServiceImg>
                    {/if}
                  </div>

                  <!-- Titre et serveur -->
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-lg leading-tight">
                      {selectedService.name}
                    </h4>
                    <p class="text-base-content/70 text-sm mt-1">
                      Service dans {selectedService.serverName || 'serveur inconnu'}
                    </p>
                  </div>
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

      <!-- Détails du serveur sélectionné -->
      {#if showServerDetails && selectedServer}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h3 class="card-title">🖥️ Détails du serveur</h3>
              <button class="btn btn-sm btn-circle btn-ghost" on:click={closeServerDetails}>
                ✕
              </button>
            </div>

            <div class="grid grid-cols-1 gap-6 mt-4">
              <!-- Informations du serveur -->
              <div class="space-y-4">
                <div>
                  <h4 class="font-bold text-lg flex items-center gap-2">
                    🖥️ {selectedServer.name}
                  </h4>
                  <p class="text-base-content/70">
                    {selectedServer.hebergeur} • {selectedServer.localisation}
                  </p>
                </div>

                <div class="space-y-2 text-sm">
                  <div>
                    <span class="font-semibold">Adresse IP:</span>
                    <div class="flex items-center gap-2 mt-1">
                      <code class="bg-base-200 px-2 py-1 rounded text-xs">
                        {selectedServer.ip}
                      </code>
                      <button
                        class="btn btn-xs btn-outline"
                        on:click={() => copyToClipboard(selectedServer.ip)}
                        title="Copier l'IP"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div>
                    <span class="font-semibold">Hébergeur:</span>
                    <span class="ml-2 badge badge-primary badge-sm">{selectedServer.hebergeur}</span>
                  </div>

                  <div>
                    <span class="font-semibold">Localisation:</span>
                    <span class="ml-2 text-xs">{selectedServer.localisation}</span>
                  </div>

                  {#if selectedServer.parentServer}
                    <div>
                      <span class="font-semibold">Hébergé dans:</span>
                      <button
                        class="ml-2 link link-primary text-xs"
                        on:click={() => router.visit(`/servers/${selectedServer.parentServer.id}`)}
                      >
                        {selectedServer.parentServer.name}
                      </button>
                    </div>
                  {/if}

                  <div>
                    <span class="font-semibold">Créé le:</span>
                    <span class="ml-2 text-xs">{formatDate(selectedServer.createdAt)}</span>
                  </div>
                </div>
              </div>

              <!-- Actions et statistiques -->
              <div class="space-y-4">
                <div>
                  <h5 class="font-semibold mb-2">Actions</h5>
                  <div class="flex flex-wrap gap-2">
                    <ActionButton
                      variant="primary"
                      size="sm"
                      on:click={() => router.visit(`/servers/${selectedServer.id}`)}
                    >
                      Voir détails
                    </ActionButton>
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      on:click={() => router.visit(`/servers/${selectedServer.id}/edit`)}
                    >
                      Modifier
                    </ActionButton>
                    <ActionButton
                      variant="accent"
                      size="sm"
                      on:click={() => router.visit(`/services/create?server_id=${selectedServer.id}`)}
                    >
                      Ajouter service
                    </ActionButton>
                  </div>
                </div>

                <div>
                  <h5 class="font-semibold mb-2">Statistiques</h5>
                  <div class="text-xs space-y-1">
                    <div>
                      Services hébergés:
                      <span class="badge badge-sm">{selectedServer.servicesCount}</span>
                    </div>
                    <div>
                      Total dépendances:
                      <span class="badge badge-sm">{selectedServer.dependenciesCount}</span>
                    </div>
                  </div>
                </div>

                <!-- Aperçu des services -->
                {#if selectedServer.services.length > 0}
                  <div>
                    <h5 class="font-semibold mb-2">Services ({selectedServer.servicesCount})</h5>
                    <div class="space-y-1 max-h-32 overflow-y-auto">
                      {#each selectedServer.services.slice(0, 5) as service}
                        <button
                          class="text-xs link link-secondary block text-left"
                          on:click={() => router.visit(`/services/${service.id}`)}
                        >
                          {service.nom}
                        </button>
                      {/each}
                      {#if selectedServer.services.length > 5}
                        <div class="text-xs text-base-content/50">
                          ... et {selectedServer.services.length - 5} autres
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>


  </div>
</DashboardLayout>

<style>
  @reference '../../css/app.css';

  button{
    @apply btn btn-outline btn-sm;
  }

  /* Styles globaux pour Cytoscape */
  :global(.cy-container) {
    outline: none;
  }

  /* Responsive adjustments */
  @media (max-width: 1024px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
