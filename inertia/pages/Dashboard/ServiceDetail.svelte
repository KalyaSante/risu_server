<script>
  import { DashboardLayout } from '../../app';
  import { ActionButton, Alert } from '../../components';
  import { router } from '@inertiajs/svelte';

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

  function goToService(serviceId) {
    router.visit(`/dashboard/service/${serviceId}`);
  }

  function goToServer(serverId) {
    router.visit(`/servers/${serverId}`);
  }
</script>

<svelte:head>
  <title>Service {service.nom} - Risu</title>
</svelte:head>

<DashboardLayout {user} {flash} title="Service Details - Risu" currentRoute="dashboard">
  <!-- Service Header -->
  <div class="service-detail">
    <div class="service-detail__header">
      <div class="service-detail__info">
        <h1 class="service-detail__title">{service.nom}</h1>
        <div class="service-detail__meta">
          <span class="service-detail__server">
            Serveur:
            <button
              class="link"
              on:click={() => goToServer(service.server?.id)}
            >
              {service.server?.nom}
            </button>
          </span>
          {#if service.path}
            <span class="service-detail__path">Path: {service.path}</span>
          {/if}
        </div>
      </div>

      <div class="service-detail__actions">
        <ActionButton variant="primary" on:click={editService}>
          Modifier
        </ActionButton>
        <ActionButton variant="secondary" href="/services">
          Retour à la liste
        </ActionButton>
      </div>
    </div>

    <!-- Service Details -->
    <div class="service-detail__content">
      <div class="service-detail__grid">
        <!-- Basic Info -->
        <div class="service-detail__card">
          <h3>Informations générales</h3>
          <div class="service-detail__field">
            <strong>Nom:</strong> {service.nom}
          </div>
          {#if service.icon}
            <div class="service-detail__field">
              <strong>Icône:</strong> {service.icon}
            </div>
          {/if}
          {#if service.path}
            <div class="service-detail__field">
              <strong>Chemin:</strong> {service.path}
            </div>
          {/if}
          {#if service.repoUrl}
            <div class="service-detail__field">
              <strong>Repository:</strong>
              <a href={service.repoUrl} target="_blank" rel="noopener noreferrer">
                {service.repoUrl}
              </a>
            </div>
          {/if}
          {#if service.docPath}
            <div class="service-detail__field">
              <strong>Documentation:</strong> {service.docPath}
            </div>
          {/if}
        </div>

        <!-- Dependencies -->
        <div class="service-detail__card">
          <h3>Dépendances ({dependencies.length})</h3>
          {#if dependencies.length > 0}
            <div class="dependencies-list">
              {#each dependencies as dep}
                <div class="dependency-item">
                  <button
                    class="dependency-item__name link"
                    on:click={() => goToService(dep.id)}
                  >
                    {dep.name}
                  </button>
                  <span class="dependency-item__type">{dep.type}</span>
                  {#if dep.label}
                    <span class="dependency-item__label">{dep.label}</span>
                  {/if}
                  {#if dep.server}
                    <span class="dependency-item__server">({dep.server})</span>
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <p class="empty-state">Aucune dépendance configurée</p>
          {/if}
        </div>

        <!-- Dependents -->
        <div class="service-detail__card">
          <h3>Services dépendants ({dependents.length})</h3>
          {#if dependents.length > 0}
            <div class="dependencies-list">
              {#each dependents as dep}
                <div class="dependency-item">
                  <button
                    class="dependency-item__name link"
                    on:click={() => goToService(dep.id)}
                  >
                    {dep.name}
                  </button>
                  <span class="dependency-item__type">{dep.type}</span>
                  {#if dep.label}
                    <span class="dependency-item__label">{dep.label}</span>
                  {/if}
                  {#if dep.server}
                    <span class="dependency-item__server">({dep.server})</span>
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <p class="empty-state">Aucun service ne dépend de celui-ci</p>
          {/if}
        </div>

        <!-- Maintenance Info -->
        {#if service.lastMaintenanceAt}
          <div class="service-detail__card">
            <h3>Maintenance</h3>
            <div class="service-detail__field">
              <strong>Dernière maintenance:</strong>
              {new Date(service.lastMaintenanceAt).toLocaleDateString('fr-FR')}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</DashboardLayout>

<style>
  /* Service Detail styles will go here */
  .service-detail {
    /* Main container */
  }

  .service-detail__header {
    /* Header with title and actions */
  }

  .service-detail__info {
    /* Info section */
  }

  .service-detail__title {
    /* Main title */
  }

  .service-detail__meta {
    /* Meta information */
  }

  .service-detail__server,
  .service-detail__path {
    /* Meta items */
  }

  .service-detail__actions {
    /* Action buttons */
  }

  .service-detail__content {
    /* Main content area */
  }

  .service-detail__grid {
    /* Grid layout for cards */
  }

  .service-detail__card {
    /* Individual cards */
  }

  .service-detail__field {
    /* Field display */
  }

  .dependencies-list {
    /* Dependencies list */
  }

  .dependency-item {
    /* Individual dependency item */
  }

  .dependency-item__name {
    /* Dependency name */
  }

  .dependency-item__type,
  .dependency-item__label,
  .dependency-item__server {
    /* Dependency metadata */
  }

  .link {
    /* Link button style */
  }

  .empty-state {
    /* Empty state text */
  }
</style>
