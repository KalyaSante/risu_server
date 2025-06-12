<script>
  import { router } from '@inertiajs/svelte';
  import ActionButton from './ActionButton.svelte';
  
  // Props
  export let server = {};
  
  // Functions
  function viewServer() {
    router.visit(`/servers/${server.id}`);
  }
  
  function editServer() {
    router.visit(`/servers/${server.id}/edit`);
  }
  
  function deleteServer() {
    if (confirm('Are you sure you want to delete this server?')) {
      router.delete(`/servers/${server.id}`);
    }
  }
</script>

<!-- Server Card Component -->
<div class="server-card">
  <div class="server-card__header">
    <h3 class="server-card__title">{server.name || 'Unnamed Server'}</h3>
    <div class="server-card__status" class:online={server.status === 'online'} class:offline={server.status === 'offline'}>
      {server.status || 'unknown'}
    </div>
  </div>
  
  <div class="server-card__content">
    {#if server.ip}
      <p class="server-card__ip">
        <strong>IP:</strong> {server.ip}
      </p>
    {/if}
    
    {#if server.description}
      <p class="server-card__description">
        {server.description}
      </p>
    {/if}
    
    {#if server.services_count}
      <p class="server-card__services">
        <strong>Services:</strong> {server.services_count}
      </p>
    {/if}
  </div>
  
  <div class="server-card__actions">
    <ActionButton variant="primary" size="sm" on:click={viewServer}>
      View
    </ActionButton>
    <ActionButton variant="secondary" size="sm" on:click={editServer}>
      Edit
    </ActionButton>
    <ActionButton variant="danger" size="sm" on:click={deleteServer}>
      Delete
    </ActionButton>
  </div>
</div>

<style>
  /* Server Card styles will go here */
  .server-card {
    /* Base card styles */
  }
  
  .server-card__header {
    /* Header styles */
  }
  
  .server-card__title {
    /* Title styles */
  }
  
  .server-card__status {
    /* Status styles */
  }
  
  .server-card__status.online {
    /* Online status styles */
  }
  
  .server-card__status.offline {
    /* Offline status styles */
  }
  
  .server-card__content {
    /* Content styles */
  }
  
  .server-card__ip,
  .server-card__description,
  .server-card__services {
    /* Content item styles */
  }
  
  .server-card__actions {
    /* Actions styles */
  }
</style>
