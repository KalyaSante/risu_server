<script>
  // Props for the action button
  export let href = '#';
  export let variant = 'primary'; // primary, secondary, danger, etc.
  export let size = 'md'; // sm, md, lg
  export let disabled = false;
  export let loading = false;
  export let type = 'button'; // button, submit, reset
</script>

<!-- Action Button Component -->
<button
  class="action-button btn btn-soft btn-{variant} btn-{size}"
  {type}
  {disabled}
  class:loading
  on:click
>
  <slot />
</button>

<style>
  /* Button styles will go here */
  .action-button {
    /* Base button styles */
  }

  .action-button--primary {
    /* Primary variant styles */
  }

  .action-button--secondary {
    /* Secondary variant styles */
  }

  .action-button--danger {
    /* Danger variant styles */
  }

  .action-button--sm {
    /* Small size styles */
  }

  .action-button--md {
    /* Medium size styles */
  }

  .action-button--lg {
    /* Large size styles */
  }

  .loading {
    /* Loading state styles */
  }
</style>
