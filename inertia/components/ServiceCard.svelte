<script>
  import { router } from '@inertiajs/svelte';
  import ActionButton from './ActionButton.svelte';
  import ServicePorts from './ServicePorts.svelte';

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

  // ✅ NOUVEAU: Helper pour gérer les icônes (ancien + nouveau système)
  function getIconUrl(icon) {
    if (!icon) return null;

    // Si l'icône commence par '/uploads/', c'est le nouveau système (URL complète)
    if (icon.startsWith('/uploads/')) {
      return icon;
    }

    // Si l'icône commence par 'http', c'est une URL externe
    if (icon.startsWith('http')) {
      return icon;
    }

    // Sinon, c'est l'ancien système (nom de fichier dans /icons/)
    return `/icons/${icon}`;
  }

  // Reactive variables
  $: maintenance = getMaintenanceStatus(service.lastMaintenanceAt);
  $: serviceName = service.name || service.nom || 'Service sans nom';
  $: serverName = service.server?.name || service.server?.nom;
  $: serverIp = service.server?.ip;
  $: iconUrl = getIconUrl(service.icon);
</script>

<!-- Service Card Component -->
<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow {variant === 'compact' ? 'bg-base-200' : ''}">
  <div class="card-body {variant === 'compact' ? 'p-4' : ''}">

    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <h3 class="card-title {variant === 'compact' ? 'text-base' : ''}">{serviceName}</h3>

        {#if showServer && serverName}
          <p class="text-sm text-base-content/70">📍 {serverName}</p>
        {/if}

        {#if service.description}
          <p class="text-sm text-base-content/60 mt-1">{service.description}</p>
        {/if}

        {#if service.path}
          <p class="text-xs text-base-content/50 mt-1">{service.path}</p>
        {/if}
      </div>

      {#if iconUrl}
        <div class="w-12 h-12 bg-white border border-base-200 p-2 rounded-full flex-shrink-0 ml-3">
          <img
            src={iconUrl}
            alt={serviceName}
            class="w-full h-full object-contain"
            on:error={(e) => e.target.style.display='none'}
          />
        </div>
      {/if}
    </div>

    <!-- ✅ NOUVEAU: Affichage des ports -->
    {#if service.ports && service.ports.length > 0}
      <div class="mt-3">
        <ServicePorts
          ports={service.ports}
          {serverIp}
          servicePath={service.path}
          size={variant === 'compact' ? 'small' : 'normal'}
        />
      </div>
    {/if}

    <div class="mt-3 flex flex-wrap gap-2 items-center">
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
</style>
