<script>
  import { router } from '@inertiajs/svelte';
  import ActionButton from './ActionButton.svelte';
  
  // Props
  export let service = {};
  
  // Functions
  function viewService() {
    router.visit(`/services/${service.id}`);
  }
  
  function editService() {
    router.visit(`/services/${service.id}/edit`);
  }
  
  function deleteService() {
    if (confirm('Are you sure you want to delete this service?')) {
      router.delete(`/services/${service.id}`);
    }
  }
  
  function toggleService() {
    router.patch(`/services/${service.id}/toggle`);
  }
</script>

<!-- Service Card Component -->
<div class="service-card">
  <div class="service-card__header">
    <h3 class="service-card__title">{service.name || 'Unnamed Service'}</h3>
    <div class="service-card__status" class:running={service.status === 'running'} class:stopped={service.status === 'stopped'}>
      {service.status || 'unknown'}
    </div>
  </div>
  
  <div class="service-card__content">
    {#if service.port}
      <p class="service-card__port">
        <strong>Port:</strong> {service.port}
      </p>
    {/if}
    
    {#if service.description}
      <p class="service-card__description">
        {service.description}
      </p>
    {/if}
    
    {#if service.server}
      <p class="service-card__server">
        <strong>Server:</strong> {service.server.name}
      </p>
    {/if}
  </div>
  
  <div class="service-card__actions">
    <ActionButton variant="primary" size="sm" on:click={viewService}>
      View
    </ActionButton>
    <ActionButton variant="secondary" size="sm" on:click={editService}>
      Edit
    </ActionButton>
    <ActionButton 
      variant={service.status === 'running' ? 'warning' : 'success'} 
      size="sm" 
      on:click={toggleService}
    >
      {service.status === 'running' ? 'Stop' : 'Start'}
    </ActionButton>
    <ActionButton variant="danger" size="sm" on:click={deleteService}>
      Delete
    </ActionButton>
  </div>
</div>

<style>
  /* Service Card styles will go here */
  .service-card {
    /* Base card styles */
  }
  
  .service-card__header {
    /* Header styles */
  }
  
  .service-card__title {
    /* Title styles */
  }
  
  .service-card__status {
    /* Status styles */
  }
  
  .service-card__status.running {
    /* Running status styles */
  }
  
  .service-card__status.stopped {
    /* Stopped status styles */
  }
  
  .service-card__content {
    /* Content styles */
  }
  
  .service-card__port,
  .service-card__description,
  .service-card__server {
    /* Content item styles */
  }
  
  .service-card__actions {
    /* Actions styles */
  }
</style>
