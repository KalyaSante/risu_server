<script>
  import { DashboardLayout } from '../../app';
  import { ActionButton, ServiceCard, MarkdownViewer } from '../../components';
  import { router } from '@inertiajs/svelte';

  // Props from Inertia
  export let server = {};
  export let user = {};
  export let flash = {};

  // Functions
  function editServer() {
    router.visit(`/servers/${server.id}/edit`);
  }

  function createService() {
    router.visit(`/services/create?server_id=${server.id}`);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      // Vous pourriez ajouter une notification toast ici
      console.log('IP copiée dans le presse-papiers');
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

  function formatDate(dateString) {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Reactive variables
  $: servicesCount = server.services?.length || 0;
  $: dependenciesCount = server.services?.reduce((acc, s) => acc + (s.dependencies?.length || 0), 0) || 0;

  // Breadcrumbs
  $: breadcrumbs = [
    { label: 'Serveurs', href: '/servers' },
    { label: server.name }
  ];
</script>

<svelte:head>
  <title>{server.name} - Risu</title>
</svelte:head>

<DashboardLayout {user} {flash} title="{server.name} - Risu" currentRoute="servers">
  <!-- En-tête -->
  <div class="flex justify-between items-start mb-6">
    <div>
      <div class="breadcrumbs text-sm">
        <ul>
          {#each breadcrumbs as crumb}
            <li>
              {#if crumb.href}
                <a href={crumb.href} class="link" on:click|preventDefault={() => router.visit(crumb.href)}>
                  {crumb.label}
                </a>
              {:else}
                {crumb.label}
              {/if}
            </li>
          {/each}
        </ul>
      </div>
      <h1 class="text-3xl font-bold mt-2">🖥️ {server.name}</h1>
    </div>
    <div class="flex gap-2">
      <ActionButton variant="secondary" on:click={editServer}>
        <span>✏️</span>
        Modifier
      </ActionButton>
      <ActionButton variant="primary" on:click={createService}>
        <span>➕</span>
        Ajouter un service
      </ActionButton>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Informations du serveur -->
    <div class="lg:col-span-1 space-y-6">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">📋 Informations</h2>
          <div class="space-y-4">
            <div>
              <label class="label-text font-semibold" for="server_ip_display">Adresse IP</label>
              <div class="flex items-center gap-2 mt-1">
                <code id="server_ip_display" class="bg-base-200 px-3 py-2 rounded text-sm flex-1">{server.ip}</code>
                <button
                  class="btn btn-sm btn-square btn-outline"
                  on:click={() => copyToClipboard(server.ip)}
                  title="Copier l'IP"
                  aria-label="Copier l'adresse IP"
                >
                  📋
                </button>
              </div>
            </div>

            <div>
              <label class="label-text font-semibold" for="server_hebergeur_display">Hébergeur</label>
              <div id="server_hebergeur_display" class="mt-1">
                <div class="badge badge-primary">{server.hebergeur}</div>
              </div>
            </div>

            <div>
              <label class="label-text font-semibold" for="server_localisation_display">Localisation</label>
              <p id="server_localisation_display" class="mt-1 text-sm">{server.localisation}</p>
            </div>

            {#if server.parentServer}
              <div>
                <label class="label-text font-semibold" for="server_parent_display">Hébergé dans</label>
                <a
                  id="server_parent_display"
                  href={`/servers/${server.parentServer.id}`}
                  class="link mt-1 block"
                  on:click|preventDefault={() => router.visit(`/servers/${server.parentServer.id}`)}
                >
                  {server.parentServer.name}
                </a>
              </div>
            {/if}

            <div>
              <label class="label-text font-semibold" for="server_createdAt_display">Créé le</label>
              <p id="server_createdAt_display" class="mt-1 text-sm">{formatDate(server.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">📊 Statistiques</h2>
          <div class="stats stats-vertical">
            <!-- Stats services -->
            <div class="stat">
              <div class="stat-figure text-primary">
                <span class="text-3xl">⚙️</span>
              </div>
              <div class="stat-title">Services</div>
              <div class="stat-value text-primary">{servicesCount}</div>
            </div>
            <!-- Stats dépendances -->
            <div class="stat">
              <div class="stat-figure text-secondary">
                <span class="text-3xl">🔗</span>
              </div>
              <div class="stat-title">Dépendances</div>
              <div class="stat-value text-secondary">{dependenciesCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Services du serveur -->
    <div class="lg:col-span-2">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">⚙️ Services hébergés</h2>
            {#if servicesCount > 0}
              <div class="badge badge-accent">{servicesCount} service{servicesCount > 1 ? 's' : ''}</div>
            {/if}
          </div>

          {#if servicesCount === 0}
            <div class="text-center py-16">
              <div class="text-4xl mb-4">⚙️</div>
              <h3 class="text-xl font-bold mb-2">Aucun service configuré</h3>
              <p class="text-base-content/70 mb-6">Ce serveur n'héberge aucun service pour le moment.</p>
              <ActionButton variant="primary" on:click={createService}>
                <span>➕</span>
                Ajouter le premier service
              </ActionButton>
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {#each server.services as service (service.id)}
                <ServiceCard
                  {service}
                  variant="compact"
                  showServer={false}
                />
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- ✅ NOUVEAU: Notes du serveur -->
      <MarkdownViewer
        content={server.note}
        title="📝 Notes"
      />
    </div>
  </div>
</DashboardLayout>
