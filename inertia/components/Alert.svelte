<script>
  // Props for the alert
  export let type = 'info'; // success, error, warning, info
  export let title = '';
  export let dismissible = true;
  export let show = true;
  
  // Functions
  function dismiss() {
    show = false;
  }
</script>

{#if show}
  <!-- Alert Component -->
  <div class="alert alert--{type}" role="alert">
    <div class="alert__content">
      {#if title}
        <h4 class="alert__title">{title}</h4>
      {/if}
      <div class="alert__message">
        <slot />
      </div>
    </div>
    
    {#if dismissible}
      <button 
        class="alert__close" 
        on:click={dismiss}
        aria-label="Close alert"
      >
        ×
      </button>
    {/if}
  </div>
{/if}

<style>
  /* Alert styles will go here */
  .alert {
    /* Base alert styles */
  }
  
  .alert--success {
    /* Success variant styles */
  }
  
  .alert--error {
    /* Error variant styles */
  }
  
  .alert--warning {
    /* Warning variant styles */
  }
  
  .alert--info {
    /* Info variant styles */
  }
  
  .alert__content {
    /* Content styles */
  }
  
  .alert__title {
    /* Title styles */
  }
  
  .alert__message {
    /* Message styles */
  }
  
  .alert__close {
    /* Close button styles */
  }
</style>
