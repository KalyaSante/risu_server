<script>
  import { ActionButton } from './index.js';

  // Props
  export let dependencies = [];
  export let availableServices = [];
  export let disabled = false;

  // État local pour l'ajout d'une nouvelle dépendance
  let newDependency = {
    serviceId: '',
    label: '',
    type: 'required'
  };

  // Types de dépendances disponibles
  const dependencyTypes = [
    { value: 'required', label: '🔴 Requise', description: 'Le service ne peut pas fonctionner sans cette dépendance' },
    { value: 'optional', label: '🟡 Optionnelle', description: 'Le service peut fonctionner sans cette dépendance' },
    { value: 'fallback', label: '🟢 Fallback', description: 'Service de secours ou alternatif' }
  ];

  // Fonction pour ajouter une dépendance
  function addDependency() {
    if (!newDependency.serviceId) return;

    // Vérifier qu'elle n'existe pas déjà
    const exists = dependencies.some(dep => dep.serviceId === parseInt(newDependency.serviceId));
    if (exists) return;

    dependencies = [...dependencies, {
      serviceId: parseInt(newDependency.serviceId),
      label: newDependency.label || getServiceName(newDependency.serviceId),
      type: newDependency.type
    }];

    // Reset du formulaire
    newDependency = {
      serviceId: '',
      label: '',
      type: 'required'
    };
  }

  // Fonction pour supprimer une dépendance
  function removeDependency(index) {
    dependencies = dependencies.filter((_, i) => i !== index);
  }

  // Helper pour récupérer le nom d'un service
  function getServiceName(serviceId) {
    const service = availableServices.find(s => s.id === parseInt(serviceId));
    return service ? service.name : '';
  }

  // Helper pour récupérer le nom du serveur d'un service
  function getServerName(serviceId) {
    const service = availableServices.find(s => s.id === parseInt(serviceId));
    return service ? service.serverName : '';
  }

  // Helper pour récupérer le type d'une dépendance
  function getDependencyTypeInfo(type) {
    return dependencyTypes.find(t => t.value === type) || dependencyTypes[0];
  }

  // Services disponibles pour l'ajout
  $: availableForAdd = availableServices.filter(service =>
    !dependencies.some(dep => dep.serviceId === service.id)
  );

  // Auto-remplir le label quand on sélectionne un service
  $: if (newDependency.serviceId && !newDependency.label) {
    newDependency.label = getServiceName(newDependency.serviceId);
  }
</script>

<div class="form-control">
  <label class="label">
    <span class="label-text font-semibold">🔗 Dépendances</span>
    <span class="label-text-alt">Services nécessaires au bon fonctionnement</span>
  </label>

  <!-- Liste des dépendances existantes -->
  {#if dependencies.length > 0}
    <div class="space-y-2 mb-4">
      {#each dependencies as dependency, index}
        {@const typeInfo = getDependencyTypeInfo(dependency.type)}
        <div class="alert alert-info p-3">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-3">
              <span class="text-lg">{typeInfo.label.split(' ')[0]}</span>
              <div>
                <div class="font-semibold">
                  {getServiceName(dependency.serviceId)}
                  <span class="text-xs text-base-content/60">({getServerName(dependency.serviceId)})</span>
                </div>
                {#if dependency.label && dependency.label !== getServiceName(dependency.serviceId)}
                  <div class="text-sm text-base-content/70">
                    {dependency.label}
                  </div>
                {/if}
                <div class="text-xs badge badge-outline mt-1">
                  {typeInfo.label}
                </div>
              </div>
            </div>

            <ActionButton
              variant="ghost"
              size="sm"
              disabled={disabled}
              on:click={() => removeDependency(index)}
              title="Supprimer cette dépendance"
            >
              ✕
            </ActionButton>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Formulaire d'ajout de dépendance -->
  {#if availableForAdd.length > 0}
    <div class="card bg-base-200 p-4">
      <h3 class="font-semibold mb-3">➕ Ajouter une dépendance</h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <!-- Sélection du service -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-sm">Service</span>
          </label>
          <select
            bind:value={newDependency.serviceId}
            class="select select-bordered select-sm"
            disabled={disabled}
          >
            <option value="">Choisir un service</option>
            {#each availableForAdd as service}
              <option value={service.id}>
                {service.name} ({service.serverName})
              </option>
            {/each}
          </select>
        </div>

        <!-- Type de dépendance -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-sm">Type</span>
          </label>
          <select
            bind:value={newDependency.type}
            class="select select-bordered select-sm"
            disabled={disabled}
          >
            {#each dependencyTypes as type}
              <option value={type.value}>{type.label}</option>
            {/each}
          </select>
        </div>

        <!-- Action -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-sm">&nbsp;</span>
          </label>
          <ActionButton
            variant="primary"
            size="sm"
            on:click={addDependency}
            disabled={disabled || !newDependency.serviceId}
          >
            Ajouter
          </ActionButton>
        </div>
      </div>

      <!-- Label personnalisé (optionnel) -->
      {#if newDependency.serviceId}
        <div class="form-control mt-3">
          <label class="label">
            <span class="label-text text-sm">Label personnalisé (optionnel)</span>
          </label>
          <input
            type="text"
            bind:value={newDependency.label}
            placeholder="ex: Base de données principale, Cache Redis..."
            class="input input-bordered input-sm"
            disabled={disabled}
          />
        </div>

        <!-- Description du type sélectionné -->
        {@const selectedTypeInfo = getDependencyTypeInfo(newDependency.type)}
        <div class="alert alert-info mt-3 p-2">
          <span class="text-sm">{selectedTypeInfo.description}</span>
        </div>
      {/if}
    </div>
  {:else if dependencies.length === 0}
    <div class="alert">
      <span>Aucune dépendance définie. Ce service fonctionne de manière autonome.</span>
    </div>
  {:else}
    <div class="alert alert-warning">
      <span>Tous les services disponibles sont déjà ajoutés en dépendance.</span>
    </div>
  {/if}

  <!-- Aide -->
  <label class="label">
    <span class="label-text-alt">
      💡 Les dépendances permettent de tracer les relations entre services et d'identifier l'impact des pannes
    </span>
  </label>
</div>

<style>
  @reference "../css/app.css";

  .alert {
    @apply flex items-center gap-3 p-3 rounded-lg;
  }

  .alert-info {
    @apply bg-info/10 text-info-content border border-info/20;
  }

  .alert-warning {
    @apply bg-warning/10 text-warning-content border border-warning/20;
  }
</style>
