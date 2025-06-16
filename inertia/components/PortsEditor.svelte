<script>
  // Composant pour éditer les ports d'un service
  export let ports = [];
  export let disabled = false;

  // Ajouter un port vide
  function addPort() {
    ports = [...ports, { port: '', label: '' }];
  }

  // Supprimer un port
  function removePort(index) {
    ports = ports.filter((_, i) => i !== index);
  }

  // ✅ MODIFIÉ: Assurer qu'il y a toujours au moins un port par défaut
  $: if (ports.length === 0) {
    ports = [{ port: '', label: 'web' }];
  }

  // Ports prédéfinis pour suggestions
  const commonPorts = [
    { port: 80, label: 'web' },
    { port: 443, label: 'https' },
    { port: 3000, label: 'web' },
    { port: 8080, label: 'api' },
    { port: 9090, label: 'metrics' },
    { port: 5432, label: 'database' }
  ];

  // Suggestions de labels
  const commonLabels = ['web', 'api', 'admin', 'metrics', 'database', 'cache'];

  function selectCommonPort(commonPort, index) {
    ports[index] = { ...commonPort };
    ports = [...ports]; // Trigger reactivity
  }

  // ✅ NOUVEAU: Nettoyer les ports vides avant la soumission
  function cleanEmptyPorts() {
    ports = ports.filter(port => port.port || port.label);
    if (ports.length === 0) {
      ports = [{ port: '', label: '' }];
    }
  }
</script>

<div class="ports-editor space-y-3">
  <label class="label">
    <span class="label-text font-medium">Ports du service</span>
    <span class="label-text-alt">Port et label optionnels (ex: 3000, web)</span>
  </label>

  {#each ports as port, index}
    <div class="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
      <div class="flex-1 grid grid-cols-2 gap-2">
        <!-- Port number -->
        <div class="form-control">
          <input
            type="number"
            bind:value={port.port}
            placeholder="Port (ex: 3000)"
            class="input input-bordered input-sm"
            min="1"
            max="65535"
            {disabled}
            on:blur={cleanEmptyPorts}
          />
        </div>

        <!-- Label -->
        <div class="form-control relative">
          <input
            type="text"
            bind:value={port.label}
            placeholder="Label (ex: web)"
            class="input input-bordered input-sm"
            list="label-suggestions-{index}"
            maxlength="50"
            {disabled}
            on:blur={cleanEmptyPorts}
          />
          <datalist id="label-suggestions-{index}">
            {#each commonLabels as label}
              <option value={label}>{label}</option>
            {/each}
          </datalist>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1">
        <!-- Suggestions ports communs -->
        {#if !disabled}
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-xs" title="Suggestions">
              💡
            </div>
            <div class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
              <div class="menu-title">Ports courants</div>
              {#each commonPorts as commonPort}
                <button
                  type="button"
                  class="btn btn-ghost btn-xs justify-start"
                  on:click={() => selectCommonPort(commonPort, index)}
                >
                  {commonPort.port} ({commonPort.label})
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Supprimer port -->
        {#if ports.length > 1 && !disabled}
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square text-error"
            on:click={() => removePort(index)}
            title="Supprimer ce port"
          >
            ✕
          </button>
        {/if}
      </div>
    </div>
  {/each}

  <!-- Ajouter un port -->
  {#if !disabled}
    <button
      type="button"
      class="btn btn-outline btn-sm w-full"
      on:click={addPort}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Ajouter un port
    </button>
  {/if}

  <!-- ✅ SUPPRIMÉ: L'input hidden n'est plus nécessaire avec Inertia et le binding Svelte -->
</div>

<style>
  .ports-editor {
    @apply w-full;
  }
</style>
