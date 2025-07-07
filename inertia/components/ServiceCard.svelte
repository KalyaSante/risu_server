<script>
  import { router } from '@inertiajs/svelte';
  import ActionButton from './ActionButton.svelte';
  import ServicePorts from './ServicePorts.svelte';
  import ServiceImg from "~/components/ServiceImg.svelte";

  // Props
  export let service = {};
  export let variant = 'full'; // 'full' ou 'compact'
  export let showServer = true; // Afficher ou non le serveur (pour les pages de détail serveur)

  // Functions
  function viewService() {
    router.visit(`/services/${service.id}`);
  }

  function editService() {
    router.visit(`/services/${service.id}/edit`);
  }

  function getMaintenanceStatus(lastMaintenanceAt) {
    if (!lastMaintenanceAt) return { status: 'never', days: 999, badge: 'badge-ghost', text: 'Jamais maintenu' };

    const days = Math.floor((Date.now() - new Date(lastMaintenanceAt).getTime()) / (1000 * 60 * 60 * 24));

    if (days <= 7) {
      return { status: 'recent', days, badge: 'badge-success', text: `Maintenance il y a ${days} jour${days > 1 ? 's' : ''}` };
    } else if (days <= 30) {
      return { status: 'warning', days, badge: 'badge-warning', text: `Maintenance il y a ${days} jours` };
    } else {
      return { status: 'critical', days, badge: 'badge-error', text: `Maintenance il y a ${days} jours` };
    }
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
  $: maintenance = getMaintenanceStatus(service.lastMaintenanceAt);
  $: serviceName = service.name || service.nom || 'Service sans nom';
  $: serverName = service.server?.name || service.server?.nom;
  $: serverIp = service.server?.ip;
  $: iconUrl = service.icon;
</script>

<!-- Service Card Component -->
<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow {variant === 'compact' ? 'bg-base-200' : ''}">
  <div class="card-body {variant === 'compact' ? 'p-4' : ''}">

    <!-- Header avec image prominente -->
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0 w-20">
        {#if service.icon}
          <ServiceImg {service}></ServiceImg>
        {/if}
      </div>

      <!-- Informations du service -->
      <div class="flex-1 min-w-0">
        <h3 class="card-title {variant === 'compact' ? 'text-base' : 'text-lg'} line-clamp-2">
          {serviceName}
        </h3>

        {#if showServer && serverName}
          <p class="text-sm text-base-content/70 mt-1">📍 {serverName}</p>
        {/if}

        {#if service.description}
          <p class="text-sm text-base-content/60 mt-2 line-clamp-2">{service.description}</p>
        {/if}

        {#if service.path}
          <p class="text-xs text-base-content/50 mt-1 font-mono bg-base-200 px-2 py-1 rounded inline-block">
            {service.path}
          </p>
        {/if}
      </div>
    </div>

    <!-- ✅ NOUVEAU: Affichage des ports -->
    {#if service.ports && service.ports.length > 0}
      <div class="mt-4">
        <ServicePorts
          ports={service.ports}
          {serverIp}
          servicePath={service.path}
          size={variant === 'compact' ? 'small' : 'normal'}
        />
      </div>
    {/if}

    <!-- Badges et statuts -->
    <div class="mt-4 flex flex-wrap gap-2 items-center">
      <!-- Status et maintenance -->
      <div class="badge {maintenance.badge} badge-sm">
        {maintenance.text}
      </div>

      <!-- Dependencies info -->
      {#if service.dependenciesCount > 0}
        <div class="badge badge-ghost badge-sm">
          {service.dependenciesCount} dépendance{service.dependenciesCount > 1 ? 's' : ''}
        </div>
      {/if}

      <!-- Status du service -->
      {#if service.status}
        <div class="badge {service.status === 'running' ? 'badge-success' : 'badge-error'} badge-sm">
          {service.status === 'running' ? '🟢 Running' : '🔴 Stopped'}
        </div>
      {/if}
    </div>

    <!-- Actions -->
    <div class="card-actions justify-end mt-{variant === 'compact' ? '3' : '4'}">
      <ActionButton
        variant="primary"
        size={variant === 'compact' ? 'xs' : 'sm'}
        on:click={viewService}
      >
        Voir
      </ActionButton>
      <ActionButton
        variant="secondary"
        size={variant === 'compact' ? 'xs' : 'sm'}
        on:click={editService}
      >
        Modifier
      </ActionButton>
    </div>

  </div>
</div>

<style>
  /* Effet hover pour soulever légèrement la card */
  .card:hover {
    transform: translateY(-2px);
  }

  /* Line clamp utilities */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Amélioration responsive */
  @media (max-width: 640px) {
    .card-body {
      padding: 1rem;
    }

    .flex-1 {
      min-width: 0; /* Permet le text-wrap dans flexbox */
    }
  }
</style>
