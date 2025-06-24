<script>
  // Composant pour afficher les ports d'un service
  export let ports = [];
  export let serverIp = '';
  export let servicePath = '';
  export let showLabels = true;
  export let size = 'normal'; // 'small', 'normal', 'large'

  // Classes CSS selon la taille
  const sizeClasses = {
    small: 'badge-sm',
    normal: '',
    large: 'badge-lg'
  };

  // Générer l'URL complète pour un port
  function getPortUrl(port) {
    if (!serverIp) return null;
    const protocol = port.port === 443 ? 'https' : 'http';
    const portSuffix = (port.port === 80 || port.port === 443) ? '' : `:${port.port}`;
    return `${protocol}://${serverIp}${portSuffix}${servicePath || ''}`;
  }

  // Port principal (le premier)
  $: primaryPort = ports?.[0];
  $: primaryUrl = primaryPort ? getPortUrl(primaryPort) : null;
</script>

{#if ports && ports.length > 0}
  <div class="inline-flex items-center gap-1">
    {#if ports.length === 1}
      <!-- Un seul port : affichage simple -->
      <div class="badge badge-primary {sizeClasses[size]}">
        {#if showLabels && primaryPort.label}
          {primaryPort.label}:
        {/if}
        {primaryPort.port}
        {#if primaryUrl}
          <a href={primaryUrl} target="_blank" class="ml-1 opacity-70 hover:opacity-100" aria-label="Open port {primaryPort.port} in new tab">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        {/if}
      </div>
    {:else}
      <!-- Plusieurs ports : dropdown ou liste -->
      <div class="dropdown dropdown-hover">
        <div tabindex="0" role="button" class="badge badge-primary {sizeClasses[size]} cursor-pointer">
          {ports.length} port{ports.length > 1 ? 's' : ''}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          {#each ports as port, index}
            <div class="flex items-center justify-between py-1 px-2 hover:bg-base-200 rounded">
              <div class="flex items-center gap-2">
                <span class="badge badge-xs badge-outline">{port.port}</span>
                {#if showLabels && port.label}
                  <span class="text-sm">{port.label}</span>
                {/if}
              </div>
              {#if getPortUrl(port)}
                 <a href={getPortUrl(port)} target="_blank" class="btn btn-ghost btn-xs" aria-label="Open port {port.port} in new tab">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{:else}
  <!-- Aucun port défini -->
  <div class="badge badge-ghost {sizeClasses[size]} opacity-50">
    Aucun port
  </div>
{/if}

<style>

</style>
