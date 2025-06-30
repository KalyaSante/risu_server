<script>
  import { router } from '@inertiajs/svelte';
  import { DashboardLayout } from '../../app';
  import { ActionButton, MarkdownViewer } from '../../components';
  import ServicePorts from '../../components/ServicePorts.svelte';

  // Props from Inertia
  export let service = {};
  export let dependencies = [];
  export let dependents = [];
  export let user = {};
  export let flash = {};

  // Functions
  function editService() {
    router.visit(`/services/${service.id}/edit`);
  }

  function goToServer() {
    router.visit(`/servers/${service.server?.id}`);
  }

  function goToService(serviceId) {
    router.visit(`/services/${serviceId}`);
  }

  function openRepository() {
    if (service.repoUrl) {
      window.open(service.repoUrl, '_blank');
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      // Could add toast notification here
      console.log('Copied:', text);
    }).catch(() => {
      console.log('Copy failed');
    });
  }

  function formatDate(dateString) {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getMaintenanceStatus(lastMaintenanceAt) {
    if (!lastMaintenanceAt) return { badge: 'badge-ghost', text: 'Jamais' };

    const days = Math.floor((Date.now() - new Date(lastMaintenanceAt).getTime()) / (1000 * 60 * 60 * 24));

    if (days <= 7) {
      return { badge: 'badge-success', text: 'Récent' };
    } else if (days <= 30) {
      return { badge: 'badge-warning', text: `${days}j` };
    } else {
      return { badge: 'badge-error', text: `${days}j` };
    }
  }

  function getDependencyBadge(type) {
    switch (type) {
      case 'required':
        return 'badge-error';
      case 'optional':
        return 'badge-warning';
      default:
        return 'badge-success';
    }
  }

  function getDependencyText(type) {
    switch (type) {
      case 'required':
        return 'Critique';
      case 'optional':
        return 'Optionnel';
      default:
        return 'Fallback';
    }
  }

  // Reactive
  $: maintenanceStatus = getMaintenanceStatus(service.lastMaintenanceAt);
  $: repoUrlShort = service.repoUrl ? service.repoUrl.replace('https://github.com/', '') : '';
</script>

<svelte:head>
  <title>{service.nom} - Kalya</title>
</svelte:head>

<DashboardLayout {user} {flash} title="{service.nom} - Kalya" currentRoute="services">

  <!-- Header -->
  <div class="flex justify-between items-start mb-6">
    <div>
      <!-- Breadcrumbs -->
      <div class="breadcrumbs text-sm">
        <ul>
          <li><button class="link" on:click={() => router.visit('/services')}>Services</button></li>
          <li>{service.nom}</li>
        </ul>
      </div>

      <!-- Title -->
      <h1 class="text-3xl font-bold mt-2 flex items-center gap-3">
        {#if service.icon}
          <img src="/icons/{service.icon}" alt={service.nom} class="w-8 h-8" on:error={(e) => e.target.style.display='none'} />
        {:else}
          ⚙️
        {/if}
        {service.nom}
      </h1>

      <!-- Server info -->
      <p class="text-base-content/70 mt-1">
        📍 Hébergé sur
        <button class="link" on:click={goToServer}>
          {service.server?.nom}
        </button>
      </p>

      <!-- ✅ NOUVEAU: Description -->
      {#if service.description}
        <p class="text-base-content/60 mt-2">{service.description}</p>
      {/if}
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <ActionButton variant="secondary" on:click={editService}>
        <span>✏️</span>
        Modifier
      </ActionButton>
      {#if service.repoUrl}
        <ActionButton variant="accent" on:click={openRepository}>
          <span>🔗</span>
          Code source
        </ActionButton>
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

    <!-- Left column - Info and stats -->
    <div class="lg:col-span-1 space-y-6">

      <!-- Service information -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">📋 Informations</h2>
          <div class="space-y-4">

            <!-- Server -->
            <div>
              <label class="label-text font-semibold" for="service_server_display">Serveur</label>
              <div id="service_server_display" class="flex items-center gap-2 mt-1">
                <button class="link link-primary" on:click={goToServer}>
                  {service.server?.nom}
                </button>
                {#if service.server?.ip}
                  <div class="badge badge-sm">{service.server.ip}</div>
                {/if}
              </div>
            </div>

            <!-- ✅ NOUVEAU: Ports -->
            {#if service.ports && service.ports.length > 0}
              <div>
                <label class="label-text font-semibold" for="service_ports_display">Ports exposés</label>
                <div id="service_ports_display" class="mt-2">
                  <ServicePorts
                    ports={service.ports}
                    serverIp={service.server?.ip}
                    servicePath={service.path}
                    size="normal"
                  />
                </div>
              </div>
            {/if}

            <!-- Installation path -->
            {#if service.path}
              <div>
                <label class="label-text font-semibold" for="service_path_display">Chemin d'installation</label>
                <div class="flex items-center gap-2 mt-1">
                  <code id="service_path_display" class="bg-base-200 px-3 py-2 rounded text-sm flex-1 truncate">
                    {service.path}
                  </code>
                  <button
                    class="btn btn-sm btn-square btn-outline"
                    on:click={() => copyToClipboard(service.path)}
                    title="Copier le chemin"
                    aria-label="Copier le chemin d'installation"
                  >
                    📋
                  </button>
                </div>
              </div>
            {/if}

            <!-- Repository -->
            {#if service.repoUrl}
              <div>
                <label class="label-text font-semibold" for="service_repo_display">Repository</label>
                <div id="service_repo_display" class="mt-1">
                  <button class="link link-primary text-sm" on:click={openRepository}>
                    {repoUrlShort}
                  </button>
                </div>
              </div>
            {/if}

            <!-- Documentation -->
            {#if service.docPath}
              <div>
                <label class="label-text font-semibold" for="service_doc_display">Documentation</label>
                <p id="service_doc_display" class="mt-1 text-sm">{service.docPath}</p>
              </div>
            {/if}

            <!-- Last maintenance -->
            <div>
              <label class="label-text font-semibold" for="service_maintenance_display">Dernière maintenance</label>
              <div id="service_maintenance_display" class="flex items-center gap-2 mt-1">
                <time class="text-sm" datetime={service.lastMaintenanceAt}>
                  {formatDate(service.lastMaintenanceAt)}
                </time>
                <div class="badge {maintenanceStatus.badge} badge-sm">
                  {maintenanceStatus.text}
                </div>
              </div>
            </div>

            <!-- Created date -->
            <div>
              <label class="label-text font-semibold" for="service_created_display">Créé le</label>
              <p id="service_created_display" class="mt-1 text-sm">{formatDate(service.createdAt)}</p>
            </div>

          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">📊 Statistiques</h2>
          <div class="stats stats-vertical">

            <!-- Dependencies -->
            <div class="stat">
              <div class="stat-figure text-primary">
                <span class="text-3xl">⬇️</span>
              </div>
              <div class="stat-title">Dépendances</div>
              <div class="stat-value text-primary">{dependencies.length}</div>
              <div class="stat-desc">Services requis</div>
            </div>

            <!-- Dependents -->
            <div class="stat">
              <div class="stat-figure text-secondary">
                <span class="text-3xl">⬆️</span>
              </div>
              <div class="stat-title">Dépendants</div>
              <div class="stat-value text-secondary">{dependents.length}</div>
              <div class="stat-desc">Services clients</div>
            </div>

          </div>
        </div>
      </div>

    </div>

    <!-- Right column - Dependencies and relations -->
    <div class="lg:col-span-2 space-y-6">

      <!-- Dependencies (services this service depends on) -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">⬇️ Dépendances</h2>
            {#if dependencies.length > 0}
              <div class="badge badge-primary">
                {dependencies.length} dépendance{dependencies.length > 1 ? 's' : ''}
              </div>
            {/if}
          </div>

          {#if dependencies.length === 0}
            <!-- Empty state -->
            <div class="text-center py-8">
              <div class="text-4xl mb-4">🎯</div>
              <h3 class="text-lg font-bold mb-2">Aucune dépendance</h3>
              <p class="text-base-content/70">Ce service fonctionne de manière autonome.</p>
            </div>
          {:else}
            <!-- Dependencies list -->
            <div class="space-y-3">
              {#each dependencies as dependency}
                <div class="card bg-base-200 compact">
                  <div class="card-body">
                    <div class="flex items-center justify-between">

                      <!-- Service info -->
                      <div class="flex items-center gap-3">
                        {#if dependency.icon}
                          <img
                            src="/icons/{dependency.icon}"
                            alt={dependency.name}
                            class="w-6 h-6"
                            on:error={(e) => e.target.style.display='none'}
                          />
                        {:else}
                          ⚙️
                        {/if}
                        <div>
                          <h4 class="font-semibold">
                            <button class="link" on:click={() => goToService(dependency.id)}>
                              {dependency.name}
                            </button>
                          </h4>
                          <p class="text-sm text-base-content/70">{dependency.server}</p>
                        </div>
                      </div>

                      <!-- Badges -->
                      <div class="flex items-center gap-2">
                        <div class="badge badge-sm">{dependency.label}</div>
                        <div class="badge {getDependencyBadge(dependency.type)} badge-sm">
                          {getDependencyText(dependency.type)}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Dependents (services that depend on this service) -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">⬆️ Services dépendants</h2>
            {#if dependents.length > 0}
              <div class="badge badge-secondary">
                {dependents.length} dépendant{dependents.length > 1 ? 's' : ''}
              </div>
            {/if}
          </div>

          {#if dependents.length === 0}
            <!-- Empty state -->
            <div class="text-center py-8">
              <div class="text-4xl mb-4">🏝️</div>
              <h3 class="text-lg font-bold mb-2">Aucun service dépendant</h3>
              <p class="text-base-content/70">Aucun autre service ne dépend de celui-ci.</p>
            </div>
          {:else}
            <!-- Dependents list -->
            <div class="space-y-3">
              {#each dependents as dependent}
                <div class="card bg-base-200 compact">
                  <div class="card-body">
                    <div class="flex items-center justify-between">

                      <!-- Service info -->
                      <div class="flex items-center gap-3">
                        {#if dependent.icon}
                          <img
                            src="/icons/{dependent.icon}"
                            alt={dependent.name}
                            class="w-6 h-6"
                            on:error={(e) => e.target.style.display='none'}
                          />
                        {:else}
                          ⚙️
                        {/if}
                        <div>
                          <h4 class="font-semibold">
                            <button class="link" on:click={() => goToService(dependent.id)}>
                              {dependent.name}
                            </button>
                          </h4>
                          <p class="text-sm text-base-content/70">{dependent.server}</p>
                        </div>
                      </div>

                      <!-- Badges -->
                      <div class="flex items-center gap-2">
                        <div class="badge badge-sm">{dependent.label}</div>
                        <div class="badge {getDependencyBadge(dependent.type)} badge-sm">
                          {getDependencyText(dependent.type)}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- ✅ NOUVEAU: Notes techniques du service -->
      <MarkdownViewer
        content={service.note}
        title="📝 Notes techniques"
      />

    </div>

  </div>

</DashboardLayout>
